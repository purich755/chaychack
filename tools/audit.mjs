// Автопроверка: горизонтальный скролл на брейкпоинтах, ошибки консоли, битые картинки,
// шрифты для татарских букв, ссылки, статус, WhatsApp-ссылка сандыка, stories.
//   node tools/audit.mjs
import { chromium } from 'playwright-core';
import os from 'node:os'; import path from 'node:path';

const URL = 'http://localhost:8270/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WIDTHS = [360, 480, 768, 1024, 1280, 1440, 1920];
let fails = 0;
const ok = (c, msg) => { console.log((c ? '  ✓ ' : '  ✗ ') + msg); if (!c) fails++; };

for (const W of WIDTHS) {
  for (const reduced of [false, true]) {
    if (reduced && W !== 390 && W !== 1440 && W !== 360) continue;
    const ctx = await chromium.launchPersistentContext(path.join(os.tmpdir(), 'cc-audit-' + W), {
      channel: 'chrome', headless: true, viewport: { width: W, height: W < 768 ? 780 : 900 }, locale: 'ru-RU',
      isMobile: W < 768, hasTouch: W < 768, reducedMotion: reduced ? 'reduce' : 'no-preference',
    });
    const page = ctx.pages()[0] || (await ctx.newPage());
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('response', (r) => { if (r.status() >= 400 && r.url().includes('localhost')) errors.push(r.status() + ' ' + r.url()); });
    await page.goto(URL, { waitUntil: 'load' });
    await sleep(2200);
    // проходим страницу шагами, чтобы проснулись lazy-картинки и все сцены
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 500) {
      await page.evaluate((y) => { if (window.CC && CC.lenis) CC.lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); }, y);
      await sleep(70);
    }
    await sleep(800);
    const r = await page.evaluate(() => {
      const iw = innerWidth, wide = [];
      document.querySelectorAll('body *').forEach((el) => {
        if (el.closest('.kuch__track, .rings, .jars, .stories__bg, .defs, .kapka, .rise, .chest-scene, .menu, .cursor, .grain')) return;
        const b = el.getBoundingClientRect();
        if (b.width && (b.right > iw + 1 || b.left < -1) && getComputedStyle(el).position !== 'fixed') wide.push(el.tagName + '.' + el.className.toString().slice(0, 40) + ' ' + Math.round(b.left) + '..' + Math.round(b.right));
      });
      const broken = [...document.images].filter((i) => i.complete && i.src && i.naturalWidth === 0).map((i) => i.src);
      return { sw: document.documentElement.scrollWidth, iw, wide: wide.slice(0, 6), broken,
        tt: document.fonts.check('italic 24px "PT Serif"', 'әөүҗңһ'), yeseva: document.fonts.check('24px "Yeseva One"', 'Чай'),
        status: [...document.querySelectorAll('[data-status] .status__text')].map((e) => e.textContent) };
    });
    console.log(`\n${W}${reduced ? ' reduced' : ''}`);
    ok(r.sw <= r.iw, `нет горизонтального скролла (${r.sw}/${r.iw})`);
    if (r.wide.length) console.log('    выходят за край:', r.wide.join(' | '));
    ok(!r.broken.length, 'битых картинок нет ' + r.broken.join(' '));
    ok(!errors.length, 'консоль чистая ' + errors.join(' | '));
    if (W === 1440 && !reduced) {
      ok(r.tt, 'PT Serif с татарскими буквами загружен');
      ok(r.yeseva, 'Yeseva One загружен');
      ok(new Set(r.status.slice(1)).size === 1, 'статус в hero и контактах совпадает: ' + r.status.join(' / '));
      // гравировка → WhatsApp
      await page.evaluate(() => document.querySelector('#sandyk').scrollIntoView());
      await page.fill('[data-engrave]', 'Для Алсу, 2026');
      await page.click('[data-orn="none"]');
      const href = await page.getAttribute('[data-wa-sandyk]', 'href');
      ok(decodeURIComponent(href).includes('гравировкой «Для Алсу, 2026» (орнамент: без орнамента)'), 'WhatsApp-ссылка сандыка собирается');
      // синий чай
      await page.evaluate(() => { const b = document.querySelector('[data-lemon-btn]'); b.scrollIntoView(); b.click(); });
      await sleep(2000);
      const fill = await page.evaluate(() => getComputedStyle(document.querySelector('[data-blue-liquid]')).fill);
      ok(fill === 'rgb(123, 76, 158)', 'лимон перекрашивает чай: ' + fill);
      // stories: клавиатура
      await page.evaluate(() => { document.querySelector('#stories').scrollIntoView(); document.querySelector('[data-viewer]').focus(); });
      await sleep(600);
      const c0 = await page.textContent('[data-cap]');
      await page.keyboard.press('ArrowRight'); await sleep(500);
      const c1 = await page.textContent('[data-cap]');
      ok(c0 !== c1, `stories: → листает («${c0}» → «${c1}»)`);
      // горка
      const n = await page.evaluate(() => { const c = document.querySelector('.chak__canvas'); return c.width > 0 && !document.querySelector('#chakchak').hasAttribute('data-fallback'); });
      ok(n, 'горка чак-чака на canvas активна');
    }
    await ctx.close();
  }
}
console.log(fails ? `\nПРОВАЛОВ: ${fails}` : '\nВсё зелёное');
