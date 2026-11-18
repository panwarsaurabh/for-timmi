// Boot: preloader → gift → hero. Sets up smooth scroll, cursor, sound and
// hands a shared `ctx` to every chapter.
import { createUniverse } from './webgl.js';
import { initChapters } from './chapters.js';
import { initWall } from './wall.js';

const C = window.CONFIG;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

gsap.registerPlugin(ScrollTrigger, Draggable);
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = matchMedia('(pointer: coarse)').matches;
const SMALL = innerWidth < 768;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);

// ---------------------------------------------------------------- names
document.title = `For ${C.name} 💖`;
$$('[data-name]').forEach(el => (el.textContent = C.name));
const HERO_NAME = (C.heroName || C.name).toUpperCase();
$$('[data-hero-name]').forEach(el => (el.textContent = C.heroName || C.name));
$$('[data-from]').forEach(el => (el.textContent = C.from));
$$('[data-dog]').forEach(el => (el.textContent = C.dog));

// ---------------------------------------------------------------- smooth scroll
let lenis = null;
if (!REDUCED && window.Lenis) {
  lenis = new Lenis({ lerp: .085, wheelMultiplier: 1, touchMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}

let locks = 1; // starts locked (loader + gift)
function lock() { if (locks++ === 0) { document.body.classList.add('is-locked'); lenis?.stop(); } }
function unlock() { if (locks > 0 && --locks === 0) { document.body.classList.remove('is-locked'); lenis?.start(); } }

// ---------------------------------------------------------------- toast
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 4200);
}

// ---------------------------------------------------------------- sound
const bgm = $('#bgm'), soundBtn = $('#soundBtn');
const audio = {
  playing: false, resume: false,
  play() {
    if (!C.music) return;
    bgm.volume = 0;
    bgm.play().then(() => {
      this.playing = true;
      gsap.to(bgm, { volume: .45, duration: 2.5 });
      soundBtn.classList.add('is-on');
      soundBtn.setAttribute('aria-pressed', 'true');
    }).catch(() => {});
  },
  pause() {
    this.playing = false;
    gsap.to(bgm, { volume: 0, duration: .6, onComplete: () => bgm.pause() });
    soundBtn.classList.remove('is-on');
    soundBtn.setAttribute('aria-pressed', 'false');
  },
  toggle() { this.playing ? this.pause() : this.play(); },
  duck() { this.resume = this.resume || this.playing; if (this.playing) this.pause(); },
  unduck() { if (this.resume) this.play(); this.resume = false; },
};
if (C.music) {
  bgm.src = C.music;
  bgm.addEventListener('error', () => (soundBtn.hidden = true));
} else soundBtn.hidden = true;
soundBtn.addEventListener('click', () => audio.toggle());

const ctx = { lenis, REDUCED, TOUCH, SMALL, toast, lock, unlock, audio, esc };

// ---------------------------------------------------------------- cursor
function initCursor() {
  if (TOUCH || REDUCED) { document.body.classList.add('no-cursor'); return; }
  const cur = $('.cursor'), dot = $('.cursor-dot'), label = $('.cursor__label');
  gsap.set([cur, dot], { xPercent: -50, yPercent: -50, x: innerWidth / 2, y: innerHeight / 2 });
  const cx = gsap.quickTo(cur, 'x', { duration: .45, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .45, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: .08 }), dy = gsap.quickTo(dot, 'y', { duration: .08 });
  const SPARKS = ['✦', '♥', '✧', '❤', '⋆'], COLORS = ['#ff2e88', '#ffc93c', '#5ec8ff', '#a78bfa', '#ff7a59'];
  let last = 0;
  // over a YouTube iframe (or outside the window) the page stops getting moves: hide ours, the native one shows
  document.documentElement.addEventListener('pointerleave', () => document.body.classList.add('cursor-away'));
  addEventListener('pointermove', e => {
    document.body.classList.toggle('cursor-away', e.target.tagName === 'IFRAME');
    cx(e.clientX); cy(e.clientY); dx(e.clientX); dy(e.clientY);
    const now = performance.now();
    if (now - last > 45) {
      last = now;
      const s = document.createElement('span');
      s.className = 'spark';
      s.textContent = cur.classList.contains('is-paw') ? '🐾' : SPARKS[(Math.random() * SPARKS.length) | 0];
      s.style.color = COLORS[(Math.random() * COLORS.length) | 0];
      document.body.appendChild(s);
      gsap.fromTo(s, { x: e.clientX - 6, y: e.clientY - 6, scale: gsap.utils.random(.6, 1.2), rotation: gsap.utils.random(-40, 40), opacity: .9 },
        { y: `+=${gsap.utils.random(14, 40)}`, x: `+=${gsap.utils.random(-20, 20)}`, scale: 0, opacity: 0, duration: gsap.utils.random(.7, 1.1), ease: 'power2.out', onComplete: () => s.remove() });
    }
  }, { passive: true });
  document.addEventListener('pointerover', e => {
    if (e.target.tagName === 'IFRAME') document.body.classList.add('cursor-away');
    const t = e.target.closest('[data-cursor], a, button, .note, .polaroid');
    const l = t?.dataset.cursor || (t?.closest('[data-cursor]')?.dataset.cursor) || '';
    cur.classList.toggle('is-hover', !!t);
    cur.classList.toggle('has-label', !!l);
    label.textContent = l;
    cur.classList.toggle('is-paw', !!e.target.closest('#noddy'));
  });
  document.addEventListener('pointerdown', () => gsap.to(cur, { scale: .8, duration: .15, yoyo: true, repeat: 1 }));
}

// ---------------------------------------------------------------- global scroll bits
function initGlobal() {
  gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  const num = $('.chapter-ind__num'), lab = $('.chapter-ind__label');
  $$('[data-chapter]').forEach((s, i) => ScrollTrigger.create({
    trigger: s, start: 'top 55%', end: 'bottom 55%',
    onToggle: self => {
      if (!self.isActive) return;
      gsap.to([num, lab], { yPercent: -100, opacity: 0, duration: .25, onComplete: () => {
        num.textContent = String(i + 1).padStart(2, '0');
        lab.textContent = s.dataset.chapter;
        gsap.fromTo([num, lab], { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .45, ease: 'expo.out' });
      } });
    },
  }));

  // kinetic headings
  if (!REDUCED) $$('[data-split]').forEach(el => {
    const split = new SplitType(el, { types: 'words,chars' });
    $$('em .char', el).forEach((c, i) => (c.style.animationDelay = `${-i * .35}s`));
    gsap.from(split.chars, {
      yPercent: 115, rotate: 8, opacity: 0, stagger: .028, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  $('.topbar__logo').addEventListener('click', e => { e.preventDefault(); lenis ? lenis.scrollTo(0, { duration: 2.4 }) : scrollTo({ top: 0, behavior: 'smooth' }); });
}

// ---------------------------------------------------------------- hero
let hero = null;
function initHero() {
  const m = $('#heroMarquee');
  const items = C.marquee.map(t => `<span>${esc(t)}</span><span class="star">✦</span>`).join('');
  m.innerHTML = items + items + items + items;

  const portrait = innerWidth < innerHeight;
  if (!REDUCED) hero = createUniverse($('#heroCanvas'), { count: SMALL || TOUCH ? 3600 : 6500, shape: HERO_NAME, collapsed: true, offsetY: portrait ? -.04 : -.15 });
  if (!hero) document.documentElement.classList.add('no-webgl');

  if (REDUCED) return;
  // Pin the hero: on scroll the name explodes into a heart
  const tl = gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=110%', pin: true, scrub: .6,
    onUpdate: self => hero?.setShape(self.progress > .35 ? 'heart' : HERO_NAME) } });
  tl.to('.hero__content', { yPercent: -60, opacity: 0, ease: 'none' }, 0)
    .to('.hero__scroll', { opacity: 0, duration: .2 }, 0)
    .to('.hero__marquee', { yPercent: 100, ease: 'none' }, .4);
}

function heroIntro() {
  const lines = $$('.hero__line');
  const tl = gsap.timeline();
  if (!REDUCED) {
    const split = new SplitType(lines, { types: 'chars' });
    tl.from(split.chars, { yPercent: 120, rotateX: -90, opacity: 0, stagger: .045, duration: 1.4, ease: 'expo.out' }, 0)
      .from('.hero__kicker', { y: 20, opacity: 0, duration: 1, ease: 'expo.out' }, .3)
      .from('.hero__marquee', { yPercent: 100, duration: 1.2, ease: 'expo.out' }, .5)
      .from('.hero__scroll', { opacity: 0, y: 20, duration: 1 }, .9);
  }
  return tl;
}

// ---------------------------------------------------------------- confetti
const PAL = ['#ff2e88', '#ff7a59', '#ffc93c', '#a78bfa', '#5ec8ff', '#ffffff'];
let heartShape = null;
try { heartShape = confetti.shapeFromPath({ path: 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z' }); } catch (e) { /* older browsers: plain confetti */ }
function burstConfetti(origin = { x: .5, y: .55 }) {
  if (REDUCED) return;
  confetti({ particleCount: 160, spread: 120, startVelocity: 48, origin, colors: PAL, ticks: 260 });
  if (heartShape) confetti({ particleCount: 40, spread: 100, startVelocity: 38, origin, shapes: [heartShape], colors: ['#ff2e88', '#ff7a59', '#ff8fc7'], scalar: 2.2, ticks: 300 });
}
ctx.burstConfetti = burstConfetti;
ctx.palette = PAL;

// ---------------------------------------------------------------- loader → gift
async function boot() {
  const nameEl = $('.loader__name');
  nameEl.innerHTML = [...C.name].map(ch => `<span>${esc(ch)}</span>`).join('');
  gsap.from('.loader__name span', { yPercent: 100, opacity: 0, stagger: .08, duration: .9, ease: 'expo.out' });

  const countEl = $('#loaderCount'), counter = { v: 0 };
  const show = () => (countEl.textContent = String(Math.round(counter.v)).padStart(3, '0'));
  const pageReady = Promise.race([
    Promise.all([
      document.fonts.ready,
      document.fonts.load('800 100px Syne').catch(() => {}),
      new Promise(r => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true }))),
    ]),
    new Promise(r => setTimeout(r, 5000)),
  ]);
  await gsap.to(counter, { v: 88, duration: 1.7, ease: 'power2.inOut', onUpdate: show });
  await pageReady;
  await gsap.to(counter, { v: 100, duration: .35, ease: 'power1.out', onUpdate: show });

  initCursor();
  initHero();
  initChapters(ctx);
  initWall(ctx);
  initGlobal();
  ScrollTrigger.refresh();

  const gift = $('#gift');
  gsap.timeline()
    .to('#loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' })
    .add(() => $('#loader').remove())
    .from('.gift__btn', { scale: .4, opacity: 0, rotate: -20, duration: 1.2, ease: 'elastic.out(1, .6)' }, '-=.5')
    .from('.gift__kicker, .gift__hint', { y: 20, opacity: 0, stagger: .15, duration: .8, ease: 'expo.out' }, '-=.9');

  $('#giftBtn').addEventListener('click', () => {
    audio.play();
    gsap.timeline()
      .to('.gift__btn', { rotation: -5, duration: .07, repeat: 5, yoyo: true, ease: 'sine.inOut' })
      .to('.gift__lid', { y: -280, x: 80, rotation: 35, opacity: 0, duration: 1, ease: 'power3.out' })
      .add(() => { burstConfetti(); hero?.burst(HERO_NAME); }, '<')
      .to('.gift__box, .gift__glow', { scale: 1.5, opacity: 0, duration: .7, ease: 'power2.in' }, '<.15')
      .to('.gift__kicker, .gift__hint', { opacity: 0, y: -20, duration: .4 }, '<')
      .to(gift, { opacity: 0, duration: .9, ease: 'power2.inOut', onComplete: () => { gift.remove(); unlock(); } }, '-=.3')
      .add(heroIntro(), '-=.7');
  }, { once: true });
}

boot();
