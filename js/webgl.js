// Three.js "universe": liquid gradient shader background + particles that
// morph between shapes (text, heart, starfield) and flee from the cursor.
import * as THREE from 'three';

const PALETTE = ['#ff2e88', '#ff7a59', '#ffc93c', '#a78bfa', '#5ec8ff', '#ffffff', '#ff8fc7'];

const BG_FRAG = /* glsl */`
precision highp float;
uniform float uTime; uniform vec2 uMouse; uniform vec2 uRes; uniform float uIntensity;
varying vec2 vUv;
vec2 hash(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453123); }
float noise(vec2 p){
  const float K1=0.366025404; const float K2=0.211324865;
  vec2 i=floor(p+(p.x+p.y)*K1); vec2 a=p-i+(i.x+i.y)*K2;
  float m=step(a.y,a.x); vec2 o=vec2(m,1.0-m);
  vec2 b=a-o+K2; vec2 c=a-1.0+2.0*K2;
  vec3 h=max(0.5-vec3(dot(a,a),dot(b,b),dot(c,c)),0.0);
  vec3 n=h*h*h*h*vec3(dot(a,hash(i)),dot(b,hash(i+o)),dot(c,hash(i+1.0)));
  return dot(n,vec3(70.0));
}
void main(){
  float ar=uRes.x/uRes.y;
  vec2 p=vUv; p.x*=ar;
  vec2 m=uMouse; m.x*=ar;
  float d=distance(p,m);
  float t=uTime*0.07;
  vec2 q=p*1.3;
  q+=0.45*vec2(noise(q+t),noise(q-t+3.1));
  q+=0.06*exp(-d*3.0)*vec2(sin(d*24.0-uTime*2.5));
  float n1=noise(q*1.1+vec2(t,-t));
  float n2=noise(q*2.0-vec2(t*1.3,t*0.7)+5.0);
  float n3=noise(q*0.7+10.0+t);
  vec3 night=vec3(0.078,0.024,0.122);
  vec3 magenta=vec3(1.0,0.18,0.53), coral=vec3(1.0,0.48,0.35), sun=vec3(1.0,0.79,0.24), lilac=vec3(0.655,0.545,0.98), sky=vec3(0.37,0.78,1.0);
  vec3 col=mix(lilac,magenta,smoothstep(-0.5,0.6,n1));
  col=mix(col,coral,smoothstep(0.15,0.85,n2));
  col=mix(col,sky,smoothstep(0.3,0.95,n3)*0.8);
  col=mix(col,sun,smoothstep(0.5,1.0,n1*0.6+n2*0.6)*0.7);
  float glow=smoothstep(-0.35,0.85,noise(q*0.55-t*0.4));
  col=mix(night,col,glow*0.62*uIntensity);
  col+=0.05*sin(vec3(0.0,2.1,4.2)+n1*5.0+uTime*0.4)*uIntensity;
  col*=1.0-0.6*smoothstep(0.35,1.05,distance(vUv,vec2(0.5)));
  col+=0.18*exp(-d*5.0)*vec3(1.0,0.5,0.8)*uIntensity;
  gl_FragColor=vec4(col,1.0);
}`;

const P_VERT = /* glsl */`
attribute vec3 aColor; attribute float aSize; attribute float aShape; attribute float aRand;
uniform float uTime; uniform float uPixel; uniform float uScale;
varying vec3 vColor; varying float vShape; varying float vTw;
void main(){
  vec4 mv=modelViewMatrix*vec4(position,1.0);
  gl_Position=projectionMatrix*mv;
  float tw=0.6+0.4*sin(uTime*2.2+aRand*7.0);
  vTw=tw; vColor=aColor; vShape=aShape;
  gl_PointSize=aSize*uScale*uPixel*(10.0/-mv.z)*(0.75+0.25*tw);
}`;

const P_FRAG = /* glsl */`
uniform sampler2D uHeart; uniform float uAlpha;
varying vec3 vColor; varying float vShape; varying float vTw;
void main(){
  vec2 uv=gl_PointCoord; float a;
  if(vShape>0.5){ a=texture2D(uHeart,vec2(uv.x,1.0-uv.y)).a; }
  else { float d=length(uv-0.5); a=smoothstep(0.5,0.05,d); a*=a; }
  if(a<0.02) discard;
  gl_FragColor=vec4(vColor,a*uAlpha*(0.55+0.45*vTw));
}`;

function heartTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.beginPath();
  g.moveTo(32, 56);
  g.bezierCurveTo(6, 38, 4, 14, 20, 11);
  g.bezierCurveTo(27, 10, 31, 15, 32, 20);
  g.bezierCurveTo(33, 15, 37, 10, 44, 11);
  g.bezierCurveTo(60, 14, 58, 38, 32, 56);
  g.fill();
  return new THREE.CanvasTexture(c);
}

// Draw a shape on a 2D canvas and sample `n` points from its filled pixels.
// Returns points normalised so the shape's height is 1 (width = aspect).
const sampleCache = new Map();
function sampleShape(shape, n) {
  const key = shape + '|' + n;
  if (sampleCache.has(key)) return sampleCache.get(key);
  const W = 1400, H = 700;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (shape === 'heart') {
    const s = H * 0.9 / 92, ox = W / 2 - 50 * s, oy = H * 0.05;
    g.beginPath();
    const P = (x, y) => [ox + x * s, oy + y * s];
    g.moveTo(...P(50, 92));
    g.bezierCurveTo(...P(22, 72), ...P(0, 54), ...P(0, 28));
    g.bezierCurveTo(...P(0, 12), ...P(12, 0), ...P(27, 0));
    g.bezierCurveTo(...P(37, 0), ...P(45, 6), ...P(50, 14));
    g.bezierCurveTo(...P(55, 6), ...P(63, 0), ...P(73, 0));
    g.bezierCurveTo(...P(88, 0), ...P(100, 12), ...P(100, 28));
    g.bezierCurveTo(...P(100, 54), ...P(78, 72), ...P(50, 92));
    g.fill();
  } else {
    const lines = shape.split('\n');
    let size = H * 0.82 / lines.length;
    const font = s => `800 ${s}px Syne, system-ui, sans-serif`;
    g.font = font(size);
    const widest = Math.max(...lines.map(l => g.measureText(l).width));
    if (widest > W * 0.94) size *= W * 0.94 / widest;
    g.font = font(size);
    const lh = size * 1.0;
    lines.forEach((l, i) => g.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * lh));
  }
  const data = g.getImageData(0, 0, W, H).data;
  const pts = [];
  let minX = W, maxX = 0, minY = H, maxY = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    if (data[(y * W + x) * 4 + 3] > 128) {
      pts.push(x, y);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const total = pts.length / 2;
  const h = Math.max(1, maxY - minY), cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  // shuffle indices so a subset still covers the whole shape evenly
  const idx = new Uint32Array(total);
  for (let i = 0; i < total; i++) idx[i] = i;
  for (let i = total - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
  const out = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const k = idx[i % Math.max(1, total)] * 2;
    out[i * 2] = ((pts[k] ?? cx) - cx + (Math.random() - .5) * 2) / h;
    out[i * 2 + 1] = ((pts[k + 1] ?? cy) - cy + (Math.random() - .5) * 2) / h;
  }
  const res = { pts: out, w: (maxX - minX) / h, h: 1, lines: shape === 'heart' ? 1 : shape.split('\n').length };
  sampleCache.set(key, res);
  return res;
}

export function createUniverse(canvas, opts = {}) {
  const {
    count = 6000,
    shape = 'TIMMI',
    offsetY = -0.08,
    intensity = 1,
    alpha = 1,
    collapsed = false,
    textScale = 1,
  } = opts;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  if (!renderer.getContext()) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, count > 3000 ? 2 : 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x14061f, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 10;

  // ---- background shader
  const bgMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(.5, .5) }, uRes: { value: new THREE.Vector2(1, 1) }, uIntensity: { value: intensity } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.999,1.0); }',
    fragmentShader: BG_FRAG,
    depthWrite: false, depthTest: false,
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bg.frustumCulled = false; bg.renderOrder = -1;
  scene.add(bg);

  // ---- particles
  const pos = new Float32Array(count * 3), vel = new Float32Array(count * 3), tgt = new Float32Array(count * 3);
  const col = new Float32Array(count * 3), size = new Float32Array(count), shp = new Float32Array(count), rnd = new Float32Array(count);
  const tmp = new THREE.Color();
  for (let i = 0; i < count; i++) {
    tmp.set(PALETTE[(Math.random() * PALETTE.length) | 0]);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    shp[i] = Math.random() < .1 ? 1 : 0;
    size[i] = (Math.random() * 1.3 + .6) * (shp[i] ? 2.4 : 1);
    rnd[i] = Math.random() * Math.PI * 2;
    if (!collapsed) {
      pos[i * 3] = (Math.random() - .5) * 16;
      pos[i * 3 + 1] = (Math.random() - .5) * 10;
      pos[i * 3 + 2] = (Math.random() - .5) * 4;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aShape', new THREE.BufferAttribute(shp, 1));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  const pMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixel: { value: dpr }, uScale: { value: 3 }, uHeart: { value: heartTexture() }, uAlpha: { value: alpha } },
    vertexShader: P_VERT, fragmentShader: P_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, pMat);
  points.frustumCulled = false;
  scene.add(points);

  // ---- state
  const vis = { w: 1, h: 1 };
  const mouse = { x: 0, y: 0, active: false, u: .5, v: .5 };
  let current = collapsed ? null : shape;
  let running = false, raf = 0, visible = false;
  const clock = new THREE.Clock();

  function setTargets(name, kick) {
    if (!name) { tgt.fill(0); return; }
    if (name === 'stars') {
      for (let i = 0; i < count; i++) {
        tgt[i * 3] = (Math.random() - .5) * vis.w * 1.1;
        tgt[i * 3 + 1] = (Math.random() - .5) * vis.h * 1.1;
        tgt[i * 3 + 2] = (Math.random() - .5) * 6;
      }
    } else {
      const s = sampleShape(name, count);
      const maxW = vis.w * (vis.w < vis.h ? .9 : .78);
      const maxH = vis.h * (name === 'heart' ? .5 : s.lines > 1 ? .5 : .32);
      const scale = Math.min(maxW / s.w, maxH / s.h) * textScale;
      for (let i = 0; i < count; i++) {
        tgt[i * 3] = s.pts[i * 2] * scale;
        tgt[i * 3 + 1] = -s.pts[i * 2 + 1] * scale + offsetY * vis.h;
        tgt[i * 3 + 2] = (Math.random() - .5) * .5;
      }
    }
    if (kick) for (let i = 0; i < count * 3; i++) vel[i] += (Math.random() - .5) * .5;
  }

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    vis.h = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    vis.w = vis.h * camera.aspect;
    bgMat.uniforms.uRes.value.set(w, h);
    pMat.uniforms.uScale.value = Math.min(4.2, Math.max(2.1, h / 250));
    if (current) setTargets(current, false);
  }

  function onMove(e) {
    const r = canvas.getBoundingClientRect();
    const u = (e.clientX - r.left) / r.width, v = 1 - (e.clientY - r.top) / r.height;
    mouse.active = u >= 0 && u <= 1 && v >= 0 && v <= 1;
    mouse.u = u; mouse.v = v;
    mouse.x = (u - .5) * vis.w;
    mouse.y = (v - .5) * vis.h;
  }
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerleave', () => { mouse.active = false; });

  const R = 1.25, R2 = R * R;
  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime, f = dt * 60;
    bgMat.uniforms.uTime.value = t;
    pMat.uniforms.uTime.value = t;
    const bm = bgMat.uniforms.uMouse.value;
    bm.x += (mouse.u - bm.x) * .04 * f; bm.y += (mouse.v - bm.y) * .04 * f;

    const k = .028 * f, damp = Math.pow(.9, f);
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const px = pos[ix], py = pos[ix + 1], pz = pos[ix + 2];
      let ax = (tgt[ix] + Math.cos(t * .9 + rnd[i]) * .02 - px) * k;
      let ay = (tgt[ix + 1] + Math.sin(t * 1.3 + rnd[i]) * .03 - py) * k;
      const az = (tgt[ix + 2] - pz) * k;
      if (mouse.active) {
        const dx = px - mouse.x, dy = py - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) + 1e-4, force = (1 - d / R) * .35 * f;
          ax += dx / d * force; ay += dy / d * force;
        }
      }
      vel[ix] = (vel[ix] + ax) * damp;
      vel[ix + 1] = (vel[ix + 1] + ay) * damp;
      vel[ix + 2] = (vel[ix + 2] + az) * damp;
      pos[ix] = px + vel[ix] * f;
      pos[ix + 1] = py + vel[ix + 1] * f;
      pos[ix + 2] = pz + vel[ix + 2] * f;
    }
    geo.attributes.position.needsUpdate = true;
    points.rotation.y += ((mouse.u - .5) * .25 - points.rotation.y) * .03 * f;
    points.rotation.x += (-(mouse.v - .5) * .15 - points.rotation.x) * .03 * f;
    renderer.render(scene, camera);
  }

  function start() { if (running) return; running = true; clock.getDelta(); tick(); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  const sync = () => (visible && !document.hidden ? start() : stop());

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { rootMargin: '100px' }).observe(canvas);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('resize', resize);
  resize();
  if (current) setTargets(current, false);
  renderer.render(scene, camera);

  return {
    setShape(name, kick = true) { if (name === current) return; current = name; setTargets(name, kick); },
    burst(name = shape) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), s = .25 + Math.random() * .6;
        vel[i * 3] = Math.sin(b) * Math.cos(a) * s;
        vel[i * 3 + 1] = Math.sin(b) * Math.sin(a) * s;
        vel[i * 3 + 2] = Math.cos(b) * s * .5;
      }
      current = name;
      setTargets(name, false);
    },
    setAlpha(v) { pMat.uniforms.uAlpha.value = v; },
    uniforms: { bg: bgMat.uniforms, p: pMat.uniforms },
  };
}
