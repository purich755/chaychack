// Скриншоты страницы для самопроверки (настоящий Chrome через playwright-core).
//   node tools/shots.mjs [--w 1440] [--reduced] [--only 05] [--out raw/shots]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i === -1 ? d : process.argv[i + 1]; };
const W = parseInt(arg('w', '1440'), 10);
const H = parseInt(arg('h', String(W < 700 ? 780 : W <= 1024 ? 900 : Math.round(W * 0.625))), 10);
const only = arg('only', null);
const reduced = process.argv.includes('--reduced');
const URL = arg('url', 'http://localhost:8270/');
const outDir = arg('out', 'raw/shots');

// [имя, селектор, доля высоты секции от её верха (для pin-сцен — с учётом pin-spacer)]
const STOPS = [
  ['01-hero', '#top', 0],
  ['02-sips-a', '#chay', 0.04],
  ['03-sips-b', '#chay', 0.42],
  ['04-sips-c', '#chay', 0.72],
  ['05-chak', '#chakchak', 0.12],
  ['06-chak-b', '#chakchak', 0.45],
  ['07-shelf', '#polka', 0.05],
  ['08-shelf-b', '#polka', 0.36],
  ['09-blue', '#polka', 0.7],
  ['10-sandyk', '#sandyk', 0.02],
  ['11-sandyk-b', '#sandyk', 0.3],
  ['12-sandyk-c', '#sandyk', 0.62],
  ['13-kuch', '#kuchtenech', 0.0],
  ['14-kuch-b', '#kuchtenech', 0.5],
  ['15-stories', '#stories', 0.12],
  ['16-tabyn', '#tabyn', 0.05],
  ['17-tabyn-b', '#tabyn', 0.45],
  ['18-rev', '#rahmat', 0.1],
  ['19-geo', '#adres', 0.12],
  ['20-fin', '#sau', 0.0],
  ['21-foot', '.foot', 0],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ctx = await chromium.launchPersistentContext(path.join(os.tmpdir(), 'cc-shot-profile'), {
  channel: 'chrome', headless: true,
  viewport: { width: W, height: H }, deviceScaleFactor: 1, locale: 'ru-RU',
  isMobile: W < 700, hasTouch: W < 700,
  reducedMotion: reduced ? 'reduce' : 'no-preference',
});
const page = ctx.pages()[0] || (await ctx.newPage());
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
await page.addInitScript(() => { try { sessionStorage.setItem('cc-kapka', '1'); } catch (e) {} });

fs.mkdirSync(outDir, { recursive: true });
await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
await sleep(2500);
const tag = `${W}${reduced ? '-rm' : ''}`;
for (const [name, sel, frac] of STOPS) {
  if (only && !name.startsWith(only)) continue;
  const ok = await page.evaluate(([s, f]) => {
    const el = document.querySelector(s);
    if (!el) return false;
    const box = el.closest('.pin-spacer') || el;
    const r = box.getBoundingClientRect();
    const y = r.top + window.scrollY + r.height * f;
    if (window.CC && CC.lenis) CC.lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
    return true;
  }, [sel, frac]);
  if (!ok) { console.log('нет секции:', sel); continue; }
  await sleep(1600);
  await page.screenshot({ path: `${outDir}/${tag}-${name}.png` });
}
const metrics = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, h: document.documentElement.scrollHeight }));
console.log(tag, JSON.stringify(metrics));
console.log(errors.length ? 'ОШИБКИ:\n' + [...new Set(errors)].join('\n') : 'ошибок нет');
await ctx.close();
