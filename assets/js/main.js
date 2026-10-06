/* =========================================================================
   ЧайЧак stories — main.js
   Окружение, Lenis + ScrollTrigger, интро «Капка», шапка, чайный док, меню,
   курсор-капля, живой статус «открыто/закрыто», reveal заголовков и блоков.
   Сцены (scenes.js), горка (chakchak.js) и stories (stories.js) регистрируются
   через CC.on(), а stories.js последним вызывает CC.boot().
   ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // Если CDN с GSAP не загрузился — показываем статичную версию (как при reduced motion)
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (!hasGsap) root.setAttribute('data-motion', 'reduce');

  var CC = window.CC = {
    $: $, $$: $$,
    reduce: root.getAttribute('data-motion') === 'reduce',
    gsap: hasGsap,
    isMobile: function () { return window.matchMedia('(max-width: 767px)').matches; },
    lenis: null,
    inits: [],
    on: function (fn) { this.inits.push(fn); },
    boot: boot
  };

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Плавный скролл: Lenis, синхронизированный со ScrollTrigger ---------- */
  function setupLenis() {
    if (CC.reduce || !window.Lenis) return;
    var lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    CC.lenis = lenis;
  }

  /* ---------- Якоря: плавно через Lenis, с переносом фокуса ---------- */
  function setupAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (CC.lenis) CC.lenis.scrollTo(target, { duration: 1.5 });
      else target.scrollIntoView();
      if (history.replaceState) history.replaceState(null, '', id);
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* ---------- Шапка: прячется при скролле вниз, появляется при скролле вверх ---------- */
  function setupHeader() {
    var hdr = $('[data-hdr]');
    var last = window.scrollY, ticking = false;
    function update() {
      var y = window.scrollY;
      hdr.classList.toggle('is-scrolled', y > 40);
      if (y > 120 && y > last + 4) hdr.classList.add('is-hidden');
      else if (y < last - 4 || y <= 120) hdr.classList.remove('is-hidden');
      last = y; ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- Чайный док: выезжает после hero, подсвечивает текущий раздел ---------- */
  function setupDock() {
    var dock = $('[data-dock]');
    var links = $$('[data-dock-link]');
    var hero = $('#top');
    function setActive(id) {
      links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + id); });
    }
    // какой пункт дока подсвечивать в каком разделе
    var map = { chay: 'chay', chakchak: 'chakchak', polka: 'chay', sandyk: 'sandyk', kuchtenech: 'kuchtenech', stories: 'stories', tabyn: 'tabyn', rahmat: '', adres: 'adres', sau: 'adres' };

    if (!hasGsap) {
      var io = new IntersectionObserver(function (en) { dock.classList.toggle('is-on', !en[0].isIntersecting); }, { threshold: 0.2 });
      io.observe(hero);
      return;
    }
    ScrollTrigger.create({
      trigger: hero, start: 'bottom 75%',
      onEnter: function () { dock.classList.add('is-on'); },
      onLeaveBack: function () { dock.classList.remove('is-on'); }
    });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 55%', end: 'bottom 55%',
        onToggle: function (self) { if (self.isActive) setActive(map[id]); }
      });
    });
  }

  /* ---------- Мобильное меню ---------- */
  var menu, menuBtn;
  function openMenu() {
    menu.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Закрыть меню');
    if (CC.lenis) CC.lenis.stop();
    $$('.menu__list li', menu).forEach(function (li, i) {
      li.style.animation = 'none'; void li.offsetWidth;
      li.style.animation = '';
      li.style.animationDelay = (i * 55) + 'ms';
    });
    var first = $('a', menu); if (first) first.focus();
  }
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Открыть меню');
    if (CC.lenis) CC.lenis.start();
  }
  function setupMenu() {
    menu = $('[data-menu]'); menuBtn = $('[data-menu-btn]');
    menuBtn.addEventListener('click', function () { if (menu.hidden) openMenu(); else { closeMenu(); menuBtn.focus(); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { closeMenu(); menuBtn.focus(); } });
  }

  /* ---------- Курсор-капля: lerp, контекстные состояния ---------- */
  function setupCursor() {
    if (CC.reduce || !window.matchMedia('(pointer: fine)').matches) return;
    root.setAttribute('data-cursor-on', '');
    var el = $('.cursor'), label = $('.cursor__label', el);
    var tx = -100, ty = -100, x = -100, y = -100;
    var labels = { look: 'смотреть', touch: 'трогать', nav: '‹ ›' };
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('[data-cursor]');
      var state = t ? t.getAttribute('data-cursor') : '';
      // над кнопками внутри stories — обычная капля
      if (e.target.closest('button:not(.story__zone), a, input')) state = '';
      if (state) { el.setAttribute('data-state', state); label.textContent = labels[state]; }
      else el.removeAttribute('data-state');
    });
    window.addEventListener('pointerdown', function () { el.classList.add('is-down'); });
    window.addEventListener('pointerup', function () { el.classList.remove('is-down'); });
    document.addEventListener('mouseleave', function () { tx = ty = -100; });
    gsap.ticker.add(function () {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    });
  }

  /* ---------- Живой статус по времени Казани (Europe/Moscow, UTC+3) ---------- */
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function kazanNow() {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Moscow', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    return { day: DAYS.indexOf(o.weekday), min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
  }
  // часы работы: пн–сб 09:00–19:00, вс 10:00–18:00 (в минутах от полуночи)
  function hoursOf(day) { return day === 0 ? [600, 1080] : [540, 1140]; }
  function hhmm(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }
  function computeStatus() {
    var now = kazanNow(), h = hoursOf(now.day);
    if (now.min < h[0]) return { state: 'closed', full: 'Откроемся сегодня в ' + hhmm(h[0]), short: 'Откроемся в ' + hhmm(h[0]), day: now.day };
    if (now.min >= h[1]) {
      var t = hoursOf((now.day + 1) % 7);
      return { state: 'closed', full: 'Откроемся завтра в ' + hhmm(t[0]), short: 'Завтра с ' + hhmm(t[0]), day: now.day };
    }
    if (h[1] - now.min <= 30) return { state: 'soon', full: 'Скоро закрываемся · до ' + hhmm(h[1]), short: 'Скоро закрываемся', day: now.day };
    return { state: 'open', full: 'Сейчас открыто · чай уже заварен · до ' + hhmm(h[1]), short: 'Открыто до ' + hhmm(h[1]), day: now.day };
  }
  function setupStatus() {
    function render() {
      var s = computeStatus();
      $$('[data-status]').forEach(function (el) {
        el.setAttribute('data-state', s.state);
        var t = $('.status__text', el);
        // в шапке на узких экранах — короткая версия
        t.textContent = el.hasAttribute('data-short') && window.innerWidth < 1180 ? s.short : s.full;
      });
      $$('[data-hours] tr').forEach(function (tr) {
        var isSun = tr.getAttribute('data-days') === '0';
        tr.classList.toggle('is-today', isSun === (s.day === 0));
      });
    }
    render();
    setInterval(render, 30000);
    window.addEventListener('resize', render);
    CC.status = computeStatus;
  }

  /* ---------- Сплиттеры: слова под маской и буквы ---------- */
  function splitWords(el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          // делим только по обычным пробелам: &nbsp; остаётся внутри слова и держит перенос
          var parts = n.textContent.split(/([ \t\n\r]+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^[ \t\n\r]+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = p;
            w.appendChild(wi); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    })(el);
    return $$('.wi', el);
  }
  function splitLetters(el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.from(n.textContent).forEach(function (c) {
            var s = document.createElement('span'); s.className = 'ch'; s.textContent = c;
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    el.setAttribute('aria-label', el.textContent);
    return $$('.ch', el);
  }
  CC.splitLetters = splitLetters;

  /* ---------- Reveal по умолчанию ---------- */
  function setupReveals() {
    if (CC.reduce) return;
    var ease = 'expo.out';

    // татарская строка — проявление буквами
    $$('[data-letters]').forEach(function (el) {
      if (el.closest('.hero')) return; // в hero своя интро-анимация
      var chars = splitLetters(el);
      gsap.set(chars, { opacity: 0, y: '0.3em' });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () { gsap.to(chars, { opacity: 1, y: 0, duration: .8, stagger: .025, ease: ease }); }
      });
    });

    // H2 — по словам из-под маски
    $$('[data-words]').forEach(function (el) {
      var words = splitWords(el);
      gsap.set(words, { yPercent: 110 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () { gsap.to(words, { yPercent: 0, duration: 1, stagger: .06, ease: ease }); }
      });
    });

    // блоки — opacity + translateY(32px), stagger внутри пачки
    gsap.set('[data-reveal]', { opacity: 0, y: 32 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: function (batch) { gsap.to(batch, { opacity: 1, y: 0, duration: .9, stagger: .075, ease: ease, overwrite: true }); }
    });

    // фото — раскрытие арочной маски снизу вверх
    $$('[data-arch-reveal]').forEach(function (el) {
      ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: function () { el.classList.add('is-in'); } });
    });

    // золотая нить — прорисовка на скролле
    $$('[data-thread]').forEach(function (el) {
      gsap.fromTo(el, { '--draw': 1 }, {
        '--draw': 0, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 45%', scrub: true }
      });
    });

    // финальный тюльпан дорисовывается последним — визит закончился там, где начался
    var fin = $('[data-fin-tulip]');
    if (fin) gsap.fromTo(fin, { '--draw': 1 }, {
      '--draw': 0, ease: 'none',
      scrollTrigger: { trigger: '#sau', start: 'top 70%', end: 'center 45%', scrub: true }
    });
  }

  /* ---------- Hero: интро-анимация после ворот + параллакс арки ---------- */
  function heroIntro() {
    if (CC.reduce) return;
    var ease = 'expo.out';
    var letters = splitLetters($('.hero [data-letters]'));
    var tl = gsap.timeline();
    tl.set('.hero [data-letters]', { opacity: 1 })
      .fromTo(letters, { opacity: 0, y: '0.3em' }, { opacity: 1, y: 0, duration: .8, stagger: .025, ease: ease }, 0)
      // y: 0 обязателен — иначе GSAP прочитает translateY(105%) из CSS как пиксели и оставит их
      .fromTo('.hero__li', { y: 0, yPercent: 105 }, { y: 0, yPercent: 0, duration: 1.05, stagger: .12, ease: ease }, .12)
      .fromTo('[data-hero-arch] > picture', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' }, .05)
      .fromTo('.hero__line-svg', { '--draw': 1 }, { '--draw': 0, duration: 1.5, ease: 'power2.inOut' }, .35)
      .fromTo('[data-hero-fade]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .9, stagger: .08, ease: ease }, .5);

    // арка уходит медленнее текста
    gsap.to('.hero__media', {
      yPercent: 12, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- Интро «Капка»: ворота, 1,5 с, раз за сессию ---------- */
  function kapka(onOpen) {
    var k = $('[data-kapka-root]'), skip = $('[data-kapka-skip]');
    if (root.hasAttribute('data-kapka') || !k) {
      if (k) k.remove(); if (skip) skip.remove();
      onOpen(); return;
    }
    try { sessionStorage.setItem('cc-kapka', '1'); } catch (e) {}
    if (CC.lenis) CC.lenis.stop();
    var opened = false, finished = false;
    function open() { if (opened) return; opened = true; k.classList.add('is-open'); onOpen(); }
    function finish() {
      if (finished) return; finished = true; open();
      k.remove(); if (skip) skip.remove();
      root.setAttribute('data-kapka', 'done');
      if (CC.lenis) CC.lenis.start();
    }
    if (skip) skip.addEventListener('click', function () { finish(); var m = $('#main'); m.setAttribute('tabindex', '-1'); m.focus(); });
    requestAnimationFrame(function () {
      k.classList.add('is-draw');          // 0,6 с — тюльпан дорисовывается
      setTimeout(open, 620);                // 0,8 с — створки расходятся
      setTimeout(finish, 1500);
    });
  }

  /* ---------- Загрузка: инициализация в правильном порядке ---------- */
  var booted = false;
  function boot() {
    if (booted) return; booted = true;
    setupStatus();
    setupAnchors();
    setupHeader();
    setupMenu();
    if (hasGsap) setupLenis();
    setupDock();
    if (hasGsap) setupCursor();

    // сцены регистрируются в DOM-порядке (pin-сцены сверху вниз)
    CC.inits.forEach(function (fn) {
      try { fn(); } catch (err) { if (window.console) console.error('[CC] init', fn.name, err); }
    });

    if (hasGsap) {
      setupReveals();
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      // после догрузки картинок и шрифтов размеры могут сдвинуться
      window.addEventListener('load', function () { ScrollTrigger.refresh(); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    kapka(heroIntro);
  }
})();
