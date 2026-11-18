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
    if (sfx.muted) return;
    if (!C.music) { this.playing = sfx.tune.start(); return; } // no mp3: music-box Happy Birthday
    bgm.volume = 0;
    bgm.play().then(() => {
      this.playing = true;
      gsap.to(bgm, { volume: .45, duration: 2.5 });
    }).catch(() => {});
  },
  pause() {
    this.playing = false;
    if (!C.music) return sfx.tune.stop();
    gsap.to(bgm, { volume: 0, duration: .6, onComplete: () => bgm.pause() });
  },
  // a video or song is playing: pause the music and keep UI sounds quiet
  duck() { this.resume = this.resume || this.playing; if (this.playing) this.pause(); sfx.quiet = true; },
  unduck() { if (this.resume) this.play(); this.resume = false; sfx.quiet = false; },
};

// UI sound effects, synthesized with Web Audio (no files to download)
const sfx = (() => {
  let ac, out, noise;
  let muted = false;
  try { muted = localStorage.getItem('sfxMuted') === '1'; } catch {}
  const init = () => {
    if (ac) return ac.state === 'suspended' ? ac.resume() : null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    out = ac.createGain(); out.gain.value = .35; out.connect(ac.destination);
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  };
  const env = (g, t, vol, dur, attack = .005) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  };
  const tone = (f1, f2, dur, { type = 'sine', vol = .5, at = 0, lp } = {}) => {
    const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    let node = o;
    if (lp) { const f = ac.createBiquadFilter(); f.frequency.value = lp; o.connect(f); node = f; }
    node.connect(g); g.connect(out); env(g, t, vol, dur);
    o.start(t); o.stop(t + dur + .05);
  };
  const hiss = (dur, { type = 'lowpass', freq = 1000, freq2 = freq, q = 1, vol = .5, at = 0, attack } = {}) => {
    const t = ac.currentTime + at, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    f.frequency.exponentialRampToValueAtTime(freq2, t + dur);
    s.connect(f); f.connect(g); g.connect(out); env(g, t, vol, dur, attack);
    s.start(t, Math.random() * .5); s.stop(t + dur + .05);
  };
  const SOUNDS = {
    gift() { // pop + sparkly chime
      tone(620, 160, .14, { vol: .6 });
      hiss(.08, { type: 'highpass', freq: 2500, vol: .25 });
      [1319, 1760, 2093, 2637].forEach((f, i) => tone(f, f, .7, { type: 'triangle', vol: .16, at: .1 + i * .07 }));
    },
    envelope() { // paper rustle
      hiss(.22, { type: 'bandpass', freq: 900, freq2: 3500, q: .8, vol: .3, attack: .04 });
    },
    woof() { // cartoon bark-bark
      tone(330, 170, .12, { type: 'sawtooth', vol: .35, lp: 1100 });
      tone(360, 180, .1, { type: 'sawtooth', vol: .28, lp: 1100, at: .17 });
    },
    puff() { hiss(.35, { freq: 900, freq2: 300, vol: .4, attack: .06 }); },
    boom() { // soft firework: thump + crackle
      tone(120, 50, .3, { vol: .35 });
      hiss(.45, { freq: 2500, freq2: 400, vol: .22, at: .02 });
    },
  };
  // Happy Birthday (public domain) as a soft looping music box, with a little echo
  const C4 = 261.63, n = s => C4 * 2 ** (s / 12); // semitones above middle C
  const G4 = n(7), A4 = n(9), B4 = n(11), C5 = n(12), D5 = n(14), E5 = n(16), F5 = n(17), G5 = n(19);
  const SONG = [ // [note, beats] in 3/4
    [G4, .75], [G4, .25], [A4, 1], [G4, 1], [C5, 1], [B4, 2],
    [G4, .75], [G4, .25], [A4, 1], [G4, 1], [D5, 1], [C5, 2],
    [G4, .75], [G4, .25], [G5, 1], [E5, 1], [C5, 1], [B4, 1], [A4, 2],
    [F5, .75], [F5, .25], [E5, 1], [C5, 1], [D5, 1], [C5, 3],
  ];
  const BEAT = .62, GAP = 5; // seconds per beat (slow, lullaby pace), pause between loops
  let bus = null, timer = 0;
  const loop = () => {
    let t = ac.currentTime + .1;
    for (const [f, b] of SONG) {
      for (const [mult, v] of [[1, .2], [2, .025]]) { // soft bell: mostly pure tone, gentle fade-in
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = f * mult;
        o.connect(g); g.connect(bus);
        env(g, t, v, 1.8, .03);
        o.start(t); o.stop(t + 1.9);
      }
      t += b * BEAT;
    }
    timer = setTimeout(loop, (t - ac.currentTime + GAP) * 1000);
  };
  const tune = {
    start() {
      if (!ac || bus) return !!bus;
      bus = ac.createGain(); bus.gain.value = 0; bus.connect(out);
      const echo = ac.createDelay(), fb = ac.createGain();
      echo.delayTime.value = .38; fb.gain.value = .2;
      bus.connect(echo); echo.connect(fb); fb.connect(echo); echo.connect(out);
      bus.gain.linearRampToValueAtTime(.18, ac.currentTime + 3); // TUNE VOLUME: raise/lower this number
      loop();
      return true;
    },
    stop() {
      if (!bus) return;
      clearTimeout(timer);
      const b = bus; bus = null;
      b.gain.cancelScheduledValues(ac.currentTime);
      b.gain.setValueAtTime(b.gain.value, ac.currentTime);
      b.gain.linearRampToValueAtTime(0, ac.currentTime + .6);
      setTimeout(() => b.disconnect(), 700);
    },
  };
  return {
    tune,
    quiet: false,
    get muted() { return muted; },
    setMuted(m) { muted = m; try { localStorage.setItem('sfxMuted', m ? '1' : '0'); } catch {} },
    unlock: init, // call from a tap: browsers only allow audio after one
    play(name) {
      if (muted || this.quiet || REDUCED || !ac) return;
      try { SOUNDS[name](); } catch (e) { console.warn('sfx', name, e.message); }
    },
  };
})();

// the speaker button: turns UI sounds (and music, if any) on/off
const setSoundBtn = on => { soundBtn.classList.toggle('is-on', on); soundBtn.setAttribute('aria-pressed', String(on)); };
if (C.music) {
  bgm.src = C.music;
  bgm.addEventListener('error', () => (C.music = ''));
}
soundBtn.setAttribute('aria-label', 'Sound on/off');
soundBtn.addEventListener('click', () => {
  sfx.unlock();
  sfx.setMuted(!sfx.muted);
  if (sfx.muted) audio.pause();
  else if (sfx.quiet) audio.resume = true; // a video/song is playing: start once it closes
  else audio.play();
  setSoundBtn(!sfx.muted);
});
setSoundBtn(!sfx.muted);

const ctx = { lenis, REDUCED, TOUCH, SMALL, toast, lock, unlock, audio, sfx, esc };

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
    sfx.unlock();
    setTimeout(() => sfx.play('gift'), 420); // as the lid flies off
    setTimeout(() => { if (!sfx.quiet) audio.play(); }, 1800); // then the birthday tune, after the chime
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
