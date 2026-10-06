/* =========================================================================
   ЧайЧак stories — chakchak.js
   Вкладки «Классический / Шоколадный» и физическая горка чак-чака (Matter.js).
   Matter грузится лениво, когда блок подходит к экрану. На экранах < 768px,
   при reduced motion или если библиотека не загрузилась — вместо canvas
   остаётся фото в арке (атрибут data-fallback на секции).
   ========================================================================= */
(function () {
  'use strict';
  var CC = window.CC, $ = CC.$, $$ = CC.$$;
  var MATTER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js';

  var sec = $('#chakchak');
  var physics = null;      // API горки после инициализации
  var kind = 'honey';      // какие палочки сыплем сейчас

  /* ---------- Вкладки (работают и без физики) ---------- */
  var tabs = $$('[role="tab"]', sec), pics = $$('.chak__pic', sec), panel = $('#chak-panel');
  function select(tab, focus) {
    kind = tab.getAttribute('data-kind');
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    pics.forEach(function (p) { p.classList.toggle('is-on', p.getAttribute('data-kind') === kind); });
    panel.setAttribute('aria-labelledby', tab.id);
    if (focus) tab.focus();
    if (physics) physics.pour(14); // горсть нового цвета
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      select(tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length], true);
    });
  });

  /* ---------- Нужна ли физика ---------- */
  if (CC.reduce || window.matchMedia('(max-width: 767px)').matches) {
    sec.setAttribute('data-fallback', '');
    return;
  }

  var stage = $('[data-chak-stage]', sec), canvas = $('.chak__canvas', sec), pourBtn = $('[data-pour]', sec);

  function loadMatter(cb) {
    if (window.Matter) return cb();
    var s = document.createElement('script');
    s.src = MATTER_SRC; s.async = true;
    s.onload = cb;
    s.onerror = function () { sec.setAttribute('data-fallback', ''); };
    document.head.appendChild(s);
  }

  // грузим заранее, за ~700px до блока
  var near = new IntersectionObserver(function (en) {
    if (!en[0].isIntersecting) return;
    near.disconnect();
    loadMatter(function () {
      try { physics = createPhysics(); }
      catch (e) { sec.setAttribute('data-fallback', ''); return; }
      watchVisibility();
    });
  }, { rootMargin: '700px 0px' });
  near.observe(stage);

  function watchVisibility() {
    var first = true;
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) {
        physics.start();
        if (first) { first = false; physics.pour(80); }
      } else physics.stop(); // пауза Runner вне экрана
    }, { threshold: 0.15 }).observe(stage);
  }

  pourBtn.addEventListener('click', function () { if (physics) physics.pour(25); });

  /* ---------- Физика: логическая сцена 600×600, масштабируется под canvas ---------- */
  function createPhysics() {
    var M = window.Matter;
    var Engine = M.Engine, Runner = M.Runner, Bodies = M.Bodies, Body = M.Body, Composite = M.Composite, Events = M.Events;
    var SIZE = 600, MAX = 160;

    var engine = Engine.create();
    engine.gravity.y = 1;
    engine.positionIterations = 8;
    engine.velocityIterations = 6;
    var world = engine.world;

    // пиала: дно — полуэллипс из статичных сегментов (рисунок пиалы — в SVG с тем же viewBox)
    var cx = 300, rimY = 430, rx = 244, ry = 92, th = 28, N = 20, statics = [];
    for (var i = 0; i < N; i++) {
      var t0 = i / N * Math.PI, t1 = (i + 1) / N * Math.PI, tm = (t0 + t1) / 2;
      var x0 = cx + rx * Math.cos(t0), y0 = rimY + ry * Math.sin(t0);
      var x1 = cx + rx * Math.cos(t1), y1 = rimY + ry * Math.sin(t1);
      var nx = Math.cos(tm) / rx, ny = Math.sin(tm) / ry, nl = Math.hypot(nx, ny);
      nx /= nl; ny /= nl; // нормаль наружу
      statics.push(Bodies.rectangle((x0 + x1) / 2 + nx * th / 2, (y0 + y1) / 2 + ny * th / 2,
        Math.hypot(x1 - x0, y1 - y0) + 8, th, { isStatic: true, angle: Math.atan2(y1 - y0, x1 - x0), friction: .9 }));
    }
    // стол и стенки за краями canvas
    statics.push(Bodies.rectangle(300, 556 + 40, 1600, 80, { isStatic: true, friction: .9 }));
    statics.push(Bodies.rectangle(-40, 300, 80, 1600, { isStatic: true }));
    statics.push(Bodies.rectangle(640, 300, 80, 1600, { isStatic: true }));
    // невидимый «палец»: мягко расталкивает палочки
    var finger = Bodies.circle(-300, -300, 34, { isStatic: true });
    statics.push(finger);
    Composite.add(world, statics);

    var sticks = [];
    function addStick() {
      var w = 21 + Math.random() * 15, h = 10 + Math.random() * 3.5;
      var b = Bodies.rectangle(250 + Math.random() * 100, -30 - Math.random() * 90, w, h, {
        chamfer: { radius: h * .46 }, angle: Math.random() * Math.PI,
        friction: .55, frictionStatic: .9, restitution: .04, density: .0016, slop: .03
      });
      b.cc = { w: w, h: h, kind: kind, tone: Math.random() };
      Composite.add(world, b);
      sticks.push(b);
      if (sticks.length > MAX) Composite.remove(world, sticks.shift()); // старые уходят
    }
    var pourTimer = 0, queue = 0;
    function pour(n) { // партиями по 4 штуки, а не все разом
      queue += n;
      if (pourTimer) return;
      pourTimer = setInterval(function () {
        for (var k = 0; k < 4 && queue > 0; k++, queue--) addStick();
        if (queue <= 0) { clearInterval(pourTimer); pourTimer = 0; }
      }, 95);
    }

    // --- canvas ---
    var ctx = canvas.getContext('2d'), scale = 1, dpr = 1;
    function resize() {
      var r = stage.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      scale = canvas.width / SIZE;
    }
    resize();
    new ResizeObserver(resize).observe(stage);

    // градиенты в локальных координатах палочки (одна высота ~ 14)
    function grad(top, mid, bottom) {
      var g = ctx.createLinearGradient(0, -7, 0, 7);
      g.addColorStop(0, top); g.addColorStop(.45, mid); g.addColorStop(1, bottom);
      return g;
    }
    var fills = {
      honey: [grad('#F8D48A', '#E2A645', '#A9661A'), grad('#F0C46C', '#D08F2E', '#94560F')],
      choco: [grad('#6A4128', '#4A2A18', '#2E190D'), grad('#5C3720', '#3F2414', '#26140A')]
    };
    var shine = { honey: 'rgba(255, 244, 210, .62)', choco: 'rgba(255, 220, 180, .25)' };
    var edge = { honey: 'rgba(130, 70, 10, .45)', choco: 'rgba(0, 0, 0, .35)' };
    var pore = { honey: 'rgba(150, 82, 14, .45)', choco: 'rgba(0, 0, 0, .3)' };

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
    }
    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < sticks.length; i++) {
        var b = sticks[i], d = b.cc, hw = d.w / 2, hh = d.h / 2, r = d.h * .46;
        var c = Math.cos(b.angle) * scale, s = Math.sin(b.angle) * scale;
        ctx.setTransform(c, s, -s, c, b.position.x * scale, b.position.y * scale);
        // тень снизу
        ctx.fillStyle = 'rgba(36, 23, 15, .16)';
        roundRect(-hw + .5, -hh + 1.6, d.w, d.h, r); ctx.fill();
        // тело с медовым (или шоколадным) градиентом
        ctx.fillStyle = fills[d.kind][d.tone > .5 ? 1 : 0];
        roundRect(-hw, -hh, d.w, d.h, r); ctx.fill();
        ctx.strokeStyle = edge[d.kind]; ctx.lineWidth = .8; ctx.stroke();
        // блик мёда и «пористость» теста
        ctx.strokeStyle = shine[d.kind]; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-hw + r, -hh + 2.6); ctx.lineTo(hw - r * 1.4, -hh + 2.6); ctx.stroke();
        ctx.fillStyle = pore[d.kind];
        ctx.beginPath(); ctx.arc(-hw * .25 + d.tone * 4, hh * .25, 1.1, 0, 6.283); ctx.arc(hw * .35 - d.tone * 3, hh * .1, .9, 0, 6.283); ctx.fill();
      }
    }

    // --- курсор/палец: тело плавно догоняет указатель ---
    var target = { x: -300, y: -300 };
    function toLocal(e) {
      var r = stage.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * SIZE, y: (e.clientY - r.top) / r.height * SIZE };
    }
    stage.addEventListener('pointermove', function (e) { target = toLocal(e); });
    stage.addEventListener('pointerdown', function (e) { target = toLocal(e); });
    stage.addEventListener('pointerleave', function () { target = { x: -300, y: -300 }; });

    Events.on(engine, 'beforeUpdate', function () {
      var p = finger.position;
      if (target.x < -100) { if (p.x > -100) Body.setPosition(finger, { x: -300, y: -300 }); return; }
      if (p.x < -100) { Body.setPosition(finger, target); return; }
      Body.setPosition(finger, { x: p.x + (target.x - p.x) * .35, y: p.y + (target.y - p.y) * .35 });
    });

    var runner = Runner.create();
    Events.on(runner, 'afterTick', function () {
      // выпавшие за пределы — убираем
      for (var i = sticks.length - 1; i >= 0; i--) {
        if (sticks[i].position.y > 760) { Composite.remove(world, sticks[i]); sticks.splice(i, 1); }
      }
      draw();
    });
    var running = false;
    return {
      pour: pour,
      start: function () { if (!running) { running = true; Runner.run(runner, engine); } },
      stop: function () { if (running) { running = false; Runner.stop(runner); } }
    };
  }
})();
