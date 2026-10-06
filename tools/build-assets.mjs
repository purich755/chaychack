// Сборка фото сайта: кроп → ресайз → .webp + .jpg в assets/img/.
//   node tools/build-assets.mjs
// crop — доли исходника [left, top, width, height]; w — ширины на выходе (без увеличения).
// Если webp тяжелее jpg — понижаем качество webp, пока он не станет легче (шумные кадры).
import sharp from 'sharp';
import fs from 'node:fs';

const YA = (n) => `raw/photos/${n}.jpg`;
const TG = (n) => `raw/tg/img/${n}.jpg`;

const PLAN = [
  // лавка
  ['shop-hero',      YA('ya052'), [0, 0.04, 1, 0.92],        [720, 1200]],
  ['shop-interior',  YA('ya028'), [0, 0, 1, 1],              [900, 1400]],
  ['shop-welcome',   YA('ya016'), [0.12, 0.2, 0.76, 0.62],   [900]],
  ['shop-counter',   YA('ya045'), [0, 0.1, 1, 0.8],          [900]],
  ['shop-window',    YA('ya014'), [0.05, 0.05, 0.9, 0.8],    [900]],
  ['shop-facade',    YA('ya038'), [0, 0.02, 1, 0.9],         [900, 1300]],
  // чак-чак
  ['chakchak-plate', YA('ya016'), [0.558, 0.566, 0.29, 0.2175], [700]],
  ['chakchak-classic', YA('ya051'), [0, 0, 1, 1],            [700, 1000]],
  ['chakchak-taste', YA('ya058'), [0, 0.2, 1, 0.75],   [700, 1000]],
  ['chakchak-shelf', TG('p465-5'), [0, 0, 1, 1],             [800]],
  ['chakchak-box',   YA('ya026'), [0, 0, 1, 1],              [800]],
  // чай
  ['tea-pour',       TG('p214-0'), [0, 0, 1, 1],             [800]],
  ['tea-herbal',     TG('p450-7'), [0, 0, 1, 1],             [800]],
  ['tea-milli',      YA('ya002'), [0, 0, 1, 1],              [800]],
  ['tea-blue-pour',  TG('p018-0'), [0, 0, 1, 1],             [800]],
  ['tea-blue-packs', TG('p606-0'), [0, 0.12, 1, 0.88],       [800]],
  ['tea-stakan',     TG('p712-1'), [0, 0, 1, 1],             [800]],
  // сандыки
  ['sunduk-open',    TG('p353-6'), [0, 0, 1, 1],             [800]],
  ['sunduk-open2',   TG('p353-7'), [0, 0, 1, 1],             [800]],
  ['sunduk-engrave', TG('p725-1'), [0, 0, 1, 1],             [600]],
  ['sunduk-shop',    YA('ya025'), [0, 0, 1, 1],              [800]],
  ['sunduk-trio',    YA('ya010'), [0, 0, 1, 1],              [800]],
  ['sunduk-closed',  TG('p327-5'), [0, 0, 1, 1],             [800]],
  ['sunduk-filled',  YA('ya044'), [0, 0, 1, 1],              [800]],
  // подарки
  ['gift-set',       YA('ya004'), [0, 0, 1, 1],              [800]],
  ['gift-honey',     TG('p448-0'), [0, 0, 1, 1],             [800]],
  ['gift-sweets',    TG('p624-5'), [0, 0, 1, 1],             [800]],
  ['gift-pryanik',   YA('ya013'), [0, 0, 1, 1],              [800]],
  ['gift-wood',      TG('p258-0'), [0, 0, 1, 1],             [800]],
  ['gift-box',       YA('ya005'), [0, 0, 1, 1],              [800]],
  // выезды
  ['event-oven',     TG('p649-5'), [0, 0, 1, 1],             [533]],
  ['event-oven2',    TG('p649-3'), [0, 0, 1, 1],             [800]],
  ['event-pancakes', TG('p649-6'), [0, 0, 1, 1],             [800]],
  ['event-samovar',  TG('p242-1'), [0, 0, 1, 1],             [800]],
  ['event-tea',      TG('p649-7'), [0, 0, 1, 1],             [800]],
  ['event-table',    TG('p373-1'), [0, 0, 1, 1],             [800]],
  ['event-pitrau',   'raw/video/pitrau.jpg', [0, 0, 1, 1],   [752]],
];

fs.mkdirSync('assets/img', { recursive: true });
const sizes = {};
for (const [name, src, crop, widths] of PLAN) {
  const meta = await sharp(src).metadata();
  const [l, t, w, h] = crop;
  const box = { left: Math.round(meta.width * l), top: Math.round(meta.height * t), width: Math.round(meta.width * w), height: Math.round(meta.height * h) };
  const base = sharp(src).rotate().extract(box);
  for (const W of widths) {
    const tw = Math.min(W, box.width);
    const pipe = () => base.clone().resize({ width: tw, withoutEnlargement: true })
      // лёгкое тёплое тонирование, чтобы кадры из разных источников жили в одной гамме
      .recomb([[1.03, 0.02, 0], [0, 1, 0], [0, 0.01, 0.95]]).modulate({ saturation: 0.94 });
    const suffix = widths.length > 1 ? `-${W}` : '';
    const jpg = await pipe().jpeg({ quality: 78, mozjpeg: true, progressive: true }).toBuffer({ resolveWithObject: true });
    let q = 76, webp;
    do { webp = await pipe().webp({ quality: q, effort: 5 }).toBuffer(); q -= 6; } while (webp.length > jpg.data.length && q > 40);
    fs.writeFileSync(`assets/img/${name}${suffix}.jpg`, jpg.data);
    fs.writeFileSync(`assets/img/${name}${suffix}.webp`, webp);
    sizes[`${name}${suffix}`] = [jpg.info.width, jpg.info.height];
    console.log(`${name}${suffix}`.padEnd(24), `${jpg.info.width}×${jpg.info.height}`, `jpg ${(jpg.data.length / 1024) | 0}К webp ${(webp.length / 1024) | 0}К`);
  }
}
fs.writeFileSync('raw/sizes.json', JSON.stringify(sizes, null, 1));

// OG-картинка 1200×630 из hero-кадра
await sharp(YA('ya016')).extract({ left: 0, top: 1300, width: 3000, height: 1575 }).resize(1200, 630)
  .jpeg({ quality: 80, mozjpeg: true }).toFile('assets/img/og.jpg');
console.log('og.jpg');
