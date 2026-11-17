import {
  geoArea,
  geoCentroid,
  geoInterpolate,
  geoNaturalEarth1,
  geoPath,
  type GeoPermissibleObjects,
} from 'd3-geo';
import { select } from 'd3-selection';
import 'd3-transition'; // adds selection.transition() used by the soft zoom
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { m, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import markUrl from '@/assets/logo-mark.svg';
import { COUNTRY_BY_ISO3, GEO_TO_ISO3, type Regime } from '@/data/countries';
import world from '@/data/world-110m.json';
import { useWidth } from '@/lib/useWidth';

export const REGIME_COLOR: Record<Regime, string> = {
  CH: 'var(--red-ch)',
  EU_EFTA: 'var(--blue-fr)',
  BILATERAL: '#7fb0e0',
  BILATERAL_LIMITED: '#b9d2ea',
  NONE: '#d9dde3',
};
// Colouring waves (§9.1): EU/EFTA first, then conventions, then the rest.
const WAVE_DELAY: Record<Regime, number> = {
  CH: 0.9,
  EU_EFTA: 0.95,
  BILATERAL: 1.25,
  BILATERAL_LIMITED: 1.35,
  NONE: 1.6,
};

type CountryFeature = Feature<Geometry, { name: string }> & { id?: string };

const topo = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
const FEATURES = (
  feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>
).features as CountryFeature[];
const isoOf = (f: CountryFeature) =>
  GEO_TO_ISO3[(f.id as string | undefined) ?? f.properties.name] ?? '';
/** Main territory of a country (largest polygon): keeps overseas territories out of the zoom and arc. */
function mainland(f: CountryFeature): CountryFeature {
  if (f.geometry.type !== 'MultiPolygon') return f;
  const largest = f.geometry.coordinates.reduce(
    (best, poly) => {
      const a = geoArea({ type: 'Polygon', coordinates: poly });
      return a > best.a ? { a, poly } : best;
    },
    { a: -1, poly: f.geometry.coordinates[0]! },
  );
  return { ...f, geometry: { type: 'Polygon', coordinates: largest.poly } };
}
const CH_FEATURE = FEATURES.find((f) => isoOf(f) === 'CHE');
const CH_CENTROID: [number, number] = CH_FEATURE ? geoCentroid(CH_FEATURE) : [8.2, 46.8];

interface MapCanvasProps {
  /** Width (px) covered by an overlay panel on the right; the zoom centres in the remaining space. */
  rightInset?: number;
  selected: string | null;
  onSelect: (iso3: string) => void;
  /** Isolated legend category (others dimmed). */
  isolate: Regime | null;
  showDta: boolean;
}

/**
 * World map: outlines drawn in 900 ms, countries coloured in waves, Switzerland pulsing,
 * animated great-circle arc and soft zoom towards the selected country. Pinch/drag/wheel zoom.
 */
export function MapCanvas({
  selected,
  onSelect,
  isolate,
  showDta,
  rightInset = 0,
}: MapCanvasProps) {
  const [wrapRef, width] = useWidth<HTMLDivElement>(800);
  const height = Math.round(width * 0.52);
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const chRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [hover, setHover] = useState<{ iso3: string; x: number; y: number } | null>(null);
  // Intro: fills start transparent, then colour in waves; afterwards changes are immediate.
  const [ready, setReady] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    const t = window.setTimeout(() => setIntroDone(true), 2400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, []);

  const { path, projection } = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent(
      [
        [8, 8],
        [width - 8, height - 8],
      ],
      { type: 'Sphere' },
    );
    return { projection, path: geoPath(projection) };
  }, [width, height]);

  const chXY = projection(CH_CENTROID) ?? [0, 0];
  const chXYRef = useRef(chXY);
  useEffect(() => {
    chXYRef.current = chXY;
  });

  // Zoom & pan (pinch on mobile, wheel/drag on desktop).
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !gRef.current) return;
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([
        [-width * 0.3, -height * 0.3],
        [width * 1.3, height * 1.3],
      ])
      .on('zoom', (e) => {
        gRef.current?.setAttribute('transform', e.transform.toString());
        // Keep the Switzerland marker the same size on screen whatever the zoom.
        chRef.current?.setAttribute(
          'transform',
          `translate(${chXYRef.current[0]},${chXYRef.current[1]}) scale(${1 / e.transform.k})`,
        );
      });
    zoomRef.current = z;
    select(svgEl).call(z);
    return () => void select(svgEl).on('.zoom', null);
  }, [width, height]);

  // Soft zoom towards the selected country.
  useEffect(() => {
    const svg = svgRef.current;
    const z = zoomRef.current;
    if (!svg || !z) return;
    const found = selected ? FEATURES.find((x) => isoOf(x) === selected) : null;
    let t = zoomIdentity;
    if (found && selected !== 'CHE') {
      const f = mainland(found);
      const [[x0, y0], [x1, y1]] = path.bounds({
        type: 'FeatureCollection',
        features: [f, CH_FEATURE!],
      } as GeoPermissibleObjects);
      const free = width - rightInset;
      const k = Math.min(6, 0.75 / Math.max((x1 - x0) / free, (y1 - y0) / height));
      t = zoomIdentity
        .translate(free / 2, height / 2)
        .scale(Math.max(1, k))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    }
    select(svg)
      .transition()
      .duration(reduce ? 0 : 750)
      .call(z.transform, t);
  }, [selected, path, width, height, reduce, rightInset]);

  const arc = useMemo(() => {
    if (!selected || selected === 'CHE') return null;
    const f = FEATURES.find((x) => isoOf(x) === selected);
    if (!f) return null;
    const interp = geoInterpolate(CH_CENTROID, geoCentroid(mainland(f)));
    const coords = Array.from({ length: 48 }, (_, i) => interp(i / 47));
    return path({ type: 'LineString', coordinates: coords });
  }, [selected, path]);

  return (
    <div
      ref={wrapRef}
      className={`relative w-full overflow-hidden rounded-card bg-sky ${introDone ? 'map-ready' : ''}`}
    >
      <img
        src={markUrl}
        alt=""
        aria-hidden="true"
        width={44}
        height={44}
        className="pointer-events-none absolute top-3 left-3 z-10"
      />
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label="Carte du monde des conventions de sécurité sociale avec la Suisse"
        className="block touch-none select-none"
      >
        <defs>
          <pattern
            id="dta-hatch"
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="5" stroke="var(--navy)" strokeWidth="1" opacity="0.35" />
          </pattern>
        </defs>
        <g ref={gRef}>
          <path
            d={path({ type: 'Sphere' }) ?? ''}
            fill="#f3f8fc"
            stroke="var(--alp)"
            strokeWidth={0.6}
          />
          {FEATURES.map((f, i) => {
            const iso3 = isoOf(f);
            const c = COUNTRY_BY_ISO3.get(iso3);
            const regime = c?.regime ?? 'NONE';
            const dim = isolate !== null && regime !== isolate;
            const d = path(f) ?? '';
            return (
              <g key={`${iso3}-${i}`}>
                <path
                  d={d}
                  pathLength={1}
                  className="map-country cursor-pointer"
                  style={{
                    fill: REGIME_COLOR[regime],
                    fillOpacity: !ready ? 0 : dim ? 0.15 : selected && selected !== iso3 ? 0.6 : 1,
                    transitionDelay: reduce || introDone ? '0s' : `${WAVE_DELAY[regime]}s, 0s, 0s`,
                  }}
                  stroke="#fff"
                  strokeWidth={selected === iso3 ? 1.6 : 0.5}
                  vectorEffect="non-scaling-stroke"
                  onClick={() => iso3 && onSelect(iso3)}
                  onPointerMove={(e) => {
                    if (e.pointerType !== 'mouse') return;
                    const r = (
                      e.currentTarget.ownerSVGElement as SVGSVGElement
                    ).getBoundingClientRect();
                    setHover({ iso3, x: e.clientX - r.left, y: e.clientY - r.top });
                  }}
                  onPointerLeave={() => setHover(null)}
                >
                  <title>{c?.nameFr ?? f.properties.name}</title>
                </path>
                {showDta && c?.dta && <path d={d} fill="url(#dta-hatch)" pointerEvents="none" />}
              </g>
            );
          })}
          {arc && (
            <m.path
              key={selected}
              d={arc}
              fill="none"
              stroke="var(--navy)"
              strokeWidth={2}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduce ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
          <g ref={chRef} transform={`translate(${chXY[0]},${chXY[1]})`} pointerEvents="none">
            <circle r={9} fill="var(--red-ch)" className="ch-pulse" />
            <circle
              r={3.5}
              fill="var(--red-ch)"
              stroke="#fff"
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </g>
      </svg>
      {hover && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg bg-navy px-2.5 py-1 text-xs font-semibold text-white shadow-float"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          {COUNTRY_BY_ISO3.get(hover.iso3)?.nameFr}
        </div>
      )}
    </div>
  );
}
