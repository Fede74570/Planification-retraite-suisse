// Generates favicons, PWA icons and the Open Graph image from brand/*.svg.
// Usage: npm run gen:icons  (uses the pre-installed Playwright Chromium; outputs are committed)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public');
const icons = path.join(out, 'icons');
fs.mkdirSync(icons, { recursive: true });

const mark = fs.readFileSync(path.join(root, 'brand/logo-mark.svg'), 'utf8');
const horizontal = fs.readFileSync(path.join(root, 'brand/logo-horizontal.svg'), 'utf8');
// Fonts are inlined as data URLs (a page built with setContent cannot load file:// URLs).
const font = (f) =>
  `data:font/woff2;base64,${fs.readFileSync(path.join(root, 'node_modules', f)).toString('base64')}`;

fs.copyFileSync(path.join(root, 'brand/logo-mark.svg'), path.join(icons, 'favicon.svg'));

const wordmark = horizontal.replace(/viewBox="[^"]+"/, 'viewBox="1540 520 3440 700"');
const sized = (svg, w, h) => svg.replace('<svg ', `<svg width="${w}" height="${h}" `);

/** Square icon: `pad` = margin ratio, `bg` = background or null for transparency. */
function iconHtml(size, pad, bg) {
  const inner = Math.round(size * (1 - 2 * pad));
  return `<html><body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:${bg ?? 'transparent'}">${sized(mark, inner, inner)}</body></html>`;
}

const ICONS = [
  { file: 'favicon-32.png', size: 32, pad: 0, bg: null },
  { file: 'pwa-192.png', size: 192, pad: 0.02, bg: null },
  { file: 'pwa-512.png', size: 512, pad: 0.02, bg: null },
  // Maskable: content kept inside the 80 % safe zone.
  { file: 'maskable-512.png', size: 512, pad: 0.12, bg: '#E6F0F8' },
  { file: 'apple-touch-icon.png', size: 180, pad: 0.07, bg: '#FCFBF8' },
];

const ogHtml = `<html><head><style>
@font-face{font-family:L;src:url('${font('@fontsource-variable/literata/files/literata-latin-wght-normal.woff2')}') format('woff2');font-weight:200 900}
@font-face{font-family:I;src:url('${font('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')}') format('woff2');font-weight:100 900}
body{margin:0;width:1200px;height:630px;background:#FCFBF8;position:relative;overflow:hidden;font-family:I}
.h{position:absolute;left:72px;top:64px}
h1{position:absolute;left:72px;top:200px;margin:0;font:600 62px/1.12 L;color:#1A2A49;letter-spacing:-.01em;width:700px}
.p{position:absolute;left:72px;top:390px;display:flex;gap:14px}
.p span{background:#fff;border-radius:14px;padding:10px 16px;font:600 22px I;color:#1A2A49;box-shadow:0 4px 12px rgb(26 42 73/.08)}
.m{position:absolute;right:64px;top:70px}
svg.mt{position:absolute;left:0;bottom:0;width:1200px;height:150px}
</style></head><body>
<div class="h">${sized(wordmark, 442, 90)}</div>
<h1>Votre retraite suisse, claire en 2&nbsp;minutes.</h1>
<div class="p"><span>2 minutes</span><span>100 % privé</span><span>Paramètres 2027</span></div>
<div class="m">${sized(mark, 360, 360)}</div>
<svg class="mt" viewBox="0 0 1440 180" preserveAspectRatio="none"><path fill="#C7D8E9" opacity=".55" d="M0 140 L180 60 L300 110 L470 20 L640 120 L820 50 L980 110 L1160 30 L1300 90 L1440 60 V180 H0Z"/><path fill="#C7D8E9" d="M0 160 L240 100 L420 150 L600 90 L780 150 L960 100 L1180 150 L1440 100 V180 H0Z"/><path fill="#A3C67D" d="M0 168 Q720 140 1440 168 V180 H0Z"/></svg>
</body></html>`;

// iOS splash screens (apple-touch-startup-image), portrait: [width, height, css width, css height, dpr].
const SPLASH = [
  [1290, 2796, 430, 932, 3],
  [1284, 2778, 428, 926, 3],
  [1179, 2556, 393, 852, 3],
  [1170, 2532, 390, 844, 3],
  [1125, 2436, 375, 812, 3],
  [828, 1792, 414, 896, 2],
  [750, 1334, 375, 667, 2],
];
const stacked = fs.readFileSync(path.join(root, 'brand/logo-stacked.svg'), 'utf8');
const splashHtml = (w, h) => {
  const lw = Math.round(w * 0.46);
  return `<html><body style="margin:0;width:${w}px;height:${h}px;display:grid;place-items:center;background:#FCFBF8">${sized(stacked, lw, Math.round((lw * 1770) / 1375))}</body></html>`;
};

const browser = await chromium.launch();
const page = await browser.newPage();
for (const i of ICONS) {
  await page.setViewportSize({ width: i.size, height: i.size });
  await page.setContent(iconHtml(i.size, i.pad, i.bg));
  await page.screenshot({ path: path.join(icons, i.file), omitBackground: i.bg === null });
}
fs.mkdirSync(path.join(icons, 'splash'), { recursive: true });
for (const [w, h] of SPLASH) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(splashHtml(w, h));
  await page.screenshot({ path: path.join(icons, 'splash', `splash-${w}x${h}.png`) });
}
fs.writeFileSync(
  path.join(root, 'brand', 'splash-links.html'),
  SPLASH.map(
    ([w, h, cw, ch, dpr]) =>
      `<link rel="apple-touch-startup-image" media="(device-width: ${cw}px) and (device-height: ${ch}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)" href="/icons/splash/splash-${w}x${h}.png" />`,
  ).join('\n') + '\n',
);
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(ogHtml, { waitUntil: 'load' });
await page.evaluate(() => globalThis.document.fonts.ready);
await page.screenshot({ path: path.join(out, 'og-image.png') });
await browser.close();
console.log('icons + og-image generated');
