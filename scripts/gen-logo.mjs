// Generates vector versions of the "Ma retraite Franco-Suisse" logo.
// Usage: node gen.mjs <outDir>
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';

const out = process.argv[2];
const F = (f) => {
  const b = fs.readFileSync(`node_modules/@fontsource/literata/files/${f}`);
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const italic = F('literata-latin-400-italic.woff');
const bold = F('literata-latin-700-normal.woff');

const C = {
  navy: '#1A2A49',
  blue: '#0055A3',
  red: '#DA281B',
  redFr: '#EE4135',
  sky: '#E6F0F8',
  alp: '#C7D8E9',
  meadow: '#A3C67D',
  pole: '#6E5C45',
  fur: '#9B6B40',
  furDark: '#6E4A2B',
  outline: '#4E3220',
  belly: '#D9B48A',
  muzzle: '#EDD5AE',
  ear: '#E3A98A',
  cheek: '#F0A8A0',
  nose: '#3B2416',
  mouth: '#5A2A1E',
  choco: '#6B3A20',
  chocoLine: '#4A2614',
  wrap: '#F3EBD8',
  wrapRed: '#D2302A',
  white: '#FFFFFF',
};

// Roundel drawn in the original 1715×2000 raster coordinate space.
const CX = 857,
  CY = 818,
  R = 648,
  RING = 28;

const roundel = `
<defs>
  <clipPath id="mrfs-clip"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
</defs>
<g clip-path="url(#mrfs-clip)">
  <rect x="${CX - R}" y="${CY - R}" width="${2 * R}" height="${2 * R}" fill="${C.sky}"/>
  <!-- mountains -->
  <path fill="${C.alp}" d="M180 1080 L388 820 L530 950 L740 668 L905 885 L1093 737 L1325 983 L1540 830 L1540 1500 L180 1500 Z"/>
  <path fill="${C.white}" d="M680 745 L740 668 L790 702 L760 712 L735 698 L705 742 Z"/>
  <path fill="${C.white}" d="M1045 790 L1093 737 L1148 780 L1122 808 L1088 782 Z"/>
  <!-- meadow -->
  <ellipse cx="1000" cy="1720" rx="900" ry="525" fill="${C.meadow}"/>
  <!-- poles -->
  <line x1="547" y1="434" x2="547" y2="1270" stroke="${C.pole}" stroke-width="18" stroke-linecap="round"/>
  <line x1="1167" y1="434" x2="1167" y2="1270" stroke="${C.pole}" stroke-width="18" stroke-linecap="round"/>
</g>
<!-- French flag (overhangs the ring on the left) -->
<g>
  <clipPath id="mrfs-fr"><path d="M248 452 C300 470 345 462 385 448 C440 430 495 435 538 452 L538 640 C495 625 440 622 385 640 C345 655 300 662 248 646 Z"/></clipPath>
  <g clip-path="url(#mrfs-fr)">
    <rect x="240" y="420" width="102" height="260" fill="${C.redFr}"/>
    <rect x="341" y="420" width="104" height="260" fill="${C.white}"/>
    <rect x="444" y="420" width="100" height="260" fill="${C.blue}"/>
  </g>
  <path fill="none" stroke="${C.navy}" stroke-width="7" stroke-linejoin="round" d="M248 452 C300 470 345 462 385 448 C440 430 495 435 538 452 L538 640 C495 625 440 622 385 640 C345 655 300 662 248 646 Z"/>
</g>
<!-- Swiss flag (overhangs the ring on the right) -->
<g>
  <path fill="${C.red}" stroke="${C.navy}" stroke-width="7" stroke-linejoin="round" d="M1176 442 C1240 425 1310 427 1368 446 C1400 456 1425 452 1450 440 L1450 640 C1425 652 1400 656 1368 644 C1310 624 1240 624 1176 640 Z"/>
  <rect x="1290" y="482" width="46" height="121" fill="${C.white}"/>
  <rect x="1252" y="522" width="122" height="45" fill="${C.white}"/>
</g>
<!-- ring -->
<circle cx="${CX}" cy="${CY}" r="${R + RING / 2 - 1}" fill="none" stroke="${C.navy}" stroke-width="${RING}"/>
<!-- marmot -->
<g id="mrfs-marmot" stroke-linejoin="round">
  <path fill="${C.furDark}" d="M640 1160 C600 1170 610 1250 660 1300 C700 1340 740 1340 760 1320 L760 1260 C720 1220 690 1150 640 1160 Z"/>
  <ellipse cx="778" cy="1335" rx="55" ry="23" fill="${C.furDark}"/>
  <ellipse cx="936" cy="1335" rx="55" ry="23" fill="${C.furDark}"/>
  <ellipse cx="857" cy="1125" rx="164" ry="218" fill="${C.fur}" stroke="${C.outline}" stroke-width="6"/>
  <ellipse cx="857" cy="1165" rx="102" ry="137" fill="${C.belly}"/>
  <circle cx="755" cy="730" r="31" fill="${C.fur}" stroke="${C.outline}" stroke-width="6"/>
  <circle cx="757" cy="732" r="14" fill="${C.ear}"/>
  <circle cx="960" cy="730" r="31" fill="${C.fur}" stroke="${C.outline}" stroke-width="6"/>
  <circle cx="958" cy="732" r="14" fill="${C.ear}"/>
  <ellipse cx="857" cy="815" rx="136" ry="125" fill="${C.fur}" stroke="${C.outline}" stroke-width="6"/>
  <ellipse cx="857" cy="875" rx="80" ry="62" fill="${C.muzzle}"/>
  <path d="M780 795 Q807 765 835 795" fill="none" stroke="${C.nose}" stroke-width="7" stroke-linecap="round"/>
  <path d="M880 795 Q907 765 935 795" fill="none" stroke="${C.nose}" stroke-width="7" stroke-linecap="round"/>
  <circle cx="770" cy="861" r="23" fill="${C.cheek}"/>
  <circle cx="944" cy="861" r="23" fill="${C.cheek}"/>
  <ellipse cx="857" cy="849" rx="23" ry="15" fill="${C.nose}"/>
  <path d="M818 898 Q857 935 896 898 Z" fill="${C.mouth}"/>
  <rect x="841" y="898" width="13" height="18" fill="${C.white}"/>
  <rect x="858" y="898" width="13" height="18" fill="${C.white}"/>
  <!-- chocolate bar -->
  <g transform="rotate(-8 900 1040)">
    <rect x="812" y="945" width="146" height="100" rx="4" fill="${C.choco}"/>
    <path d="M885 945 V1045 M812 993 H958" stroke="${C.chocoLine}" stroke-width="4"/>
    <rect x="818" y="1040" width="166" height="108" rx="6" fill="${C.wrap}" stroke="#D8CDB4" stroke-width="3"/>
    <rect x="818" y="1072" width="166" height="20" fill="${C.wrapRed}"/>
  </g>
  <circle cx="810" cy="1018" r="37" fill="${C.fur}" stroke="${C.outline}" stroke-width="6"/>
  <circle cx="975" cy="1000" r="37" fill="${C.fur}" stroke="${C.outline}" stroke-width="6"/>
  <circle cx="782" cy="937" r="7" fill="${C.chocoLine}"/>
  <circle cx="927" cy="919" r="7" fill="${C.chocoLine}"/>
  <circle cx="758" cy="972" r="5" fill="${C.chocoLine}"/>
</g>`;

// opentype.js toPathData() emits NaN for some values; serialise commands ourselves.
const n = (v) => (Math.round(v * 100) / 100).toString();
function toD(p) {
  return p.commands
    .map((c) =>
      c.type === 'Z'
        ? 'Z'
        : c.type === 'Q'
          ? `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
          : c.type === 'C'
            ? `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
            : `${c.type}${n(c.x)} ${n(c.y)}`,
    )
    .join('');
}
function textPath(font, str, x, y, size, fill) {
  return `<path fill="${fill}" d="${toD(font.getPath(str, x, y, size, { kerning: false }))}"/>`;
}
function width(font, str, size) {
  return font.getAdvanceWidth(str, size, { kerning: false });
}

function wordmark(cx, y1, y2, s1, s2, align = 'center') {
  const w1 = width(italic, 'Ma retraite', s1);
  const wf = width(bold, 'Franco', s2),
    wh = width(bold, '-', s2),
    wa = wf + wh,
    wb = width(bold, 'Suisse', s2);
  const x1 = align === 'center' ? cx - w1 / 2 : cx;
  const x2 = align === 'center' ? cx - (wa + wb) / 2 : cx;
  return {
    svg:
      textPath(italic, 'Ma retraite', x1, y1, s1, C.navy) +
      textPath(bold, 'Franco', x2, y2, s2, C.blue) +
      textPath(bold, '-', x2 + wf, y2, s2, C.navy) +
      textPath(bold, 'Suisse', x2 + wa, y2, s2, C.red),
    w: Math.max(w1, wa + wb),
  };
}

const svg = (vb, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
const TITLE = 'Ma retraite Franco-Suisse';

// 1. Full stacked logo (same framing as brand/logo.png)
const wm = wordmark(857, 1662, 1842, 110, 176);
fs.writeFileSync(
  path.join(out, 'logo.svg'),
  svg('0 0 1715 2000', `<rect width="1715" height="2000" fill="#fff"/>${roundel}${wm.svg}`, TITLE),
);
// 1b. Transparent, tight crop
fs.writeFileSync(
  path.join(out, 'logo-stacked.svg'),
  svg('170 130 1375 1770', roundel + wm.svg, TITLE),
);
// 2. Mark only (round, includes flag overhang)
fs.writeFileSync(path.join(out, 'logo-mark.svg'), svg('190 150 1335 1336', roundel, TITLE));
// 3. Horizontal compact: mark + wordmark on the right (height = roundel)
const hx = 1560;
const hw = wordmark(hx, 770, 1190, 300, 470, 'left');
fs.writeFileSync(
  path.join(out, 'logo-horizontal.svg'),
  svg(`190 150 ${hx - 190 + hw.w + 40} 1336`, roundel + hw.svg, TITLE),
);
console.log('ok');
