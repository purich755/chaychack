// Точечная проверка: прокрутить к секции на долю её высоты и снять элемент крупно.
//   node tools/probe.mjs <selector-секции> <доли через запятую> <selector-кадра> [--w 1440] [--name x]
import { chromium } from 'playwright-core';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

const [sel, fracs, clipSel] = process.argv.slice(2);
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i === -1 ? d : process.argv[i + 1]; };
const W = parseInt(arg('w', '1440'), 10), H = parseInt(arg('h', String(W < 700 ? 780 : 900)), 10);
const name = arg('name', 'probe');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ctx = await chromium.launchPersistentContext(path.join(os.tmpdir(), 'cc-probe-profile'), {
  channel: 'chrome', headless: true, viewport: { width: W, height: H }, locale: 'ru-RU', isMobile: W < 700, hasTouch: W < 700,
  reducedMotion: process.argv.includes('--reduced') ? 'reduce' : 'no-preference',
});
const page = ctx.pages()[0] || (await ctx.newPage());
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.addInitScript(() => { try { sessionStorage.setItem('cc-kapka', '1'); } catch (e) {} });
await page.goto(arg('url', 'http://localhost:8270/'), { waitUntil: 'load' });
await sleep(2000);
fs.mkdirSync('raw/probe', { recursive: true });
for (const f of fracs.split(',').map(Number)) {
  await page.evaluate(([s, f]) => {
    const el = document.querySelector(s); const r = el.getBoundingClientRect();
    const y = r.top + scrollY + r.height * f;
    if (window.CC && CC.lenis) CC.lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
  }, [sel, f]);
  await sleep(1400);
  const out = `raw/probe/${name}-${W}-${f}.png`;
  if (clipSel && clipSel !== 'page') { const el = await page.$(clipSel); await el.screenshot({ path: out }); }
  else await page.screenshot({ path: out });
  console.log(out);
}
if (process.argv.includes('--eval')) console.log(await page.evaluate(arg('eval', '1')));
console.log(errors.length ? errors.join('\n') : 'ок');
await ctx.close();
