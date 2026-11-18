// Wish wall: reads wishes from a published Google Sheet (CSV), writes new ones
// through the linked Google Form, and lays them out on a draggable board.
const C = window.CONFIG;
const $ = (s, r = document) => r.querySelector(s);
const COLORS = { pink: '#ffb3d1', sun: '#ffe08a', sky: '#a8e1ff', lilac: '#d6c8ff', mint: '#b8f2d0', coral: '#ffc2ad' };
const KEYS = Object.keys(COLORS);
const PENDING = 'for-timmi-pending-wishes';

// Quote-aware CSV parser (handles commas, quotes and newlines inside cells).
export function parseCSV(s) {
  const rows = [];
  let row = [], f = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}

export function rowsToWishes(rows) {
  if (rows.length < 2) return [];
  const head = rows[0].map(h => h.toLowerCase());
  const find = (...keys) => head.findIndex(h => keys.some(k => h.includes(k)));
  let ni = find('name'), mi = find('message', 'wish'), ci = find('colo');
  if (mi < 0) { ni = 1; mi = 2; ci = 3; } // Timestamp, Name, Message, Color
  return rows.slice(1)
    .map(r => ({ name: (r[ni] || '').trim().slice(0, 40), message: (r[mi] || '').trim().slice(0, 600), color: (r[ci] || '').trim().toLowerCase() }))
    .filter(w => w.message);
}

const keyOf = w => `${w.name}|${w.message}`.trim().toLowerCase();
const store = {
  get() { try { return JSON.parse(localStorage.getItem(PENDING)) || []; } catch (e) { return []; } },
  set(v) { try { localStorage.setItem(PENDING, JSON.stringify(v.slice(-20))); } catch (e) { /* private mode */ } },
};

export function initWall(ctx) {
  const viewport = $('#wallViewport'), board = $('#wallBoard'), countEl = $('#wishCount');
  const cfg = C.wall || {};
  const formOk = /^[\w-]{10,}$/.test(cfg.formId || '') && !Object.values(cfg.fields || {}).some(v => /^entry\.0+$/.test(v));
  const csvOk = /^https:\/\/docs\.google\.com\//.test(cfg.csvUrl || '');
  const notes = []; // { w, el }
  const seen = new Set();
  let dragged = false, drag;
  const CW = ctx.SMALL ? 190 : 240, CH = ctx.SMALL ? 200 : 230;

  // ------------------------------------------------------------ layout
  function layout(animate) {
    const n = Math.max(notes.length, 1);
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    let cols, rows;
    if (ctx.TOUCH) { rows = Math.max(1, Math.floor((vh - 40) / CH)); cols = Math.max(2, Math.ceil(n / rows) + 1); }
    else { cols = Math.max(4, Math.ceil(Math.sqrt(n * 1.8)) + 1); rows = Math.max(3, Math.ceil(n / cols) + 1); }
    const bw = Math.max(vw, cols * CW + 80), bh = ctx.TOUCH ? vh : Math.max(vh * 1.15, rows * CH + 100);
    board.style.width = bw + 'px'; board.style.height = bh + 'px';
    // cells sorted from the centre outwards, so the newest wish sits in the middle
    const cells = [];
    const ox = (bw - cols * CW) / 2, oy = (bh - rows * CH) / 2;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ x: ox + c * CW, y: oy + r * CH });
    cells.sort((a, b) => Math.hypot(a.x + CW / 2 - bw / 2, (a.y + CH / 2 - bh / 2) * 1.4) - Math.hypot(b.x + CW / 2 - bw / 2, (b.y + CH / 2 - bh / 2) * 1.4));
    notes.forEach((nt, i) => {
      const cell = cells[i % cells.length];
      const x = cell.x + nt.jx, y = cell.y + nt.jy + 16;
      if (animate) gsap.to(nt.el, { left: x, top: y, duration: 1, ease: 'expo.inOut' });
      else gsap.set(nt.el, { left: x, top: y });
    });
    if (!drag) return;
    drag.applyBounds(viewport);
  }
  function centre() {
    gsap.set(board, { x: (viewport.clientWidth - board.offsetWidth) / 2, y: (viewport.clientHeight - board.offsetHeight) / 2 });
    drag?.update(true);
  }

  // ------------------------------------------------------------ notes
  function makeNote(w) {
    const color = COLORS[w.color] || COLORS[KEYS[(Math.random() * KEYS.length) | 0]];
    const env = notes.length % 3 === 2;
    const el = document.createElement('button');
    el.className = 'note' + (env ? ' note--env' : '');
    el.style.setProperty('--c', color);
    el.style.setProperty('--r', gsap.utils.random(-8, 8, 1) + 'deg');
    el.setAttribute('aria-label', `Open wish from ${w.name || 'someone special'}`);
    const from = document.createElement('span'); from.className = 'note__from'; from.textContent = env ? `💌 from ${w.name || 'a friend'}` : (w.name || 'a friend');
    const msg = document.createElement('span'); msg.className = 'note__msg'; msg.textContent = w.message;
    el.append(from, msg);
    el.addEventListener('click', () => { if (!dragged) openWish(w, el, color); });
    return { w, el, jx: gsap.utils.random(0, CW - (ctx.SMALL ? 175 : 215)), jy: gsap.utils.random(-12, 12) };
  }
  function addWish(w, isNew) {
    const k = keyOf(w);
    if (!w.message || seen.has(k)) return false;
    seen.add(k);
    const nt = makeNote(w);
    notes.unshift(nt);
    board.appendChild(nt.el);
    if (isNew) nt.el.classList.add('note--new');
    return true;
  }
  function refreshCount() {
    countEl.textContent = notes.length;
    let empty = $('.wall__empty', viewport);
    if (!notes.length && !empty) {
      empty = document.createElement('p'); empty.className = 'wall__empty'; empty.textContent = 'Be the first to write a wish ✨';
      viewport.appendChild(empty);
    } else if (notes.length && empty) empty.remove();
  }

  // ------------------------------------------------------------ data
  async function fetchCsv() {
    const url = cfg.csvUrl + (cfg.csvUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    return rowsToWishes(parseCSV(await res.text()));
  }
  async function load() {
    (C.wishes || []).forEach(w => addWish(w));
    if (!csvOk) {
      store.get().forEach(w => addWish(w));
    } else {
      try {
        const ws = await fetchCsv();
        ws.forEach(w => addWish(w)); // oldest first → newest ends up in the centre
        const pending = store.get().filter(p => !seen.has(keyOf(p)));
        pending.forEach(w => addWish(w));
        store.set(pending);
      } catch (e) {
        store.get().forEach(w => addWish(w));
        console.warn('Wish wall: could not load the sheet', e);
      }
    }
    layout(false); centre(); refreshCount();
    ScrollTrigger.refresh();
  }
  async function poll() {
    if (!csvOk || document.hidden) return;
    try {
      const ws = await fetchCsv();
      let added = 0;
      ws.forEach(w => { if (addWish(w, true)) added++; });
      if (added) { layout(true); refreshCount(); }
    } catch (e) { /* try again next time */ }
  }

  // ------------------------------------------------------------ drag
  drag = Draggable.create(board, {
    type: ctx.TOUCH ? 'x' : 'x,y',
    bounds: viewport,
    edgeResistance: .8,
    dragClickables: true,
    allowNativeTouchScrolling: true,
    minimumMovement: 6,
    onDragStart() { dragged = true; },
    onRelease() { setTimeout(() => (dragged = false), 0); },
  })[0];
  addEventListener('resize', () => { layout(false); drag.applyBounds(viewport); });

  // ------------------------------------------------------------ read a wish
  const wm = $('#wishModal'), card = $('#wishCard');
  let wishTl = null;
  function openWish(w, el, color) {
    $('#wishFront').innerHTML = '';
    const big = document.createElement('div');
    big.style.textAlign = 'center';
    big.innerHTML = '<div style="font-size:4.5rem;line-height:1">💌</div>';
    const fromLine = document.createElement('div'); fromLine.textContent = `from ${w.name || 'someone special'}`;
    big.appendChild(fromLine);
    $('#wishFront').appendChild(big);
    const back = $('#wishBack');
    back.innerHTML = '';
    const m = document.createElement('p'); m.className = 'wc-msg'; m.textContent = w.message;
    const f = document.createElement('p'); f.className = 'wc-from'; f.textContent = `— ${w.name || 'with love'}`;
    back.append(m, f);
    card.style.setProperty('--c', color);

    wm.hidden = false;
    ctx.lock();
    const r = el.getBoundingClientRect();
    const cw = card.offsetWidth, ch = card.offsetHeight;
    const cx = (innerWidth - cw) / 2, cy = (innerHeight - ch) / 2;
    const rot = parseFloat(el.style.getPropertyValue('--r')) || 0;
    el.style.visibility = 'hidden';
    // hide the board while a wish is open: some GPUs paint the notes over the 3D-flipping card
    board.style.visibility = 'hidden';
    wishTl = gsap.timeline({ onReverseComplete: () => { wm.hidden = true; el.style.visibility = ''; board.style.visibility = ''; ctx.unlock(); } })
      .fromTo(wm, { backgroundColor: 'rgba(10,3,18,0)', backdropFilter: 'blur(0px)' }, { backgroundColor: 'rgba(10,3,18,.7)', backdropFilter: 'blur(10px)', duration: .5 }, 0)
      .fromTo(card,
        { x: r.left + r.width / 2 - cw / 2, y: r.top + r.height / 2 - ch / 2, scaleX: r.width / cw, scaleY: r.height / ch, rotation: rot, rotationY: 0 },
        { x: cx, y: cy, scaleX: 1, scaleY: 1, rotation: 0, duration: .8, ease: 'expo.inOut' }, 0)
      .to(card, { rotationY: 180, duration: 1, ease: 'back.out(1.3)' }, .65);
    $('[data-close]', wm).focus({ preventScroll: true });
  }
  const closeWish = () => { if (wishTl && !wm.hidden) wishTl.timeScale(1.6).reverse(); };
  $('[data-close]', wm).addEventListener('click', closeWish);
  wm.addEventListener('click', e => { if (e.target === wm) closeWish(); });

  // ------------------------------------------------------------ write a wish
  const writeModal = $('#writeModal'), form = $('#wishForm');
  const sw = $('.swatches', form);
  KEYS.forEach((k, i) => sw.insertAdjacentHTML('beforeend',
    `<label><input type="radio" name="color" value="${k}" ${i ? '' : 'checked'} aria-label="${k}"><span style="--c:${COLORS[k]}"></span></label>`));
  const openWrite = () => {
    writeModal.hidden = false; ctx.lock();
    gsap.fromTo(writeModal, { opacity: 0 }, { opacity: 1, duration: .35 });
    gsap.fromTo(form, { y: 80, scale: .9, rotation: -3 }, { y: 0, scale: 1, rotation: 0, duration: .8, ease: 'expo.out' });
    setTimeout(() => form.elements.namedItem('name').focus(), 100);
  };
  const closeWrite = () => {
    if (writeModal.hidden) return;
    gsap.to(writeModal, { opacity: 0, duration: .3, onComplete: () => (writeModal.hidden = true) });
    ctx.unlock();
  };
  $('#writeBtn').addEventListener('click', openWrite);
  $('[data-close]', writeModal).addEventListener('click', closeWrite);
  writeModal.addEventListener('click', e => { if (e.target === writeModal) closeWrite(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { closeWrite(); closeWish(); } });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const val = n => (form.elements.namedItem(n)?.value || '').trim();
    const w = { name: val('name').slice(0, 40), message: val('message').slice(0, 600), color: val('color') };
    if (!w.name || !w.message) return;
    const btn = $('button[type=submit]', form);
    btn.disabled = true;
    try {
      if (formOk) {
        const body = new URLSearchParams({ [cfg.fields.name]: w.name, [cfg.fields.message]: w.message, [cfg.fields.color]: w.color });
        await fetch(`https://docs.google.com/forms/d/e/${cfg.formId}/formResponse`, { method: 'POST', mode: 'no-cors', body });
        store.set([...store.get(), w]);
      }
      addWish(w, true);
      layout(true); refreshCount();
      gsap.to(board, { x: (viewport.clientWidth - board.offsetWidth) / 2, y: (viewport.clientHeight - board.offsetHeight) / 2, duration: 1, ease: 'expo.inOut', onComplete: () => drag.update(true) });
      closeWrite();
      form.reset();
      ctx.toast(formOk ? 'Your wish is pinned 💌 (it may take a few minutes to show for everyone)' : 'Demo mode: connect the Google Form in config.js to save wishes ✨');
      const r = viewport.getBoundingClientRect();
      setTimeout(() => ctx.burstConfetti({ x: .5, y: Math.min(.9, Math.max(.1, (r.top + r.height / 2) / innerHeight)) }), 400);
      ctx.lenis ? ctx.lenis.scrollTo(viewport, { offset: -80, duration: 1.4 }) : viewport.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      ctx.toast('Hmm, that did not send. Check your connection and try again 🙏');
    } finally {
      btn.disabled = false;
    }
  });

  load();
  if (csvOk) setInterval(poll, 60000);
}
