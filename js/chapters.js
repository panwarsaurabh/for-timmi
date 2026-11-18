// Every chapter's DOM (built from CONFIG) and its GSAP choreography.
import { createUniverse } from './webgl.js';

const C = window.CONFIG;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const EMOJI = { travel: '✈️', us: '💞', lens: '📸', friends: '🥂', noddy: '🐶', video: '🎬' };
const YT_ID = /^[\w-]{11}$/;

let ctx, esc;
// placeholder hues stay inside the site palette (magenta, coral, sun, sky, lilac, pink)
const HUES = [330, 12, 40, 200, 262, 300, 350, 220];
let hueI = 0;

// Photo container: shows the photo, or a gradient placeholder when src is empty/broken.
function media(item, kind, cls = '') {
  const hue = HUES[hueI++ % HUES.length];
  const alt = esc(item.caption || item.place || kind);
  const img = item.src ? `<img src="${esc(item.src)}" alt="${alt}" loading="lazy" decoding="async">` : '';
  return `<div class="media ${cls}" style="--h:${hue}" data-ph="${EMOJI[kind] || '✨'}">${img}</div>`;
}
function wireImages(root) {
  $$('.media img', root).forEach(img => {
    const drop = () => img.remove();
    if (img.complete && !img.naturalWidth) drop(); else img.addEventListener('error', drop, { once: true });
  });
}

// 3D tilt + glare for desktop
function tilt(el, max = 10) {
  if (ctx.TOUCH || ctx.REDUCED) return;
  const rx = gsap.quickTo(el, 'rotationX', { duration: .5, ease: 'power3' });
  const ry = gsap.quickTo(el, 'rotationY', { duration: .5, ease: 'power3' });
  gsap.set(el, { transformPerspective: 900 });
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    rx((.5 - y) * max); ry((x - .5) * max);
    el.style.setProperty('--gx', x * 100 + '%'); el.style.setProperty('--gy', y * 100 + '%');
  });
  el.addEventListener('pointerleave', () => { rx(0); ry(0); });
}

// ================================================================= LIGHTBOX
const LB = { list: [], kind: '', i: 0, el: null };
function initLightbox() {
  const el = LB.el = $('#lightbox');
  const show = (dir = 0) => {
    const item = LB.list[LB.i];
    const box = $('#lbMedia');
    box.innerHTML = media(item, LB.kind);
    wireImages(box);
    $('#lbCap').textContent = item.caption || item.place || '';
    $('#lbCount').textContent = `${LB.i + 1} / ${LB.list.length}`;
    if (dir) gsap.fromTo(box, { x: dir * 80, opacity: 0 }, { x: 0, opacity: 1, duration: .6, ease: 'expo.out' });
  };
  LB.show = show;
  const step = d => { LB.i = (LB.i + d + LB.list.length) % LB.list.length; show(d); };
  const close = () => {
    gsap.to(el, { opacity: 0, duration: .35, onComplete: () => { el.hidden = true; $('#lbMedia').innerHTML = ''; } });
    ctx.unlock();
    LB.open = false;
  };
  $('[data-close]', el).addEventListener('click', close);
  $('[data-prev]', el).addEventListener('click', () => step(-1));
  $('[data-next]', el).addEventListener('click', () => step(1));
  el.addEventListener('click', e => { if (e.target === el) close(); });
  addEventListener('keydown', e => {
    if (!LB.open) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  let sx = null;
  el.addEventListener('pointerdown', e => (sx = e.clientX));
  el.addEventListener('pointerup', e => { if (sx !== null && Math.abs(e.clientX - sx) > 50) step(e.clientX < sx ? 1 : -1); sx = null; });
}
function openLightbox(list, kind, i, fromEl) {
  LB.list = list; LB.kind = kind; LB.i = i; LB.open = true;
  LB.el.hidden = false;
  ctx.lock();
  LB.show();
  gsap.fromTo(LB.el, { opacity: 0 }, { opacity: 1, duration: .4 });
  const box = $('#lbMedia');
  if (fromEl) {
    const a = fromEl.getBoundingClientRect(), b = box.getBoundingClientRect();
    gsap.from(box, { x: a.left + a.width / 2 - (b.left + b.width / 2), y: a.top + a.height / 2 - (b.top + b.height / 2), scale: Math.max(.15, a.width / b.width), duration: .8, ease: 'expo.out' });
  }
  $('[data-close]', LB.el).focus({ preventScroll: true });
}

// ================================================================= LETTER
function initLetter() {
  const paras = C.letter.trim().split(/\n+/).map(p =>
    `<p>${esc(p).replace(/\*(.+?)\*/g, '<em>$1</em>')}</p>`).join('');
  const box = $('#letterText');
  box.innerHTML = paras;
  initPetals();
  if (ctx.REDUCED) return;

  const split = new SplitType(box, { types: 'words' });
  const tl = gsap.timeline({ scrollTrigger: { trigger: '#letter', start: 'top top', end: '+=220%', pin: true, scrub: .8 } });
  tl.to('.envelope__flap', { rotationX: 180, duration: 1, ease: 'power2.inOut' })
    .to('.envelope__seal', { scale: 0, opacity: 0, duration: .3 }, 0)
    .to('.envelope__peek', { yPercent: -55, duration: .8 }, .6)
    .to('.envelope', { y: '60vh', rotation: 8, opacity: 0, duration: 1, ease: 'power2.in' }, 1.4)
    .fromTo('.sheet', { opacity: 0, y: 120, scale: .7, rotation: -4 }, { opacity: 1, y: 0, scale: 1, rotation: 0, duration: 1, ease: 'power3.out' }, 1.5)
    .to(split.words, { color: (i, w) => (w.closest('em') ? '#ff2e88' : '#4a2b3d'), stagger: .06, duration: .3, ease: 'none' }, 2.5);
}

function initPetals() {
  if (ctx.REDUCED) return;
  const c = $('#petals'), g = c.getContext('2d');
  let w, h, run = false, raf;
  const petals = Array.from({ length: ctx.SMALL ? 18 : 34 }, () => ({}));
  const reset = (p, top) => Object.assign(p, {
    x: Math.random() * w, y: top ? -20 : Math.random() * h, s: 6 + Math.random() * 10, vy: .4 + Math.random() * 1,
    vx: -.3 + Math.random() * .6, r: Math.random() * 6.28, vr: -.02 + Math.random() * .04,
    c: ['#ff8fb5', '#ff5f9e', '#ffc2d9', '#ff2e88', '#ffd1e0'][(Math.random() * 5) | 0],
  });
  const size = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight; };
  size(); petals.forEach(p => reset(p, false));
  addEventListener('resize', size);
  const draw = () => {
    raf = requestAnimationFrame(draw);
    g.clearRect(0, 0, w, h);
    for (const p of petals) {
      p.y += p.vy; p.x += p.vx + Math.sin(p.y / 40) * .4; p.r += p.vr;
      if (p.y > h + 20) reset(p, true);
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.globalAlpha = .75;
      g.beginPath(); g.ellipse(0, 0, p.s, p.s * .55, 0, 0, 6.28); g.fill(); g.restore();
    }
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !run) { run = true; draw(); }
    else if (!e.isIntersecting && run) { run = false; cancelAnimationFrame(raf); }
  }).observe(c);
}

// ================================================================= TRAVEL
function initTravel() {
  const track = $('#travelTrack');
  gsap.utils.shuffle(C.travel); // new order on every visit
  track.insertAdjacentHTML('beforeend', C.travel.map((t, i) => `
    <article class="trip">
      <button class="trip__frame" data-i="${i}" data-cursor="view" aria-label="Open photo: ${esc(t.place)}">${media(t, 'travel')}</button>
      <div class="trip__meta"><span class="trip__num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(t.place)}</h3><p>${esc(t.caption)}</p></div>
      <span class="trip__stamp" aria-hidden="true">${esc(t.place)}<small>${esc(t.date || '')}</small></span>
    </article>`).join('') + `<div class="travel__outro">…and a lifetime of adventures still to come <span class="grad">✈︎</span></div>`);
  $('#travelPlaces').innerHTML = C.travel.map(t => `<span>${esc(t.place)}</span>`).join('<span>✦</span>');
  wireImages(track);
  $$('.trip__frame', track).forEach(b => b.addEventListener('click', () => openLightbox(C.travel, 'travel', +b.dataset.i, b)));

  if (ctx.REDUCED) return;
  const pin = $('.travel__pin');
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  const svg = $('#travelPath');

  // a wavy dotted flight path across the whole track, revealed as you travel
  const fy = (x, H) => H * .5 + Math.sin(x / 520) * H * .2 + Math.sin(x / 190) * H * .04;
  let H = 0;
  function buildPath() {
    const W = track.scrollWidth; H = track.clientHeight;
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    let d = `M0 ${fy(0, H).toFixed(1)}`;
    for (let x = 20; x <= W; x += 20) d += ` L${x} ${fy(x, H).toFixed(1)}`;
    svg.innerHTML = `
      <defs><clipPath id="tpClip"><rect id="tpRect" x="0" y="0" width="0" height="${H}"/></clipPath>
      <linearGradient id="tpGrad" x1="0" x2="1"><stop offset="0" stop-color="#ff2e88"/><stop offset=".5" stop-color="#ffc93c"/><stop offset="1" stop-color="#5ec8ff"/></linearGradient></defs>
      <path d="${d}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="2" stroke-dasharray="2 12" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="url(#tpGrad)" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round" clip-path="url(#tpClip)"/>
      <g id="tpPlane"><path d="M-14 -3 L4 -3 L12 -12 L16 -12 L11 -3 L18 -3 L21 -7 L24 -7 L22 0 L24 7 L21 7 L18 3 L11 3 L16 12 L12 12 L4 3 L-14 3 Z" fill="#fff"/></g>`;
  }
  buildPath();
  ScrollTrigger.addEventListener('refreshInit', buildPath);

  const moveTween = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
      onToggle: self => (document.documentElement.style.setProperty('--grain', self.isActive ? .13 : .08)),
    },
    onUpdate() {
      const x = -gsap.getProperty(track, 'x') + innerWidth * .55;
      const rect = $('#tpRect'), plane = $('#tpPlane');
      if (!rect) return;
      rect.setAttribute('width', x);
      const y = fy(x, H), ang = Math.atan2(fy(x + 6, H) - y, 6) * 180 / Math.PI;
      plane.setAttribute('transform', `translate(${x} ${y}) rotate(${ang})`);
    },
  });
  gsap.to('#travelPlaces', { x: () => -dist() * .35, ease: 'none', scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + dist(), scrub: 1.5, invalidateOnRefresh: true } });

  $$('.trip', track).forEach(trip => {
    const frame = $('.trip__frame', trip), m = $('.media', trip);
    gsap.fromTo(frame, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'power2.out',
      scrollTrigger: { trigger: trip, containerAnimation: moveTween, start: 'left 95%', end: 'left 45%', scrub: true } });
    gsap.fromTo(m, { xPercent: -7 }, { xPercent: 7, ease: 'none',
      scrollTrigger: { trigger: trip, containerAnimation: moveTween, start: 'left right', end: 'right left', scrub: true } });
    gsap.from($('.trip__stamp', trip), { scale: 2.4, opacity: 0, rotation: -30, ease: 'back.out(2)',
      scrollTrigger: { trigger: trip, containerAnimation: moveTween, start: 'left 70%', end: 'left 50%', scrub: true } });
  });
}

// ================================================================= US
function initUs() {
  const stack = $('#usStack');
  stack.innerHTML = C.us.map((u, i) => `
    <article class="scard" style="--i:${i};--h:${[300, 262, 330, 210, 350][i % 5]}">
      <button class="scard__media" data-i="${i}" data-cursor="view" aria-label="Open photo: ${esc(u.caption)}">${media(u, 'us')}</button>
      <div class="scard__text"><span class="scard__date">${esc(u.date)}</span><h3>${esc(u.caption)}</h3><p>${esc(u.note || '')}</p></div>
    </article>`).join('');
  wireImages(stack);
  $$('.scard__media', stack).forEach(b => { tilt(b, 8); b.addEventListener('click', () => openLightbox(C.us, 'us', +b.dataset.i, b)); });

  $('#heartMask').innerHTML = media(C.usFinale || {}, 'us');
  wireImages($('#heartMask'));
  $('#usForever').textContent = (C.usFinale && C.usFinale.caption) || 'forever & always';

  if (ctx.REDUCED) return;
  const cards = $$('.scard', stack);
  cards.forEach((card, i) => {
    if (i === cards.length - 1) return;
    gsap.fromTo(card, { '--dim': 0 }, {
      scale: 1 - (cards.length - i) * .035, '--dim': .45, rotation: i % 2 ? 1.5 : -1.5, ease: 'none',
      scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 20%', scrub: true },
    });
  });
  gsap.timeline({ scrollTrigger: { trigger: '#usFinale', start: 'top top', end: '+=120%', pin: true, scrub: .8 } })
    .fromTo('#heartMask', { '--m': '0%' }, { '--m': '260%', ease: 'power2.in', duration: 1 })
    .fromTo('#usForever', { opacity: 0, scale: .6, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: .4, ease: 'back.out(2)' }, .45);
}

// ================================================================= THROUGH MY LENS
// Photos come from photos/lens/photos.js (written by tools/resize-photos.ps1) as [src, width, height].
function initLens() {
  const raw = window.LENS_PHOTOS || [];
  const demo = !raw.length;
  const list = (demo ? Array.from({ length: 24 }, (_, i) => ['', 3, [4, 5, 3.4, 4.6][i % 4]]) : raw).map(([src, w, h]) => {
    const d = /(20\d\d)[-_]?(\d\d)[-_]?(\d\d)/.exec(src); // phone filenames like IMG_20240814_... get a retro date stamp
    return { src, caption: '', ar: w / h, stamp: d ? `'${d[1].slice(2)} ${d[2]} ${d[3]}` : '' };
  });
  gsap.utils.shuffle(list); // a fresh order on every visit
  const n = list.length, pad = s => String(s).padStart(3, '0');
  if (!demo) $('#lensSub').textContent = `${n} frames of my favourite subject · tap any one`;

  const nCols = innerWidth < 640 ? 2 : innerWidth < 1100 ? 3 : 4;
  const cols = Array.from({ length: nCols }, () => []), heights = cols.map(() => 0);
  // balance columns: tallest photos first, each into the shortest column; then shuffle within columns.
  // CSS stretches the last photo of each column so the bottoms end perfectly level.
  list.map((p, i) => i).sort((a, b) => list[a].ar - list[b].ar).forEach(i => {
    const c = heights.indexOf(Math.min(...heights));
    heights[c] += 1 / list[i].ar + .05;
    cols[c].push(i);
  });
  const shotHTML = i => { const p = list[i]; return `
    <button class="shot" data-i="${i}" data-cursor="view" style="--ar:${p.ar}" aria-label="Open photo ${i + 1} of ${n}">
      ${media(p, 'lens')}${p.stamp ? `<span class="shot__date" aria-hidden="true">${p.stamp}</span>` : ''}</button>`; };
  const grid = $('#lensGrid');
  grid.innerHTML = cols.map(c => `<div class="lens__col">${gsap.utils.shuffle(c).map(shotHTML).join('')}</div>`).join('');
  wireImages(grid);
  grid.addEventListener('click', e => {
    const b = e.target.closest('.shot');
    if (b) openLightbox(list, 'lens', +b.dataset.i, b);
  });

  const count = $('#lensCount');
  ScrollTrigger.create({
    trigger: grid, start: 'top center', end: 'bottom center',
    onUpdate: self => (count.textContent = `FRAME ${pad(Math.max(1, Math.ceil(self.progress * n)))} / ${pad(n)}`),
  });
  if (ctx.REDUCED) return;

  // columns drift at different speeds, all settling level as the bottom of the wall arrives
  $$('.lens__col', grid).forEach((col, c) => {
    gsap.fromTo(col, { y: c % 2 ? 240 : 70 }, { y: 0, ease: 'none', scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom bottom', scrub: true } });
  });
  // each photo "develops" as it comes into view: overexposed and grey -> full colour
  const shots = $$('.shot', grid);
  gsap.set(shots, { opacity: 0 });
  // IntersectionObserver (not ScrollTrigger) because the drifting columns would skew precomputed trigger positions
  const io = new IntersectionObserver(entries => {
    const b = entries.filter(e => e.isIntersecting).map(e => e.target);
    if (!b.length) return;
    b.forEach(t => io.unobserve(t));
    gsap.fromTo(b, { opacity: 0, y: 50, filter: 'brightness(2.4) saturate(0) blur(6px)' },
      { opacity: 1, y: 0, filter: 'brightness(1) saturate(1) blur(0px)', duration: 1.3, ease: 'power3.out', stagger: Math.min(.08, .5 / b.length), clearProps: 'filter' });
  });
  shots.forEach(s => io.observe(s));
  // viewfinder powers on with a camera flash
  gsap.timeline({ scrollTrigger: { trigger: '.lens__body', start: 'top 60%', once: true } })
    .fromTo('.lens__flash', { opacity: .85 }, { opacity: 0, duration: .9, ease: 'power2.out' })
    .from('.lens__corner', { scale: 1.6, opacity: 0, duration: .8, ease: 'expo.out', stagger: .05 }, 0)
    .from('.lens__rec, .lens__count, .lens__exif, .lens__batt', { opacity: 0, y: 10, duration: .6, stagger: .08 }, .2);
}

// ================================================================= SQUAD
function initSquad() {
  const list = C.friends;
  if (!list.length) return;
  const nRows = list.length >= 9 ? 3 : 2;
  const rows = Array.from({ length: nRows }, () => []);
  list.forEach((f, i) => rows[i % nRows].push(i));
  const wrap = $('#squadRows');
  wrap.innerHTML = rows.map((idxs, r) => {
    let fill = idxs.slice();
    while (fill.length < 7) fill = fill.concat(idxs);
    const set = fill.map(i => `<button class="polaroid" data-i="${i}" data-cursor="view" style="--r:${gsap.utils.random(-6, 6, 1)}deg">
        <span class="polaroid__tape"></span>${media(list[i], 'friends')}<span class="polaroid__cap">${esc(list[i].caption)}</span></button>`).join('');
    return `<div class="srow" data-dir="${r % 2 ? 1 : -1}"><div class="srow__track"><div class="srow__set">${set}</div><div class="srow__set" aria-hidden="true">${set}</div></div></div>`;
  }).join('');
  wireImages(wrap);
  $$('.srow__set[aria-hidden] .polaroid', wrap).forEach(b => (b.tabIndex = -1));

  const tweens = [];
  $$('.srow', wrap).forEach((row, r) => {
    const track = $('.srow__track', row), dir = +row.dataset.dir;
    const tw = dir < 0
      ? gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: 55 + r * 8, ease: 'none', repeat: -1 })
      : gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: 55 + r * 8, ease: 'none', repeat: -1 });
    tweens.push(tw);
    if (ctx.REDUCED) tw.pause();

    // drag to scrub the loop
    let start = 0, dragged = false;
    const proxy = document.createElement('div');
    Draggable.create(proxy, {
      type: 'x', trigger: row, minimumMovement: 6, allowNativeTouchScrolling: true, dragClickables: true,
      onPress() { start = tw.progress(); dragged = false; },
      onDragStart() { tw.pause(); dragged = true; },
      onDrag() {
        const half = track.offsetWidth / 2, dx = this.x - this.startX;
        tw.progress(gsap.utils.wrap(0, 1, start + (dir < 0 ? -dx : dx) / half));
      },
      onRelease() { if (!ctx.REDUCED) tw.play(); setTimeout(() => (dragged = false), 0); },
    });
    row.addEventListener('click', e => {
      const b = e.target.closest('.polaroid');
      if (b && !dragged) openLightbox(list, 'friends', +b.dataset.i, b);
    });
  });

  if (ctx.REDUCED) return;
  // scroll velocity → skew + speed boost
  const skew = gsap.quickTo('.srow__track', 'skewX', { duration: .5, ease: 'power3' });
  ScrollTrigger.create({
    trigger: '#squad', start: 'top bottom', end: 'bottom top',
    onUpdate(self) {
      const v = self.getVelocity();
      skew(gsap.utils.clamp(-10, 10, v / -250));
      const boost = 1 + Math.min(6, Math.abs(v) / 300);
      tweens.forEach(t => { if (!t.paused()) gsap.to(t, { timeScale: boost, duration: .2, overwrite: true, onComplete: () => gsap.to(t, { timeScale: 1, duration: 1.2 }) }); });
    },
  });
  gsap.from('.srow', { xPercent: i => (i % 2 ? 30 : -30), opacity: 0, duration: 1.6, ease: 'expo.out', stagger: .15, scrollTrigger: { trigger: '#squadRows', start: 'top 85%' } });
}

// ================================================================= NODDY
function initNoddy() {
  const title = $('#noddyTitle');
  title.setAttribute('aria-label', C.dog);
  title.style.setProperty('--n', [...C.dog].length);
  title.innerHTML = [...C.dog.toUpperCase()].map(ch => `<span aria-hidden="true">${esc(ch)}</span>`).join('');
  $('#noddyBubble').textContent = C.noddyLine || `Woof! Happy birthday!`;
  const grid = $('#noddyGrid');
  grid.innerHTML = C.noddy.map((n, i) => `<figure class="noddy__item"><button data-i="${i}" data-cursor="woof" aria-label="Open photo: ${esc(n.caption)}" style="display:block;width:100%;border-radius:inherit">${media(n, 'noddy')}</button><figcaption>${esc(n.caption)}</figcaption></figure>`).join('');
  wireImages(grid);
  $$('button', grid).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openLightbox(C.noddy, 'noddy', +b.dataset.i, b); }));

  const letters = $$('span', title);
  const squish = el => gsap.timeline()
    .to(el, { scaleY: .55, scaleX: 1.35, duration: .14, ease: 'power2.out' })
    .to(el, { scaleY: 1, scaleX: 1, duration: 1.1, ease: 'elastic.out(1.2, .25)' });
  letters.forEach(l => { l.addEventListener('pointerenter', () => squish(l)); l.addEventListener('click', () => squish(l)); });

  // click anywhere → paw prints + woof bubbles
  const section = $('#noddy');
  const WOOFS = ['woof!', 'arf!', 'bork!', '🦴', 'awoo!', `happy bday!`, '💕'];
  section.addEventListener('click', e => {
    if (e.target.closest('button')) return;
    ctx.sfx.play('woof');
    const r = section.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    for (let k = 0; k < 4; k++) {
      const p = document.createElement('span');
      p.className = 'paw'; p.textContent = '🐾';
      section.appendChild(p);
      const ang = gsap.utils.random(-50, 50);
      gsap.fromTo(p, { x: x - 15 + k * 26 * Math.cos(ang * Math.PI / 180), y: y - 15 - k * 32, rotation: ang + (k % 2 ? 18 : -18), scale: 0, opacity: 1 },
        { scale: 1, duration: .25, delay: k * .12, ease: 'back.out(3)', onComplete: () => gsap.to(p, { opacity: 0, delay: 1.2, duration: .6, onComplete: () => p.remove() }) });
    }
    const w = document.createElement('span');
    w.className = 'woof'; w.textContent = WOOFS[(Math.random() * WOOFS.length) | 0];
    section.appendChild(w);
    gsap.fromTo(w, { x: x - 30, y: y - 40, scale: 0, rotation: gsap.utils.random(-15, 15) },
      { y: y - 140, scale: 1, duration: 1.2, ease: 'elastic.out(1, .5)', onComplete: () => gsap.to(w, { opacity: 0, y: '-=30', duration: .5, onComplete: () => w.remove() }) });
  });

  if (ctx.REDUCED) return;
  gsap.from(letters, { yPercent: -160, rotation: () => gsap.utils.random(-30, 30), opacity: 0, stagger: .09, duration: 1.4, ease: 'bounce.out', scrollTrigger: { trigger: title, start: 'top 85%' } });
  gsap.to(letters, { y: -12, duration: .6, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: .14, yoyo: true, repeat: -1 }, delay: 2 });
  gsap.from('#noddyBubble', { scale: 0, rotation: -10, duration: 1, ease: 'elastic.out(1, .5)', scrollTrigger: { trigger: '#noddyBubble', start: 'top 88%' } });
  gsap.from('.noddy__item', { y: -260, rotation: () => gsap.utils.random(-35, 35), opacity: 0, duration: 1.3, ease: 'bounce.out', stagger: .12, scrollTrigger: { trigger: grid, start: 'top 80%' } });
  $$('.noddy__clouds i').forEach((c, i) => gsap.to(c, { x: i % 2 ? 40 : -40, y: gsap.utils.random(-20, 20), duration: gsap.utils.random(5, 9), ease: 'sine.inOut', yoyo: true, repeat: -1 }));
}

// ================================================================= AWARDS
function initAwards() {
  const list = C.awards || [];
  const section = $('#awards');
  if (!list.length) { section.remove(); return; }
  $('#awardsYear').textContent = C.awardsYear || new Date().getFullYear();
  const grid = $('#awardsGrid');
  grid.innerHTML = list.map((a, i) => `
    <button class="award" data-cursor="open" aria-pressed="false" aria-label="Award: ${esc(a.title)}. Tap to reveal the winner">
      <span class="award__inner">
        <span class="award__face award__front">
          <span class="award__no">nº ${String(i + 1).padStart(2, '0')}</span>
          <span class="award__medal">${esc(a.icon || '🏆')}</span>
          <span class="award__cat">best in category</span>
          <span class="award__title">${esc(a.title)}</span>
          <span class="award__tap">tap to open the envelope ✉️</span>
        </span>
        <span class="award__face award__back">
          <span class="award__cat">and the award goes to…</span>
          <span class="award__winner">${esc(C.name)}</span>
          <span class="award__trophy">🏆</span>
          <span class="award__note">${esc(a.note || '')}</span>
          <span class="award__stamp">winner</span>
        </span>
      </span>
    </button>`).join('');

  const GOLD = ['#ffd36b', '#ffb703', '#fff3c4', '#ff2e88', '#ffffff'];
  $$('.award', grid).forEach(card => {
    tilt(card, 8);
    card.addEventListener('click', () => {
      const open = card.classList.toggle('is-open');
      card.setAttribute('aria-pressed', open);
      if (open) ctx.sfx.play('envelope');
      if (!open || ctx.REDUCED) return;
      const r = card.getBoundingClientRect();
      const origin = { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight };
      setTimeout(() => {
        confetti({ particleCount: 90, spread: 80, startVelocity: 38, origin, colors: GOLD, scalar: 1.1, ticks: 220 });
        gsap.fromTo($('.award__stamp', card), { scale: 3, opacity: 0, rotation: -40 }, { scale: 1, opacity: 1, rotation: -14, duration: .5, ease: 'back.out(2.5)' });
      }, 350);
    });
  });

  if (ctx.REDUCED) return;
  gsap.from('.award', { y: 120, rotation: i => (i % 2 ? 6 : -6), opacity: 0, stagger: .14, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: grid, start: 'top 85%' } });
  gsap.from('.award__medal', { rotationY: 540, scale: .3, stagger: .14, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: grid, start: 'top 85%' } });
}

// ================================================================= VIDEOS
function initVideos() {
  const grid = $('#videoGrid');
  // accepts a full YouTube link (youtu.be/…, watch?v=…, shorts/…) or a bare id; Shorts are vertical
  const vids = C.videos.map(v => {
    const s = (v.link || v.id || '').trim();
    const m = /(?:youtu\.be\/|[?&]v=|shorts\/|embed\/)([\w-]{11})/.exec(s);
    const id = m ? m[1] : YT_ID.test(s) ? s : '';
    return { ...v, id, vertical: v.vertical ?? (!!v.file || /shorts\//.test(s)) };
  });
  grid.innerHTML = vids.map((v, i) => {
    const id = v.id;
    const thumb = id ? { src: `https://i.ytimg.com/vi/${id}/${v.vertical ? 'oardefault' : 'hqdefault'}.jpg`, caption: v.name } : { caption: v.name };
    const pic = v.file ? `<span class="media"><video src="${esc(v.file)}#t=0.5" muted playsinline preload="metadata"></video></span>` : media(thumb, 'video');
    return `<button class="vcard${v.vertical ? ' vcard--tall' : ''}" data-i="${i}" data-cursor="play">
      <span class="vcard__thumb">${pic}<span class="vcard__play">▶</span></span>
      <span class="vcard__name">${esc(v.name)}</span><span class="vcard__note">${esc(v.note || '')}</span></button>`;
  }).join('');
  wireImages(grid);

  const section = $('#videos');
  if (!ctx.TOUCH) section.addEventListener('pointermove', e => {
    const r = section.getBoundingClientRect();
    section.style.setProperty('--mx', e.clientX - r.left + 'px');
    section.style.setProperty('--my', e.clientY - r.top + 'px');
  });

  const modal = $('#vmodal'), frame = $('#vmFrame');
  let origin = '50% 50%', isOpen = false;
  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    gsap.to(modal, { clipPath: `circle(0% at ${origin})`, duration: .7, ease: 'expo.inOut', onComplete: () => { modal.hidden = true; frame.innerHTML = ''; } });
    ctx.unlock(); ctx.audio.unduck();
  };
  $$('.vcard', grid).forEach(card => {
    tilt(card, 12);
    card.addEventListener('click', e => {
      const v = vids[+card.dataset.i], id = v.id;
      modal.classList.toggle('is-vertical', !!v.vertical);
      origin = `${e.clientX || innerWidth / 2}px ${e.clientY || innerHeight / 2}px`;
      frame.innerHTML = v.file
        ? `<video src="${esc(v.file)}" controls autoplay playsinline title="Video message from ${esc(v.name)}"></video>`
        : id ?`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="Video message from ${esc(v.name)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen"></iframe>`
        : `<p>${esc(v.name)}'s video is still on its way 🎬<br><small style="font-size:.55em;opacity:.6">add the YouTube id in config.js</small></p>`;
      $('#vmName').textContent = `from ${v.name} 💌`;
      modal.hidden = false; isOpen = true;
      ctx.lock(); ctx.audio.duck();
      gsap.fromTo(modal, { clipPath: `circle(0% at ${origin})` }, { clipPath: `circle(150% at ${origin})`, duration: .9, ease: 'expo.inOut' });
      $('[data-close]', modal).focus({ preventScroll: true });
    });
  });
  $('[data-close]', modal).addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  if (!ctx.REDUCED) gsap.from('.vcard', { y: 80, opacity: 0, rotationX: -25, stagger: .1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: grid, start: 'top 85%' } });
}

// ================================================================= PLAYLIST
function initPlaylist() {
  const list = $('#songList');
  list.innerHTML = C.songs.map((s, i) => `<li><button class="song" data-i="${i}" data-cursor="play">
    <span class="song__n">${String(i + 1).padStart(2, '0')}</span><span class="song__t">${esc(s.title)}</span><span class="song__a">${esc(s.artist)}</span></button></li>`).join('');

  const vinyl = $('#vinyl'), arm = $('#tonearm'), frame = $('#playlistFrame');
  const pid = /^[\w-]+$/.test(C.playlistId || '') ? C.playlistId : '';
  let playing = false, rot = 0, vel = 0, active = false;

  const btn = $('#playBtn'), btnText = btn.textContent;
  // The player stays invisible (audio only); the button toggles play/pause.
  function play(index = 0) {
    if (!pid) { ctx.toast('Add your YouTube playlistId in config.js 🎶'); arm.classList.add('is-playing'); playing = true; return; }
    const id = (C.songs[index] || {}).id;
    const src = YT_ID.test(id || '')
      ? `https://www.youtube-nocookie.com/embed/${id}?list=${pid}&autoplay=1&playsinline=1`
      : `https://www.youtube-nocookie.com/embed/videoseries?list=${pid}&index=${index}&autoplay=1&playsinline=1`;
    frame.innerHTML = `<iframe src="${src}" title="${esc(C.name)}'s playlist" allow="autoplay; encrypted-media"></iframe>`;
    $$('.song', list).forEach((b, i) => b.classList.toggle('is-active', i === index));
    arm.classList.add('is-playing');
    btn.textContent = '❚❚ Pause';
    playing = true;
    ctx.audio.duck();
  }
  function stop() {
    frame.innerHTML = '';
    $$('.song', list).forEach(b => b.classList.remove('is-active'));
    arm.classList.remove('is-playing');
    btn.textContent = btnText;
    playing = false;
    ctx.audio.unduck();
  }
  btn.addEventListener('click', () => (playing && pid ? stop() : play(0)));
  $$('.song', list).forEach(b => b.addEventListener('click', () => play(+b.dataset.i)));

  ScrollTrigger.create({ trigger: '#playlist', start: 'top bottom', end: 'bottom top', onToggle: s => (active = s.isActive), onUpdate: s => (vel = s.getVelocity()) });
  if (!ctx.REDUCED) gsap.ticker.add((t, dt) => {
    if (!active) return;
    const f = dt / 16.67;
    rot += ((playing ? 2.2 : .35) + Math.abs(vel) / 220) * f;
    vel *= .92;
    vinyl.style.transform = `rotate(${rot}deg)`;
  });
  if (!ctx.REDUCED) {
    gsap.from('.turntable', { x: -200, rotation: -90, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '#playlist', start: 'top 70%' } });
    gsap.from('.song', { x: 60, opacity: 0, stagger: .08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: list, start: 'top 85%' } });
  }
}

// ================================================================= FINALE
function initFinale() {
  const wrap = $('#candles');
  const n = Math.max(1, Math.min(12, C.candles || 5));
  wrap.innerHTML = Array.from({ length: n }, (_, i) => `<button class="candle" aria-label="Blow out candle ${i + 1}"><span class="flame"></span><span class="smoke"></span></button>`).join('');
  $('#finaleWish').textContent = C.finaleWish || 'Happy birthday, my love.';

  let universe = null, done = false;
  if (!ctx.REDUCED) {
    universe = createUniverse($('#finaleCanvas'), { count: ctx.SMALL || ctx.TOUCH ? 2200 : 5500, shape: 'stars', intensity: .55, alpha: .55, offsetY: .25, textScale: innerWidth < innerHeight ? 1.15 : .8 });
  }
  if (!universe) $('#finale').style.background = 'radial-gradient(ellipse at 50% 30%, #3b1450, var(--night) 70%)';

  const candles = $$('.candle', wrap);
  function blow(c) {
    if (c.classList.contains('is-out')) return;
    c.classList.add('is-out');
    c.setAttribute('aria-label', 'Candle blown out');
    ctx.sfx.play('puff');
    gsap.fromTo($('.smoke', c), { opacity: .8, y: 0, scale: 1 }, { opacity: 0, y: -70, x: gsap.utils.random(-15, 15), scale: 4, duration: 1.6, ease: 'power1.out' });
    if (candles.every(x => x.classList.contains('is-out'))) celebrate();
  }
  candles.forEach(c => c.addEventListener('click', () => blow(c)));

  function celebrate() {
    if (done) return;
    done = true;
    universe?.setAlpha(1);
    universe?.setShape('I LOVE\nYOU');
    if (universe) gsap.to('.finale__inner > .kicker, .finale__inner > h2, .finale__sub', { autoAlpha: 0, y: -30, duration: .8 });
    if (universe) gsap.to(universe.uniforms.bg.uIntensity, { value: 1, duration: 2 });
    const end = Date.now() + 4500;
    (function fire() {
      ctx.burstConfetti({ x: Math.random(), y: Math.random() * .5 });
      ctx.sfx.play('boom');
      if (Date.now() < end) setTimeout(fire, 380);
    })();
    gsap.to('.cake', { y: 40, scale: .85, duration: 1.4, ease: 'expo.out' });
    gsap.to('#finaleEnd', { autoAlpha: 1, duration: 1.2, delay: .8 });
    gsap.from('#finaleEnd > *', { y: 40, opacity: 0, stagger: .2, duration: 1.2, delay: .8, ease: 'expo.out' });
    setTimeout(() => ScrollTrigger.refresh(), 2500);
  }

  // mic: blow candles out one by one when it hears a whoosh
  $('#micBtn').addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const an = ac.createAnalyser();
      an.fftSize = 512;
      ac.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize);
      let loud = 0, lastBlow = 0;
      ctx.toast('Listening… now blow! 🌬️');
      ctx.audio.duck(); // silence the tune so the mic only hears her
      (function listen() {
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (const b of buf) { const v = (b - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / buf.length);
        loud = rms > .14 ? loud + 1 : 0;
        if (loud > 4 && performance.now() - lastBlow > 220) {
          lastBlow = performance.now();
          const next = candles.find(c => !c.classList.contains('is-out'));
          if (next) blow(next);
        }
        if (candles.some(c => !c.classList.contains('is-out'))) requestAnimationFrame(listen);
        else { stream.getTracks().forEach(t => t.stop()); ac.close(); ctx.audio.unduck(); }
      })();
    } catch (e) {
      ctx.toast('No mic? No problem — just tap the candles 🕯️');
    }
  });

  $('#replayBtn').addEventListener('click', () => {
    candles.forEach(c => { c.classList.remove('is-out'); c.setAttribute('aria-label', 'Blow out candle'); });
    done = false;
    universe?.setShape('stars'); universe?.setAlpha(.55);
    if (universe) universe.uniforms.bg.uIntensity.value = .55;
    gsap.to('#finaleEnd', { autoAlpha: 0, duration: .5 });
    gsap.to('.finale__inner > .kicker, .finale__inner > h2, .finale__sub', { autoAlpha: 1, y: 0, duration: .5 });
    gsap.to('.cake', { y: 0, scale: 1, duration: .8 });
    ctx.lenis ? ctx.lenis.scrollTo(0, { duration: 4, easing: t => 1 - Math.pow(1 - t, 4) }) : scrollTo({ top: 0, behavior: 'smooth' });
  });

  if (!ctx.REDUCED) gsap.from('.cake', { y: 120, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.cake', start: 'top 90%' } });
}

export function initChapters(context) {
  ctx = context;
  esc = ctx.esc;
  initLightbox();
  initLetter();
  initTravel();
  initUs();
  initLens();
  initSquad();
  initNoddy();
  initAwards();
  initVideos();
  initPlaylist();
  initFinale();
}
