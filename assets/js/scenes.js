/* =========================================================================
   ЧайЧак stories — scenes.js
   Pin-сцены и интерактивы блоков: «Три глотка», сандык (крышка + гравировка),
   горизонтальная полка «Күчтәнәч», синий чай с лимоном, счётчики «Табына»,
   ротация отзывов, видео печи.
   Порядок CC.on() = порядок блоков на странице (важно для pin-сцен).
   ========================================================================= */
(function () {
  'use strict';
  var CC = window.CC, $ = CC.$, $$ = CC.$$;

  /* ---------- 2. «Три глотка»: стакан наполняется на скролле ---------- */
  CC.on(function sips() {
    var pin = $('[data-sips]');
    var steps = $$('.sips__step', pin), dots = $$('[data-dot]', pin);
    var liquid = $('[data-liquid]', pin), tea = $('[data-tea]', pin);
    var milk = $('[data-milk]', pin), turb = $('[data-milk-turb]', pin), stream = $('[data-stream]', pin);
    var plate = $('[data-plate]', pin), steam = $('[data-sips-steam]', pin), outro = $('[data-sips-outro]', pin);

    // уровень жидкости: смещение группы по Y (290 — пусто, 66 — полный стакан)
    if (CC.reduce) { // статичная версия: чай с молоком уже налит
      liquid.setAttribute('transform', 'translate(0 66)');
      tea.style.fill = '#C79763';
      milk.style.opacity = '.35';
      return;
    }

    function setDot(p) {
      var i = p < .34 ? 0 : p < .67 ? 1 : 2;
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
    }
    setDot(0);

    gsap.set(liquid, { y: 292 });
    gsap.set(tea, { fill: '#B8741A' });
    gsap.set(milk, { opacity: 0 });
    gsap.set(stream, { opacity: 0, scaleY: 0, transformOrigin: '50% 0%' });
    gsap.set(plate, { xPercent: 80, opacity: 0, rotate: 18 });
    gsap.set(steam, { opacity: 0 });
    gsap.set(outro, { opacity: 0, y: 20 });
    gsap.set(steps, { opacity: 0, y: 20 });
    gsap.set(steps[0], { opacity: 1, y: 0 });

    var mm = gsap.matchMedia();
    mm.add({ mob: '(max-width: 767px)', desk: '(min-width: 768px)' }, function (ctx) {
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: pin, start: 'top top', end: ctx.conditions.mob ? '+=200%' : '+=300%',
          pin: true, scrub: 0.6, anticipatePin: 1,
          onUpdate: function (self) { setDot(self.progress); }
        }
      });
      // глоток 1: наливаем чай, цвет от янтаря к глубокому
      tl.to(liquid, { y: 150, duration: 1 }, 0)
        .to(tea, { fill: '#7A3E0E', duration: 1 }, 0)
        // глоток 2: вливается молоко, цвет уходит в карамельный
        .to(steps[0], { opacity: 0, y: -20, duration: .14 }, .9)
        .fromTo(steps[1], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .14 }, 1.02)
        .to(stream, { opacity: .95, scaleY: 1, duration: .22 }, 1.0)
        .to(milk, { opacity: .9, duration: .6 }, 1.12)
        .to(turb, { attr: { baseFrequency: '0.022 0.055' }, duration: .9 }, 1.05)
        .to(liquid, { y: 66, duration: .95 }, 1.0)
        .to(tea, { fill: '#C79763', duration: .85 }, 1.08)
        .to(stream, { opacity: 0, scaleY: .4, duration: .2 }, 1.72)
        .to(milk, { opacity: .2, duration: .45 }, 1.55)
        // глоток 3: тарелка чак-чака выезжает, над стаканом пар
        .to(steps[1], { opacity: 0, y: -20, duration: .14 }, 1.9)
        .fromTo(steps[2], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .14 }, 2.02)
        .to(plate, { xPercent: 0, opacity: 1, rotate: 0, duration: .55, ease: 'power2.out' }, 2.04)
        .to(steam, { opacity: 1, duration: .35 }, 2.2)
        .to(outro, { opacity: 1, y: 0, duration: .22 }, 2.62)
        .to({}, { duration: .14 }, 2.86);
    });
  });

  /* ---------- 4б. Синий чай: лимон меняет цвет ---------- */
  CC.on(function blueTea() {
    var btn = $('[data-lemon-btn]'), liquid = $('[data-blue-liquid]'), lemon = $('[data-lemon]');
    var ripple = $('[data-ripple]'), after = $('[data-blue-after]');
    var BLUE = '#2E4FA6', MID = '#4F4AA3', VIOLET = '#7B4C9E';
    var on = false, tl = null;

    function setBtn() {
      btn.textContent = on ? 'Вернуть как было' : 'Добавить лимон';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (!CC.gsap) { // без GSAP — мгновенная смена
      btn.addEventListener('click', function () {
        on = !on; liquid.style.fill = on ? VIOLET : BLUE;
        lemon.style.opacity = on ? 1 : 0; lemon.setAttribute('transform', 'translate(120 98) rotate(-12)');
        after.classList.toggle('is-on', on); setBtn();
      });
      return;
    }
    gsap.set(lemon, { x: 170, y: -70, rotation: -40, opacity: 0, transformOrigin: '50% 50%' });
    gsap.set(liquid, { fill: BLUE });

    btn.addEventListener('click', function () {
      on = !on; setBtn();
      if (tl) tl.kill();
      if (CC.reduce) {
        gsap.set(liquid, { fill: on ? VIOLET : BLUE });
        gsap.set(lemon, on ? { x: 120, y: 98, rotation: -12, opacity: 1 } : { opacity: 0 });
        after.classList.toggle('is-on', on);
        return;
      }
      if (on) {
        tl = gsap.timeline()
          .set(lemon, { x: 168, y: -80, rotation: -40, opacity: 0 })
          .to(lemon, { opacity: 1, duration: .15 })
          .to(lemon, { x: 120, duration: .9, ease: 'power1.out' }, '<')
          .to(lemon, { y: 98, rotation: -12, duration: .9, ease: 'bounce.out' }, '<')
          .fromTo(ripple, { attr: { r: 8 }, opacity: .8 }, { attr: { r: 76 }, opacity: 0, duration: 1, ease: 'power2.out' }, '-=.62')
          // через промежуточный фиолетово-синий, чтобы переход не был грязным
          .to(liquid, { fill: MID, duration: .6, ease: 'sine.inOut' }, '<')
          .to(liquid, { fill: VIOLET, duration: .6, ease: 'sine.inOut' })
          .add(function () { after.classList.add('is-on'); });
      } else {
        after.classList.remove('is-on');
        tl = gsap.timeline()
          .to(lemon, { y: 40, opacity: 0, duration: .5, ease: 'power2.in' })
          .to(liquid, { fill: MID, duration: .5, ease: 'sine.inOut' }, 0)
          .to(liquid, { fill: BLUE, duration: .6, ease: 'sine.inOut' });
      }
    });
  });

  /* ---------- 5. Сандык: крышка на скролле, фото всплывают, гравировка ---------- */
  CC.on(function sandyk() {
    var scene = $('[data-sandyk]'), stage = $('[data-sandyk-stage]');
    var chest = $('[data-chest]'), lid = $('[data-lid]'), floor = $('[data-chest-floor]');
    var glow = $('[data-rise-glow]'), photos = $$('[data-rise-ph]');

    if (!CC.reduce) {
      var mm = gsap.matchMedia();
      mm.add({ mob: '(max-width: 767px)', desk: '(min-width: 768px)' }, function (ctx) {
        var mob = ctx.conditions.mob;
        var pinEl = mob ? stage : scene;
        gsap.set(photos, { autoAlpha: 1, yPercent: 118, x: 0, rotation: 0, transformOrigin: '50% 100%' });
        // веер: левое и правое фото расходятся в стороны, центральное поднимается выше
        var W = function () { return $('.chest-scene', stage).offsetWidth; };
        var fan = [[-.62, -26, -9], [0, -50, 0], [.62, -26, 9]];
        var tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinEl, start: mob ? 'top 8%' : 'top top', end: mob ? '+=120%' : '+=200%',
            pin: pinEl, scrub: 0.6, anticipatePin: 1
          }
        });
        tl.fromTo(lid, { '--lid': '0deg' }, { '--lid': '104deg', duration: 1, ease: 'power2.inOut' }, 0)
          .fromTo(floor, { '--glow': 0 }, { '--glow': 1, duration: .7, ease: 'none' }, .3)
          .fromTo(glow, { opacity: 0 }, { opacity: 1, duration: .7, ease: 'none' }, .35)
          .to(photos, {
            x: function (i) { return fan[i][0] * W(); }, yPercent: function (i) { return fan[i][1]; },
            rotation: function (i) { return fan[i][2]; }, duration: .9, stagger: .16, ease: 'power2.out'
          }, .7)
          .to({}, { duration: .25 });
        // лёгкий поворот сундука вслед за скроллом — чтобы чувствовался объём
        tl.fromTo(chest, { rotateX: -12, rotateY: -26 }, { rotateX: -12, rotateY: -14, duration: 1.6, ease: 'none' }, 0);
      });
    }

    // --- Примерка гравировки ---
    var input = $('[data-engrave]'), out = $('[data-engrave-out]'), plank = $('[data-plank]');
    var wa = $('[data-wa-sandyk]'), count = $('[data-engrave-count]');
    var segs = $$('[data-orn]');
    var orn = 'tulip', burnTimer = 0;
    var PLACEHOLDER = 'Для Алсу, 2026';

    function waLink() {
      var t = input.value.trim();
      var msg = t
        ? 'Здравствуйте! Хочу сандык с гравировкой «' + t + '» (орнамент: ' + (orn === 'tulip' ? 'тюльпан' : 'без орнамента') + '). Расскажите, пожалуйста, о размерах и наполнении.'
        : 'Здравствуйте! Хочу татарский сандык. Расскажите, пожалуйста, о размерах и наполнении.';
      return 'https://wa.me/79625527198?text=' + encodeURIComponent(msg);
    }
    function burn() { // «прожиг» слева направо
      out.classList.remove('is-burn'); void out.offsetWidth; out.classList.add('is-burn');
    }
    function fit() { // длинная надпись уменьшается, чтобы целиком влезть в планку
      out.style.removeProperty('--fz');
      var base = parseFloat(getComputedStyle(out).fontSize);
      var free = plank.clientWidth - (orn === 'tulip' ? $$('.plank__orn', plank).reduce(function (a, o) { return a + o.getBoundingClientRect().width; }, 0) * 1.6 : 0) - 16;
      if (out.scrollWidth > free && free > 0) out.style.setProperty('--fz', Math.max(9, base * free / out.scrollWidth).toFixed(1) + 'px');
    }
    window.addEventListener('resize', function () { fit(); });
    function update(withBurn) {
      var t = input.value.trim();
      out.textContent = t || PLACEHOLDER;
      fit();
      plank.classList.toggle('is-placeholder', !t);
      count.textContent = input.value.length + ' / 24';
      wa.href = waLink();
      if (withBurn) burn();
    }
    input.addEventListener('input', function () {
      update(false);
      clearTimeout(burnTimer);
      burnTimer = setTimeout(burn, 180);
    });
    segs.forEach(function (b) {
      b.addEventListener('click', function () {
        orn = b.getAttribute('data-orn');
        segs.forEach(function (s) { s.setAttribute('aria-pressed', s === b ? 'true' : 'false'); });
        plank.classList.toggle('no-orn', orn === 'none');
        update(true);
      });
    });
    update(false);
  });

  /* ---------- 6. «Күчтәнәч»: горизонтальная полка ---------- */
  CC.on(function kuch() {
    var pin = $('[data-kuch]'), track = $('[data-kuch-track]'), viewport = $('[data-kuch-viewport]');
    var nEl = $('[data-kuch-n]'), bar = $('[data-kuch-bar]');
    var total = track.children.length;
    function setProgress(p) {
      p = Math.max(0, Math.min(1, p));
      bar.style.transform = 'scaleX(' + Math.max(1 / total, p) + ')';
      var n = Math.min(total, Math.round(p * (total - 1)) + 1);
      nEl.textContent = (n < 10 ? '0' : '') + n;
    }
    // мобильный и reduced motion — обычная лента со scroll-snap
    function nativeProgress() {
      var max = viewport.scrollWidth - viewport.clientWidth;
      setProgress(max > 0 ? viewport.scrollLeft / max : 0);
    }
    viewport.addEventListener('scroll', nativeProgress, { passive: true });
    setProgress(0);
    if (CC.reduce) return;

    var mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', function () {
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: function () { return '+=' + dist(); },
          pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: function (self) { setProgress(self.progress); }
        }
      });
      // лёгкий параллакс фото внутри арок
      $$('.gift__arch picture', track).forEach(function (pic) {
        gsap.fromTo(pic, { xPercent: 7 }, {
          xPercent: -7, ease: 'none',
          scrollTrigger: { trigger: pic.closest('.gift'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
        });
      });
      return function () { setProgress(0); };
    });
  });

  /* ---------- 8. «Табын»: счётчики и видео печи ---------- */
  CC.on(function tabyn() {
    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); } // 1 400
    $$('[data-count]').forEach(function (el) {
      var to = parseInt(el.getAttribute('data-count'), 10);
      var unit = el.nextElementSibling;
      el.textContent = fmt(to);
      if (CC.reduce) return;
      var o = { v: 0 };
      el.textContent = '0';
      gsap.set(unit, { opacity: 0, x: -10 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
          gsap.to(o, { v: to, duration: 1.6, ease: 'power3.out', onUpdate: function () { el.textContent = fmt(Math.round(o.v)); } });
          gsap.to(unit, { opacity: 1, x: 0, duration: .7, delay: 1.25, ease: 'expo.out' });
        }
      });
    });

    // видео играет, только когда на экране; при reduced motion — только постер
    var video = $('[data-video]');
    if (!video || CC.reduce) return;
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { video.preload = 'auto'; var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      else video.pause();
    }, { threshold: 0.25 });
    io.observe(video);
  });

  /* ---------- 9. Отзывы: большая цитата раз в 7 с + «пар» из фраз ---------- */
  CC.on(function reviews() {
    var list = $('[data-marquee]');
    if (!CC.reduce) { // дублируем ленту для бесшовного цикла
      Array.prototype.slice.call(list.children).forEach(function (li) {
        var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); list.appendChild(c);
      });
      list.classList.add('is-loop');
    }
    if (CC.reduce) return;
    var qs = $$('[data-q]'), timer = $('[data-quote-timer]'), i = 0, t = 0, visible = false;
    function run() { timer.classList.remove('is-run'); void timer.offsetWidth; timer.classList.add('is-run'); }
    function next() {
      qs[i].classList.remove('is-on');
      i = (i + 1) % qs.length;
      qs[i].classList.add('is-on');
      run();
    }
    function start() { if (t) return; run(); t = setInterval(next, 7000); }
    function stop() { clearInterval(t); t = 0; timer.classList.remove('is-run'); }
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0.3 }).observe($('[data-quotes]'));
  });

  /* ---------- 10. Карта: на тач-устройствах цвет возвращается по тапу ---------- */
  CC.on(function mapTap() {
    var m = $('.geo__map');
    m.addEventListener('pointerdown', function () { m.classList.add('is-live'); });
  });
})();
