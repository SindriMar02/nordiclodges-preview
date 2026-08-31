/* Nordic Lodges · a 1:1 Sobha Privy transplant.
   §5 reveal system (title char-stagger, text, subtitle), §8 band choreography,
   §9 motion constants. Lenis lerp .1 desktop only; native on touch.
   Everything prefixed nl- / Sobha's own class names. */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  root.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var meta = document.getElementById('themeColor');

  /* ── §5 titles are split into masked LINES, then char-staggered ────────── */
  function splitTitle(el) {
    if (el.dataset.split === 'done') return;
    var text = (el.dataset.text || el.textContent).replace(/\s+/g, ' ').trim();
    el.dataset.text = text;
    var words = text.split(' ');
    el.textContent = '';
    /* the probe has to wrap EXACTLY as the finished line will, so it is plain
       inline spans with real space text-nodes between them — an inline-block
       carrying its own trailing space measures wider and packs lines wrong,
       which pushed the last glyph past the mask and clipped it */
    var probes = words.map(function (w, i) {
      var s = document.createElement('span');
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      return s;
    });
    var lines = [], last = null;
    probes.forEach(function (s, i) {
      var top = s.offsetTop;
      if (last === null || top > last + 2) { lines.push([]); last = top; }
      lines[lines.length - 1].push(words[i]);
    });
    el.textContent = '';
    lines.forEach(function (ws) {
      var mask = document.createElement('span');
      mask.className = 'rl';
      var inner = document.createElement('i');
      inner.textContent = ws.join(' ');
      mask.appendChild(inner);
      el.appendChild(mask);
    });
    el.dataset.split = 'done';
  }

  var titles = [].slice.call(document.querySelectorAll('[data-reveal="title"]'));
  function buildTitles() { titles.forEach(splitTitle); }

  /* ── header: light over the white bands ───────────────────────────────── */
  var lightIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var light = e.target.classList.contains('ui-light');
      body.classList.toggle('is-light-header', light);
      if (meta) meta.setAttribute('content', light ? '#FFFFFF' : '#000000');
    });
  }, { rootMargin: '-8% 0% -88% 0%' });
  document.querySelectorAll('.section').forEach(function (s) { lightIO.observe(s); });

  /* The glass bar is what keeps the wordmark legible over arbitrary photography and
     stops every chapter's text colliding with it. Over the OPENING frame there is
     nothing to collide with yet, so the bar stays transparent and the hero is clean.
     Passive listener + a class toggle only on change: no layout read per scroll. */
  var atTop = null;
  function tickTop() {
    var t = window.scrollY <= 8;
    if (t !== atTop) { atTop = t; body.classList.toggle('at-top', t); }
  }
  tickTop();
  window.addEventListener('scroll', tickTop, { passive: true });

  /* ── menu ─────────────────────────────────────────────────────────────── */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  var menuOpen = false;
  function setMenu(open) {
    menuOpen = open;
    body.classList.toggle('menu-open', open);
    body.classList.toggle('no-scroll', open);
    burger.setAttribute('aria-expanded', String(open));
    if (open) menu.removeAttribute('hidden');
    if (window.__lenis) { open ? window.__lenis.stop() : window.__lenis.start(); }
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(!menuOpen); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) setMenu(false); });
  }

  /* ── the shared range-calendar machine, Sobha skin ────────────────────── */
  (function calendar() {
    var grid = document.getElementById('calGrid');
    if (!grid) return;
    var monthEl = document.getElementById('calMonth');
    document.getElementById('calDow').innerHTML =
      ['Mo','Tu','We','Th','Fr','Sa','Su'].map(function (d) { return '<div>' + d + '</div>'; }).join('');
    var outS = document.getElementById('outStart'), outE = document.getElementById('outEnd');
    var outSum = document.getElementById('outSum'), go = document.getElementById('askGo');
    var prev = document.getElementById('calPrev'), next = document.getElementById('calNext');
    var MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var view = new Date(today.getFullYear(), today.getMonth(), 1);
    var monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    if ((monthEnd - today) / 86400000 < 7) view.setMonth(view.getMonth() + 1);
    var start = null, end = null;
    var MIN = { Brekka: 3, Langholt: 5, Tvera: 3, Hamragil: 3, Stekkar: 5 };

    function lodge() { var r = document.querySelector('input[name="lodge"]:checked'); return r ? r.value : 'Brekka'; }
    function fmt(d) { return d ? MON[d.getMonth()].slice(0, 3) + ' ' + d.getDate() + ', ' + d.getFullYear() : null; }
    function paint() {
      var old = monthEl.querySelector('span');
      if (old) { old.classList.add('is-out'); setTimeout(function () { old.remove(); }, 400); }
      var sp = document.createElement('span');
      sp.textContent = MON[view.getMonth()] + ' ' + view.getFullYear();
      monthEl.appendChild(sp);
      prev.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
      var lead = (new Date(view).getDay() + 6) % 7;
      var cur = new Date(view); cur.setDate(1 - lead);
      var out = [];
      for (var i = 0; i < 42; i++) {
        var d = new Date(cur);
        var cls = ['bk_day'];
        if (start && end && d > start && d < end) cls.push('in-range');
        if (start && +d === +start) cls.push('is-start');
        if (end && +d === +end) cls.push('is-end');
        out.push('<button type="button" class="' + cls.join(' ') + '"' +
          (d.getMonth() !== view.getMonth() ? ' data-out' : '') +
          (d < today ? ' disabled' : '') + (+d === +today ? ' data-today' : '') +
          ' data-d="' + d.toISOString().slice(0, 10) + '">' + d.getDate() + '</button>');
        cur.setDate(cur.getDate() + 1);
      }
      grid.innerHTML = out.join('');
    }
    function sync() {
      outS.textContent = fmt(start) || 'Select a date';
      outE.textContent = fmt(end) || 'Select a date';
      var L = lodge(), min = MIN[L] || 3, ok = false;
      if (!start) outSum.textContent = 'Choose your arrival night on the calendar.';
      else if (!end) outSum.textContent = 'Arriving ' + fmt(start) + ' — ' + L + ' takes a minimum of ' + min + ' nights.';
      else {
        var n = Math.round((end - start) / 86400000);
        if (n < min) outSum.textContent = L + ' has a ' + min + '-night minimum — that is ' + n + '. Extend the stay to continue.';
        else {
          ok = true;
          var disc = n >= 14 ? ' 20% off applies from fourteen nights.' : n >= 7 ? ' 10% off applies from seven nights.' : '';
          outSum.textContent = L + ' · ' + fmt(start) + ' → ' + fmt(end) + ' · ' + n + ' nights.' + disc;
        }
      }
      go.setAttribute('aria-disabled', String(!ok));
      if (ok) {
        var subj = 'Enquiry: ' + L + ', ' + fmt(start) + ' to ' + fmt(end);
        var msg = 'Hello,%0D%0A%0D%0AWe would like to stay at ' + L + ' from ' + fmt(start) +
          ' to ' + fmt(end) + '. Could you confirm availability and the total?%0D%0A%0D%0ABest regards';
        go.href = 'mailto:lodges@nordiclodges.com?subject=' + encodeURIComponent(subj) + '&body=' + msg;
      }
    }
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.bk_day'); if (!b || b.disabled) return;
      var d = new Date(b.dataset.d + 'T00:00:00');
      if (!start || (start && end)) { start = d; end = null; }
      else if (d < start) { start = d; }
      else if (+d === +start) { start = null; end = null; }
      else { end = d; }
      paint(); sync();
    });
    prev.addEventListener('click', function () { view.setMonth(view.getMonth() - 1); paint(); });
    next.addEventListener('click', function () { view.setMonth(view.getMonth() + 1); paint(); });
    document.querySelectorAll('input[name="lodge"]').forEach(function (r) { r.addEventListener('change', sync); });
    paint(); sync();
  })();

  /* ── static fallbacks ─────────────────────────────────────────────────── */
  function showAll() {
    buildTitles();
    var cu = document.getElementById('curtain');
    if (cu) cu.style.display = 'none';
    document.body.classList.remove('is-loading');
    ['wmL', 'wmR', 'wmRule'].forEach(function (id) {
      var e = document.getElementById(id);
      if (e) { e.style.clipPath = 'none'; e.style.transform = 'none'; e.style.opacity = 1; }
    });
    document.querySelectorAll('.hero__sub, .hero__meta').forEach(function (e) { e.style.opacity = 1; });
    document.querySelectorAll('.rl').forEach(function (l) { l.classList.add('in'); });
    document.querySelectorAll('[data-reveal]').forEach(function (e) { e.classList.add('in'); });
    document.querySelectorAll('.loc__card, .quotes__list blockquote').forEach(function (e) { e.classList.add('is-on'); });
  }
  if (!hasGSAP || reduced) { showAll(); return; }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  if (!isTouch) {
    var lenis = new Lenis({ lerp: 0.1, autoRaf: false });     /* §9 scroll lerp .1 */
    lenis.on('scroll', ScrollTrigger.update);
    window.__lenis = lenis;
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* §5 observer: threshold .5, root −100px bottom, explicit delays */
  function armReveals() {
    buildTitles();
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      var delay = (+el.dataset.delay || 0) / 1000;
      var lines = el.querySelectorAll('.rl');
      var fire = function () {
        if (lines.length) {
          lines.forEach(function (l, i) {
            l.style.transitionDelay = (delay + i * 0.02 * 1.85) + 's';   /* §9 char stagger 20ms ×1.85 line offset */
            l.classList.add('in');
          });
        } else {
          el.style.transitionDelay = delay + 's';
        }
        el.classList.add('in');
      };
      if (el.getBoundingClientRect().top <= window.innerHeight * 0.92) { fire(); return; }
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: fire,
        onRefresh: function (self) { if (self.progress > 0) fire(); }
      });
    });
    ScrollTrigger.refresh();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(armReveals); else armReveals();

  /* ---------- the curtain, and the wordmark that opens out of its seam -------
     The seam draws down the centre while the page loads; the halves then part
     along it and the seam SHRINKS onto the wordmark's own rule — which sits at
     the exact horizontal centre because .wm__row is a 1fr/auto/1fr grid. The
     line the page opened along becomes the line the words open out of.        */
  (function curtain() {
    var L = document.getElementById('wmL'), R = document.getElementById('wmR');
    var rule = document.getElementById('wmRule');
    var seam = document.getElementById('curtainSeam');
    var place = document.getElementById('curtainPlace');
    var halves = document.querySelectorAll('.curtain__half');
    var cu = document.getElementById('curtain');

    gsap.set(rule, { scaleY: 0 });
    gsap.set(L, { clipPath: 'inset(0% 0% 0% 100%)', x: 26 });
    gsap.set(R, { clipPath: 'inset(0% 100% 0% 0%)', x: -26 });
    gsap.set(['.hero__sub', '.hero__meta'], { opacity: 0, y: 18 });

    var done = false;
    function open() {
      if (done) return; done = true;
      body.classList.remove('is-loading');
      if (cu) cu.style.display = 'none';
      /* the curtain's seam has already landed on this exact box, so the real
         rule simply takes over in the same frame: no draw, no flicker */
      gsap.set(rule, { scaleY: 1 });
      gsap.timeline()
        .to(L, { clipPath: 'inset(0% 0% 0% 0%)', x: 0, duration: 1.5, ease: 'expo.out' }, .12)
        .to(R, { clipPath: 'inset(0% 0% 0% 0%)', x: 0, duration: 1.5, ease: 'expo.out' }, '<')
        .to(['.hero__sub', '.hero__meta'], { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .1 }, '-=0.85');
      ScrollTrigger.refresh();
    }

    if (!seam) { open(); return; }
    gsap.timeline({
      onComplete: function () {
        var H = window.innerHeight;
        var box = rule.getBoundingClientRect();
        var tl = gsap.timeline({ onComplete: open });
        tl.to(place, { opacity: 0, duration: .3, ease: 'power2.in' }, 0)
          .to(halves[0], { xPercent: -100, duration: 1.1, ease: 'expo.inOut' }, .08)
          .to(halves[1], { xPercent: 100, duration: 1.1, ease: 'expo.inOut' }, .08);
        /* transform-origin is the top, so scaling then translating by the
           rule's top lands the seam exactly on it */
        if (box.height > 4) tl.to(seam, { scaleY: box.height / H, y: box.top, duration: .95, ease: 'expo.inOut' }, .45);
        else tl.to(seam, { opacity: 0, duration: .4 }, .5);
      }
    })
      .to(seam, { scaleY: 1, duration: 1.15, ease: 'power2.inOut' }, 0)
      .to(place, { opacity: .55, duration: .7, ease: 'power2.out' }, .25);

    /* never let a slow asset hold the page hostage */
    gsap.delayedCall(3.4, open);

    /* scroll keeps parting them, and the rule outlives the words */
    var sc = { trigger: '#top', start: 'top top', end: 'bottom top', scrub: .6 };
    gsap.to(L, { xPercent: -9, opacity: .1, ease: 'none', scrollTrigger: sc });
    gsap.to(R, { xPercent: 9, opacity: .1, ease: 'none', scrollTrigger: sc });
    gsap.to(rule, { scaleY: 3.2, opacity: 0, ease: 'none', scrollTrigger: sc });
  })();

  /* §8.0 hero drifts −10svh as the next section covers it */
  var heroLayer = document.querySelector('[data-hero-out]');
  if (heroLayer) {
    gsap.to(heroLayer, {
      yPercent: -10, ease: 'none',
      scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: isTouch ? 0.35 : true }
    });
  }

  /* §2 imageMove: images sit 120% tall and travel ~12% of their height */
  ScrollTrigger.matchMedia({
    '(min-width: 768px)': function () {
      document.querySelectorAll('.hero__media img, [data-img-wrap] img, .register__bg img').forEach(function (img) {
        gsap.fromTo(img, { yPercent: 0 }, {
          yPercent: -12, ease: 'none',
          scrollTrigger: { trigger: img.closest('figure'), start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });

      /* §8.1 the pinned 3-up: centre opens from inset(10%) and scales, sides push ±8vw */
      var stage = document.getElementById('tripleStage');
      if (stage) {
        var tl = gsap.timeline({
          scrollTrigger: { trigger: stage, start: 'top top', end: 'bottom bottom', scrub: true }
        });
        tl.fromTo('.triple__mid', { clipPath: 'inset(10% 0)', scale: 1 },
                  { clipPath: 'inset(0% 0)', scale: 1.35, ease: 'none' }, 0)
          .fromTo('.triple__side:first-child', { xPercent: 0 }, { xPercent: -34, ease: 'none' }, 0)
          .fromTo('.triple__side:last-child',  { xPercent: 0 }, { xPercent: 34,  ease: 'none' }, 0);
      }
    }
  });

  /* §8.5 the five-lodge stage: plate + name step together, floor at 70% */
  (function stage() {
    var wrap = document.getElementById('collection');
    var plates = document.querySelectorAll('.stage__plate');
    var names = document.querySelectorAll('#stageNames li');
    if (!wrap || !plates.length) return;
    var n = plates.length, cur = 0;
    var pin = wrap.querySelector('.stage__pin') || wrap;
    var plateBox = wrap.querySelector('.stage__plates');
    function headerH() {
      var h = document.querySelector('.header');
      return h ? h.getBoundingClientRect().height : 0;
    }
    /* ONE owner of the state, called by both the scroll driver and a tap. */
    function select(i) {
      if (i === cur) return;
      cur = i;
      plates.forEach(function (p, k) { p.classList.toggle('is-on', k === i); });
      names.forEach(function (l, k) {
        l.classList.toggle('is-on', k === i);
        var b = l.querySelector('.stage__pick');
        if (b) b.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      });
    }
    var st = ScrollTrigger.create({
      trigger: wrap, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: function (self) {
        select(Math.min(n - 1, Math.floor(Math.min(self.progress, 0.92) / 0.92 * n)));
      }
    });
    /* Tapping a lodge must not fight the scroll driver. Where the chapter is really
       pinned (a long trigger range) the driver owns the state, so a tap SCROLLS to that
       lodge's beat and lets the driver set it — setting the class directly there would
       be overwritten on the next scroll frame. Where the chapter is not pinned (phone,
       height:auto) the range collapses and there is no driver to fight, so the tap
       selects directly. */
    names.forEach(function (li, i) {
      var btn = li.querySelector('.stage__pick');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var pinned = getComputedStyle(pin).position === 'sticky';
        if (pinned) {
          /* the scroll driver owns the state here: scroll to the beat and let it set
             the lodge, or it would be overwritten on the very next scroll frame */
          var range = st.end - st.start;
          var y = st.start + ((i + 0.5) / n * 0.92) * range;
          if (window.__lenis) window.__lenis.scrollTo(y);
          else window.scrollTo({ top: y, behavior: 'smooth' });
        } else {
          /* not pinned: select directly, then make sure the thing that changed is
             actually on screen before returning control to the visitor */
          select(i);
          var box = plateBox.getBoundingClientRect();
          if (box.top < headerH() || box.bottom > window.innerHeight) {
            window.scrollTo({ top: window.scrollY + box.top - headerH() - 12, behavior: 'smooth' });
          }
        }
      });
    });
  })();

  /* §8.9 the locations chapter: card + pin + 1px progress rule */
  (function locations() {
    var cards = document.querySelectorAll('.loc__card');
    var pins = document.querySelectorAll('.loc__pin');
    var bar = document.getElementById('locBar');
    var title = document.getElementById('locTitle');
    var section = document.getElementById('map');
    if (!cards.length || !section) return;
    var n = cards.length, cur = 0;
    ScrollTrigger.create({
      trigger: section, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: function (self) {
        var p = self.progress;
        if (bar) gsap.set(bar, { scaleX: p });
        var i = Math.min(n - 1, Math.floor(p * n));
        if (i !== cur) {
          cur = i;
          cards.forEach(function (c, k) { c.classList.toggle('is-on', k === i); });
          pins.forEach(function (pin, k) { pin.classList.toggle('is-active', k === i); });
        }
      }
    });
    /* the title fades out as the cards take over — §8.9 "−100svh" hand-off */
    if (title) {
      gsap.to(title, {
        autoAlpha: 0, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'top top-=80%', scrub: true }
      });
    }
  })();

  /* §8.10 the quote stack */
  (function quotes() {
    var list = document.getElementById('quotesList');
    if (!list) return;
    var qs = list.querySelectorAll('blockquote');
    var num = document.getElementById('quoteNum');
    var cur = 0;
    ScrollTrigger.create({
      trigger: '#quotes', start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: function (self) {
        var i = Math.min(qs.length - 1, Math.floor(self.progress * qs.length));
        if (i === cur) return;
        cur = i;
        qs.forEach(function (q, k) { q.classList.toggle('is-on', k === i); });
        if (num) num.textContent = String(i + 1);
      }
    });
  })();

  /* §12 footer statement: a gradient sweep lights the words as it scrolls in */
  (function footerSweep() {
    var el = document.getElementById('footerStatement');
    if (!el) return;
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w) { return '<span class="nl-w">' + w + '</span>'; }).join(' ');
    var ws = el.querySelectorAll('.nl-w');
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', end: 'bottom 55%', scrub: 0.5,
      onUpdate: function (self) {
        var lit = Math.round(self.progress * ws.length);
        ws.forEach(function (w, i) { w.classList.toggle('is-lit', i < lit); });
      }
    });
  })();

  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (isTouch && window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    titles.forEach(function (el) { el.dataset.split = ''; });
    armReveals();
  });
})();
