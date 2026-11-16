import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Parses the light-theme :root block of tokens.css and checks WCAG AA (4.5:1) text pairs.
const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
const vars = new Map<string, string>();
for (const m of root.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars.set(m[1]!, m[2]!.trim());

function resolve(name: string): string {
  let v = vars.get(name);
  while (v?.startsWith('var(')) v = vars.get(v.slice(6, -1));
  if (!v || !/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`token --${name} is not a hex colour`);
  return v;
}
function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(resolve(a)), luminance(resolve(b))].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (l1 + 0.05) / (l2 + 0.05);
}

const textTokens = [
  'ink',
  'ink-muted',
  'blue-fr',
  'red-ink',
  'meadow-ink',
  'marmot-ink',
  'alp-ink',
  'warning',
];
const backgrounds = ['paper', 'sky', 'white'];

describe('design tokens contrast (WCAG 2.2 AA)', () => {
  for (const fg of textTokens)
    for (const bg of backgrounds)
      it(`--${fg} on --${bg} ≥ 4.5`, () => expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5));

  it('white text on primary buttons ≥ 4.5', () => {
    expect(contrast('white', 'blue-fr')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('white', 'red-ch')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('white', 'navy')).toBeGreaterThanOrEqual(4.5);
  });
  it('chart colours keep 3:1 against paper for graphical objects (except decorative fills)', () => {
    for (const c of ['red-ch', 'blue-fr', 'marmot', 'navy'])
      expect(contrast(c, 'paper')).toBeGreaterThanOrEqual(3);
  });
});
