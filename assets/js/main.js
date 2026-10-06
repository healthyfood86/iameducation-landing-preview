/* I'M EDUCATION · 树洞计划 — vanilla JS, no dependencies */

// Set this to the endpoint that should receive {name, phone}.
// Leave null to run in demo mode: the success panel shows and the
// submission is logged to the console instead of being sent.
const FORM_ENDPOINT = null;

(function () {
  'use strict';

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobileMQ = window.matchMedia('(max-width: 767px)');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- top bar ---------- */
  var topbar = $('#topbarBg');
  function syncTopbar() { topbar.classList.toggle('is-solid', window.scrollY > 80); }

  /* ---------- reveals ---------- */
  var reveals = $$('.reveal');
  if (reduceMQ.matches || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- parallax ---------- */
  // Global amplitude: the brief's "speeds" are scaled down so the effect stays near-subliminal.
  var AMP = 0.4;
  var heroEl = $('#top');
  var heroHead = $('#heroHead');
  var items = [];   // {el, kind, speed, ...cached}
  var vh = window.innerHeight;
  var ticking = false;
  var heroH = 0;

  function measure() {
    vh = window.innerHeight;
    var sy = window.scrollY;
    heroH = heroEl.offsetHeight;
    items = [];
    var half = mobileMQ.matches ? 0.5 : 1;

    $$('[data-px]').forEach(function (el) {
      var hero = el.hasAttribute('data-px-hero');
      var speed = parseFloat(el.getAttribute('data-px')) * half;
      // layer 1-back (sunburst) and layer 2 (motifs) are dropped under 768px
      if (mobileMQ.matches && (el.classList.contains('layer--sunburst') || el.classList.contains('motif'))) return;
      var amp = parseFloat(el.getAttribute('data-amp') || AMP);
      var item = { el: el, hero: hero, speed: speed, amp: amp, front: el.classList.contains('hero__media') };
      if (!hero) {
        el.style.transform = 'none';
        var r = el.getBoundingClientRect();
        item.center = r.top + sy + r.height / 2;
      }
      items.push(item);
    });

    $$('[data-band]').forEach(function (frame) {
      var img = frame.querySelector('picture') || frame.querySelector('img');
      img.style.transform = 'none';
      var r = frame.getBoundingClientRect();
      items.push({ band: true, frame: frame, el: img, top: r.top + sy, h: r.height, range: parseFloat(frame.getAttribute('data-band')) * (mobileMQ.matches ? 0.5 : 1) });
    });

    $$('[data-drift]').forEach(function (el) {
      el.style.transform = 'none';
      var r = el.getBoundingClientRect();
      items.push({ drift: true, el: el, dir: parseFloat(el.getAttribute('data-drift')), top: r.top + sy, h: r.height });
    });
  }

  function frame() {
    ticking = false;
    var sy = window.scrollY;
    syncTopbar();

    // hero copy fades and lifts across the first viewport
    var hp = Math.min(Math.max(sy / (vh * 0.9), 0), 1);
    heroHead.style.opacity = String(1 - hp);
    heroHead.style.transform = 'translate3d(0,' + (-40 * hp).toFixed(1) + 'px,0)';

    var heroSy = Math.min(sy, heroH);
    var drift = mobileMQ.matches ? 7 : 14;
    for (var i = 0; i < items.length; i++) {
      var it = items[i], y;
      if (it.band) {
        if (sy + vh < it.top || sy > it.top + it.h) continue;
        var p = (sy + vh - it.top) / (vh + it.h);
        y = (p - 0.5) * 2 * it.range * it.h;
        it.el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      } else if (it.drift) {
        if (sy + vh < it.top || sy > it.top + it.h) continue;
        var q = (sy + vh - it.top) / (vh + it.h);
        var x = it.dir * drift * (q - 0.5) * 2;
        it.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      } else if (it.hero) {
        // back layers lag behind the scroll; the front card rises a little faster
        y = heroSy * it.speed * it.amp * (it.front ? -1 : 1);
        it.el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      } else {
        var d = Math.max(-vh, Math.min(vh, sy + vh / 2 - it.center)); // clamp so off-screen shapes stay put
        y = d * it.speed * 0.5;
        it.el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      }
    }
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  var motionOn = false;
  function enableMotion() {
    if (motionOn) return;
    motionOn = true;
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    frame();
  }
  function disableMotion() {
    motionOn = false;
    window.removeEventListener('scroll', onScroll);
    $$('[data-px],[data-drift],[data-band] picture,[data-band] img').forEach(function (el) { el.style.transform = ''; });
    heroHead.style.transform = ''; heroHead.style.opacity = '';
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  var rt;
  function onResize() {
    clearTimeout(rt);
    rt = setTimeout(function () { if (motionOn) { measure(); frame(); } }, 150);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('load', function () { if (motionOn) { measure(); frame(); } });
  var onReduceChange = function () { reduceMQ.matches ? disableMotion() : enableMotion(); };
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onReduceChange);

  syncTopbar();
  window.addEventListener('scroll', function () { if (!motionOn) syncTopbar(); }, { passive: true });
  if (!reduceMQ.matches) enableMotion();

  /* ---------- forms ---------- */
  var MSG_NAME = '请告诉我们该怎么称呼你';
  var MSG_PHONE = '请留下一个可以联系到你的号码';
  var MSG_PHONE_BAD = '这个号码好像不太对，可以再看一下吗';
  var MSG_RETRY = '刚才没有送出去，请稍后再试一次';

  function phoneOk(v) {
    if (!/^[\d\s+\-()]+$/.test(v)) return false;
    return v.replace(/\D/g, '').length >= 8;
  }
  function setErr(input, msg) {
    var p = document.getElementById(input.getAttribute('aria-describedby'));
    p.textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function showSuccess(card) {
    var form = $('.formcard__form', card);
    var done = $('.formcard__done', card);
    card.classList.add('is-leaving');
    var wait = reduceMQ.matches ? 0 : 300;
    setTimeout(function () {
      form.hidden = true;
      done.hidden = false;
      void done.offsetWidth;
      card.classList.add('is-done');
      $('.done__title', done).focus({ preventScroll: false });
    }, wait);
  }

  $$('form.capture').forEach(function (form) {
    var card = form.closest('[data-form-card]');
    var name = form.elements.name, phone = form.elements.phone;
    var btn = $('.btn', form), formErr = $('.err--form', form);
    var label = btn.textContent;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      formErr.textContent = '';
      var n = name.value.trim(), p = phone.value.trim();
      setErr(name, n ? '' : MSG_NAME);
      setErr(phone, !p ? MSG_PHONE : (phoneOk(p) ? '' : MSG_PHONE_BAD));
      if (!n) { name.focus(); return; }
      if (!p || !phoneOk(p)) { phone.focus(); return; }

      btn.disabled = true; btn.textContent = '正在送出…';
      var send;
      if (FORM_ENDPOINT) {
        send = fetch(FORM_ENDPOINT, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: n, phone: p })
        }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); });
      } else {
        console.log('[demo mode] form submission:', { name: n, phone: p });
        send = sleep(600);
      }
      send.then(function () { showSuccess(card); }).catch(function () {
        btn.disabled = false; btn.textContent = label; formErr.textContent = MSG_RETRY;
      });
    });
    [name, phone].forEach(function (inp) {
      inp.addEventListener('input', function () { if (inp.getAttribute('aria-invalid')) setErr(inp, ''); });
    });
  });

  /* ---------- hero video ---------- */
  // The video carries preload="none", so nothing downloads until this click.
  // Controls appear only once it is playing, keeping the poster state clean.
  var hv = $('#heroVideo'), hvFrame = $('#videoFrame'), hvBtn = $('.play');
  if (hv && hvBtn && hvFrame) {
    hvBtn.addEventListener('click', function () {
      hv.setAttribute('controls', '');
      hvFrame.classList.add('is-playing');
      hvBtn.hidden = true;
      var p = hv.play();
      // if the browser refuses (codec or policy) put the ring back rather than dead-end
      if (p && p.catch) p.catch(function () {
        hvFrame.classList.remove('is-playing');
        hvBtn.hidden = false;
        hv.removeAttribute('controls');
      });
    });
  }
})();
