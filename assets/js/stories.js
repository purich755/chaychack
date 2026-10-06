/* =========================================================================
   ЧайЧак stories — stories.js
   Просмотрщик фото в формате историй: хайлайты, сегментный прогресс (5 с на кадр),
   тап по третям, удержание — пауза, свайп — смена темы с поворотом «куба»,
   клавиши ← → Esc и пробел. Автопроигрывание — только когда блок на экране.
   В конце файла — CC.boot(): этот скрипт подключается последним.
   ========================================================================= */
(function () {
  'use strict';
  var CC = window.CC, $ = CC.$, $$ = CC.$$;

  var IMG = 'assets/img/';
  // Подписи — только про то, что действительно видно на кадре
  var GROUPS = [
    { id: 'shop', title: 'Лавка', frames: [
      { src: 'shop-facade-900', alt: 'Вход в лавку под вывеской «Дом татарской продукции»', cap: 'Вывеска «Дом татарской продукции» — Мартына Межлаука, 6' },
      { src: 'shop-interior-900', alt: 'Зал лавки: стеллажи с чаем и сладостями, холодильник с напитками, сандыки', cap: 'Полки от пола до потолка: чай, сладости, подарки' },
      { src: 'shop-welcome', alt: 'Продавец за прилавком держит стеклянный чайник с чаем и тарелку чак-чака', cap: 'Чайник заварен, чак-чак на тарелке — так встречают' },
      { src: 'shop-counter', alt: 'Прилавок с чак-чаком в коробках, мягкими котиками и маленькими сандыками', cap: 'Прилавок: чак-чак, котики и маленькие сандыки' },
      { src: 'shop-window', alt: 'Окно лавки в занавесе из огоньков, расписные панно по бокам', cap: 'Окно в гирлянде огоньков' }
    ] },
    { id: 'tea', title: 'Чай', frames: [
      { src: 'tea-pour', alt: 'Чай льётся из латунного чайника в белую чашку, рядом выпечка и мёд', cap: 'Чай льётся из латунного чайника' },
      { src: 'tea-herbal', alt: 'Коробки травяного чая по-татарски с расписными этикетками', cap: 'Травяной чай по-татарски — в расписных коробках' },
      { src: 'tea-milli', alt: 'Пачка «Татар милли чәе» рядом с чашкой чая', cap: 'Татарский национальный чай' },
      { src: 'tea-blue-pour', alt: 'Синий чай льётся из френч-пресса в белую чашку', cap: 'Синий чай из френч-пресса: цвет — без красителей' },
      { src: 'tea-stakan', alt: 'Чайный стакан крупным планом, на дне листовой чай', cap: '«Чайный стакан»: листовой чай уже на дне' }
    ] },
    { id: 'chak', title: 'Чак-чак', frames: [
      { src: 'chakchak-taste-700', alt: 'Шпажки с кусочками классического и шоколадного чак-чака на прилавке', cap: 'Дегустация: классический и шоколадный — на шпажках' },
      { src: 'chakchak-box', alt: 'Золотистые палочки чак-чака в мёде крупным планом', cap: 'Крупным планом: палочки в мёде' },
      { src: 'chakchak-shelf', alt: 'Упаковки казанского чак-чака на полке', cap: 'Казанский чак-чак на полке' },
      { src: 'gift-honey', alt: 'Банки мёда рядом с брикетом чак-чака', cap: 'Мёд и чак-чак — рядом не случайно' }
    ] },
    { id: 'sunduk', title: 'Сандыки', frames: [
      { src: 'sunduk-shop', alt: 'Сандыки стопкой: от маленького наверху до большого внизу', cap: 'Стопкой — от маленького до большого' },
      { src: 'sunduk-trio', alt: 'Три стопки сандыков: с зелёным, белым и синим узором', cap: 'Зелёный, белый, синий — у каждого свой узор' },
      { src: 'sunduk-closed', alt: 'Закрытый сандык с ромбами, тиснением и замком', cap: 'Ромбы, тиснение и замок' },
      { src: 'sunduk-open2', alt: 'Открытый сандык с бирюзовым бархатом внутри', cap: 'А внутри — бархат' },
      { src: 'sunduk-engrave', alt: 'Гравировка на внутренней стороне крышки белого сандыка', cap: 'Гравировка на крышке: <i lang="tt">«Бәхет, мәхәббәт, бәрәкәт!»</i>' }
    ] },
    { id: 'gift', title: 'Подарки', frames: [
      { src: 'gift-set', alt: 'Подарочный набор в деревянной коробке на резной подставке', cap: 'Набор в деревянной коробке' },
      { src: 'gift-pryanik', alt: 'Расписные пряники «Из Татарстана с любовью»', cap: 'Пряники «Из Татарстана с любовью»' },
      { src: 'gift-box', alt: 'Коробка с надписью «Коробка счастья» в руках', cap: '«Коробка счастья»' },
      { src: 'gift-wood', alt: 'Резная деревянная шкатулка с зелёной крышкой', cap: 'Резная шкатулка из дерева' },
      { src: 'sunduk-filled', alt: 'Белый сандык с чаем, мёдом и магнитом внутри', cap: 'Сандык с наполнением: чай, мёд, сувениры' }
    ] },
    { id: 'event', title: 'Выезды', frames: [
      { src: 'event-oven', alt: 'Повар у выездной белой печи сажает блины в огонь', cap: 'Выездная печь — с живым огнём' },
      { src: 'event-pancakes', alt: 'Румяные блины на чугунной сковороде', cap: 'Блины прямо из печи' },
      { src: 'event-tea', alt: 'Ребята в меховых шапках наливают чай из самовара в стаканчики, рядом бублики', cap: 'Чай из самовара — и бублики к нему' },
      { src: 'event-samovar', alt: 'Большой латунный самовар на зимнем празднике', cap: 'Большой самовар на зимнем празднике' },
      { src: 'event-table', alt: 'Накрытый чайный стол: сухофрукты, орехи, выпечка, чайники', cap: 'Чайный стол: сухофрукты, орехи, выпечка' },
      { src: 'event-pitrau', alt: 'Огромный латунный самовар на поляне праздника «Питрау-2026»', cap: '«Питрау-2026», Заинск: самовар «Гигант»' }
    ] }
  ];
  GROUPS.forEach(function (g) { g.cover = g.frames[0].src; });
  var url = function (name) { return IMG + name + '.webp'; };

  var sec = $('#stories'), viewer = $('[data-viewer]'), story = $('[data-story]');
  var ringsEl = $('[data-rings]'), barsEl = $('[data-bars]'), capEl = $('[data-cap]'), topicEl = $('[data-topic]');
  var imgA = $('[data-img-a]'), imgB = $('[data-img-b]'), bgA = $('[data-bg-a]'), bgB = $('[data-bg-b]');
  var pauseBtn = $('[data-pause]');
  var peeks = $$('[data-peek]');

  var gi = 0, fi = 0;
  var inView = false, userPaused = false, held = false, turning = false;
  var seen = {};
  var curImg = imgA, curBg = bgA, token = 0;

  /* ---------- хайлайты ---------- */
  var rings = GROUPS.map(function (g, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'ring'; b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    b.innerHTML = '<span class="ring__pic"><img src="' + url(g.cover) + '" alt="" width="68" height="68" loading="lazy" decoding="async"></span><span class="ring__t">' + g.title + '</span>';
    b.addEventListener('click', function () { if (i !== gi) goGroup(i, i > gi ? 1 : -1, 0); else showFrame(0); });
    ringsEl.appendChild(b);
    return b;
  });

  /* ---------- кадры ---------- */
  // переключение слоёв идемпотентно: onload обнуляем, устаревшие загрузки игнорируем
  function swapLayer(cur, a, b, src, alt, cls) {
    var next = cur === a ? b : a, my = ++token;
    next.onload = null;
    function show() {
      if (my !== token) return;
      next.onload = null;
      next.classList.add(cls); cur.classList.remove(cls);
    }
    next.alt = alt || '';
    next.src = src;
    if (next.complete && next.naturalWidth) show(); else next.onload = show;
    return next;
  }
  function buildBars() {
    barsEl.innerHTML = '';
    GROUPS[gi].frames.forEach(function () {
      var s = document.createElement('span'); s.className = 'story__bar'; s.innerHTML = '<i></i>';
      barsEl.appendChild(s);
    });
  }
  function paintBars() {
    $$('.story__bar', barsEl).forEach(function (b, k) {
      b.classList.toggle('is-done', k < fi);
      b.classList.remove('is-active');
      if (k === fi) { void b.offsetWidth; b.classList.add('is-active'); }
    });
  }
  function preload(g, f) {
    var fr = GROUPS[g] && GROUPS[g].frames[f];
    if (fr) { var im = new Image(); im.src = url(fr.src); }
  }
  function showFrame(f) {
    var g = GROUPS[gi], fr = g.frames[f];
    fi = f;
    curImg = swapLayer(curImg, imgA, imgB, url(fr.src), fr.alt, 'is-on');
    curBg = swapBg(url(fr.src));
    capEl.innerHTML = fr.cap;
    topicEl.textContent = g.title;
    paintBars();
    // следующий кадр — заранее
    if (f + 1 < g.frames.length) preload(gi, f + 1); else preload((gi + 1) % GROUPS.length, 0);
    updatePause();
  }
  var bgTok = 0;
  function swapBg(src) {
    var cur = curBg, next = cur === bgA ? bgB : bgA, my = ++bgTok;
    next.onload = null;
    function show() { if (my !== bgTok) return; next.onload = null; next.classList.add('is-on'); cur.classList.remove('is-on'); }
    next.src = src;
    if (next.complete && next.naturalWidth) show(); else next.onload = show;
    return next;
  }
  function setRings() {
    rings.forEach(function (r, i) {
      r.setAttribute('aria-selected', i === gi ? 'true' : 'false');
      r.classList.toggle('is-seen', !!seen[i] && i !== gi);
    });
    // превью соседних тем по бокам
    peeks.forEach(function (p) {
      var d = parseInt(p.getAttribute('data-peek'), 10);
      var n = (gi + d + GROUPS.length) % GROUPS.length;
      var im = $('img', p);
      im.src = url(GROUPS[n].cover);
      p.setAttribute('aria-label', (d < 0 ? 'Предыдущая тема: ' : 'Следующая тема: ') + GROUPS[n].title);
    });
  }

  /* ---------- смена темы с поворотом «куба» ---------- */
  function goGroup(n, dir, f) {
    if (turning) return;
    seen[gi] = true;
    var apply = function () { gi = (n + GROUPS.length) % GROUPS.length; buildBars(); setRings(); showFrame(f || 0); };
    if (CC.reduce || !CC.gsap) { apply(); return; }
    turning = true;
    gsap.timeline({ onComplete: function () { turning = false; updatePause(); } })
      .to(story, { rotateY: dir > 0 ? -90 : 90, transformOrigin: dir > 0 ? '100% 50%' : '0% 50%', duration: .32, ease: 'power2.in' })
      .add(apply)
      .fromTo(story, { rotateY: dir > 0 ? 90 : -90, transformOrigin: dir > 0 ? '0% 50%' : '100% 50%' }, { rotateY: 0, duration: .42, ease: 'power2.out' });
  }
  function next() {
    if (fi + 1 < GROUPS[gi].frames.length) showFrame(fi + 1);
    else goGroup(gi + 1, 1, 0);
  }
  function prev() {
    if (fi > 0) showFrame(fi - 1);
    else goGroup(gi - 1, -1, 0);
  }

  // таймер: CSS-анимация полоски, по её окончании — следующий кадр
  barsEl.addEventListener('animationend', function (e) {
    if (e.target.parentNode.classList.contains('is-active')) next();
  });

  /* ---------- пауза ---------- */
  function updatePause() {
    var paused = userPaused || held || !inView || turning;
    story.classList.toggle('is-paused', paused);
    pauseBtn.setAttribute('aria-label', userPaused ? 'Продолжить' : 'Пауза');
  }
  pauseBtn.addEventListener('click', function (e) { e.stopPropagation(); userPaused = !userPaused; updatePause(); });

  /* ---------- тапы, удержание, свайп ---------- */
  var downX = 0, downY = 0, downT = 0, holdTimer = 0, suppress = false, pid = null;
  story.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.story__pause')) return;
    pid = e.pointerId; downX = e.clientX; downY = e.clientY; downT = Date.now(); suppress = false;
    holdTimer = setTimeout(function () { held = true; suppress = true; updatePause(); }, 200);
  });
  window.addEventListener('pointerup', function (e) {
    if (pid === null || e.pointerId !== pid) return;
    pid = null;
    clearTimeout(holdTimer);
    var dx = e.clientX - downX, dy = e.clientY - downY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { // свайп — соседняя тема
      suppress = true;
      held = false;
      goGroup(gi + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1, 0);
    }
    if (held) { held = false; updatePause(); }
  });
  window.addEventListener('pointercancel', function () { pid = null; clearTimeout(holdTimer); held = false; updatePause(); });
  $$('[data-zone]').forEach(function (z) {
    z.addEventListener('click', function () {
      if (suppress) { suppress = false; return; }
      if (z.getAttribute('data-zone') === '1') next(); else prev();
    });
  });
  peeks.forEach(function (p) {
    p.addEventListener('click', function () {
      var d = parseInt(p.getAttribute('data-peek'), 10);
      goGroup(gi + d, d, 0);
    });
  });

  /* ---------- клавиатура ---------- */
  sec.addEventListener('keydown', function (e) {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === ' ' && e.target === viewer) { e.preventDefault(); userPaused = !userPaused; updatePause(); }
    else if (e.key === 'Escape') { userPaused = true; updatePause(); rings[gi].focus(); }
  });

  /* ---------- автопроигрывание только на экране ---------- */
  new IntersectionObserver(function (en) {
    inView = en[0].isIntersecting;
    updatePause();
  }, { threshold: 0.45 }).observe(story);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { inView = false; updatePause(); }
  });

  // старт: первая тема, первый кадр (картинки грузятся, когда блок близко)
  buildBars(); setRings();
  var started = false;
  new IntersectionObserver(function (en) {
    if (!en[0].isIntersecting || started) return;
    started = true; showFrame(0);
  }, { rootMargin: '600px 0px' }).observe(sec);
  updatePause();

  /* ---------- всё зарегистрировано — запускаем страницу ---------- */
  CC.boot();
})();
