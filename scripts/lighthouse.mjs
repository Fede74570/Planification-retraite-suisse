// Lighthouse (mobile) budget check: every category ≥ 95 on the key pages.
// Usage: npm run build && npm run preview -- --port 4173 & npm run lighthouse
// Chrome: CHROME_PATH (defaults to the pre-installed Playwright Chromium).
import fs from 'node:fs';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const BASE = process.env.LH_BASE ?? 'http://localhost:4173';
const PAGES = ['/', '/app#exemple', '/methode'];
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const MIN = Number(process.env.LH_MIN ?? 95);
const chromePath =
  process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';

const chrome = await chromeLauncher.launch({
  chromePath: fs.existsSync(chromePath) ? chromePath : undefined,
  chromeFlags: ['--headless=new', '--no-sandbox'],
});
let failed = false;
try {
  for (const page of PAGES) {
    // Best of 2 runs to smooth out noise on shared machines.
    const scores = [];
    for (let i = 0; i < 2; i++) {
      const r = await lighthouse(BASE + page, {
        port: chrome.port,
        output: 'json',
        logLevel: 'error',
        formFactor: 'mobile',
        onlyCategories: CATEGORIES,
      });
      scores.push(
        Object.fromEntries(
          CATEGORIES.map((c) => [c, Math.round((r.lhr.categories[c].score ?? 0) * 100)]),
        ),
      );
    }
    const best = Object.fromEntries(
      CATEGORIES.map((c) => [c, Math.max(...scores.map((s) => s[c]))]),
    );
    const ok = CATEGORIES.every((c) => best[c] >= MIN);
    failed ||= !ok;
    console.log(
      `${ok ? '✓' : '✗'} ${page.padEnd(14)} ${CATEGORIES.map((c) => `${c} ${best[c]}`).join(' · ')}`,
    );
  }
} finally {
  await chrome.kill();
}
process.exit(failed ? 1 : 0);
