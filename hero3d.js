/* ============================================================
   HapiWelkin — Interactive 3D Hero Object (Three.js)
   A playful, brand-colored cluster that auto-rotates, can be
   dragged/flicked to spin, and is lit with an HDRI-style
   environment. Loaded as an ES module from a CDN (no build step).

   Graceful degradation:
   - If Three fails to load or WebGL is unsupported -> the existing
     hero illustration stays (we simply never add .is-3d).
   - Under prefers-reduced-motion -> no auto-spin/float; renders a
     static pose, still draggable (renders on demand).
   - Pauses when off-screen or the tab is hidden (battery friendly).
   ============================================================ */

import * as THREE from './assets/vendor/three.module.min.js';

(function initHero3D() {
  const mount = document.getElementById('hero3d');
  const visual = document.querySelector('.hero-visual');
  if (!mount || !visual) return;

  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Brand palette
  const ORANGE = 0x7fb4ff;  /* warm-fill light -> soft sky */
  const CORAL  = 0x8ec9a8;
  const PINK   = 0x6fd89b;  /* rim light -> soft green */
  const YELLOW = 0xffc93d;
  const CREAM  = 0xffffff;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return; // WebGL unavailable -> keep the 2D illustration
  }

  function size() {
    const r = mount.getBoundingClientRect();
    return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
  }
  let { w, h } = size();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.set(0, 0, 8.4);

  // ---- HDRI-style environment (procedural gradient -> PMREM) ----
  scene.environment = makeEnvironment(renderer);

  // ---- Boutique studio lighting: warm key + champagne fill + cool separation rim ----
  scene.add(new THREE.HemisphereLight(0xFFF6E9, 0x3A2E26, 0.50)); // warm cream sky / walnut ground
  const key = new THREE.DirectionalLight(0xFFF3E0, 1.9);          // soft gallery softbox key
  key.position.set(-3.5, 6.5, 4.5);
  scene.add(key);
  const champagne = new THREE.PointLight(0xFFD9A0, 28, 40, 2);    // warms the brass, front-right
  champagne.position.set(5, -1.5, 4);
  scene.add(champagne);
  const coolRim = new THREE.PointLight(0xBFD8FF, 18, 40, 2);      // cool edge so gold separates from cream
  coolRim.position.set(-5, 3, -4);
  scene.add(coolRim);

  // ---- Objects: floating "HW" letter blocks ----
  const group = new THREE.Group();
  scene.add(group);

  // Oswald is the brand display face; Arial Narrow is the safe fallback until the webfont loads.
  const GLYPH_FONT_PX = 0.62;
  function glyphFont(res) { return '700 ' + Math.round(res * GLYPH_FONT_PX) + 'px "Oswald","Arial Narrow","Arial",sans-serif'; }

  const _tex = (cv, srgb) => {
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  };

  // (A) Cream-marble face with a REAL polished-brass glyph -> 3 aligned maps.
  //     metalnessMap/roughnessMap make the letter a genuine metal inlay that
  //     catches env highlights from every angle; the marble stays dielectric.
  function marbleBrassMaps(glyph, res) {
    res = res || 512;
    const font = glyphFont(res), gx = res / 2, gy = res / 2 + res * 0.02;
    const mk = () => { const c = document.createElement('canvas'); c.width = c.height = res; return c; };

    // -- albedo: cream marble + mottling + veins + champagne-brass glyph --
    const ca = mk(), a = ca.getContext('2d');
    const bg = a.createLinearGradient(0, 0, 0, res); bg.addColorStop(0, '#FBF7EF'); bg.addColorStop(1, '#F0E7D6');
    a.fillStyle = bg; a.fillRect(0, 0, res, res);
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * res, y = Math.random() * res, r = res * (0.25 + Math.random() * 0.3);
      const rg = a.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, i % 2 ? 'rgba(245,241,232,0.40)' : 'rgba(226,214,190,0.35)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      a.fillStyle = rg; a.fillRect(0, 0, res, res);
    }
    const vein = (x0, y0, col, lw, steps) => {
      a.beginPath(); a.moveTo(x0, y0); let x = x0, y = y0, an = Math.random() * 6.28;
      for (let s = 0; s < steps; s++) { an += (Math.random() - 0.5) * 0.9; x += Math.cos(an) * (res / steps) * 1.3; y += Math.sin(an) * (res / steps) * 1.3; a.lineTo(x, y); }
      a.strokeStyle = col; a.lineWidth = lw; a.lineJoin = a.lineCap = 'round'; a.stroke();
    };
    vein(res * 0.15, -10, 'rgba(120,108,92,0.16)', res * 0.010, 14);
    vein(res * 0.62, -10, 'rgba(120,108,92,0.12)', res * 0.008, 16);
    vein(res * 0.30, -10, 'rgba(196,162,86,0.10)', res * 0.004, 18); // faint gold hairline vein
    a.strokeStyle = 'rgba(90,70,40,0.10)'; a.lineWidth = res * 0.045; a.strokeRect(res * 0.06, res * 0.06, res * 0.88, res * 0.88);
    if (glyph) {
      const grd = a.createLinearGradient(0, res * 0.28, 0, res * 0.72);
      grd.addColorStop(0, '#E7C87A'); grd.addColorStop(0.45, '#C79A45'); grd.addColorStop(1, '#9A7628');
      a.fillStyle = grd; a.font = font; a.textAlign = 'center'; a.textBaseline = 'middle';
      a.save(); a.shadowColor = 'rgba(60,40,10,0.35)'; a.shadowBlur = res * 0.02; a.shadowOffsetY = res * 0.006; a.fillText(glyph, gx, gy); a.restore();
    }
    // -- metalness: black marble (dielectric=0) / white glyph + frame (metal=1) --
    const cm = mk(), m = cm.getContext('2d'); m.fillStyle = '#000'; m.fillRect(0, 0, res, res);
    m.strokeStyle = '#fff'; m.lineWidth = res * 0.045; m.strokeRect(res * 0.06, res * 0.06, res * 0.88, res * 0.88);
    if (glyph) { m.fillStyle = '#fff'; m.font = font; m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillText(glyph, gx, gy); }
    // -- roughness: marble ~0.56 / polished brass ~0.25 --
    const cr = mk(), rr = cr.getContext('2d'); rr.fillStyle = '#8f8f8f'; rr.fillRect(0, 0, res, res);
    if (glyph) { rr.fillStyle = '#3f3f3f'; rr.font = font; rr.textAlign = 'center'; rr.textBaseline = 'middle'; rr.fillText(glyph, gx, gy); }

    return { map: _tex(ca, true), metalnessMap: _tex(cm, false), roughnessMap: _tex(cr, false) };
  }
  function marbleMaterial(glyph, res) {
    const p = marbleBrassMaps(glyph, res);
    return new THREE.MeshPhysicalMaterial({
      map: p.map, metalnessMap: p.metalnessMap, roughnessMap: p.roughnessMap,
      metalness: 1.0, roughness: 1.0,            // scalars MUST be 1.0 — they multiply the maps
      clearcoat: 0.45, clearcoatRoughness: 0.28, ior: 1.5, envMapIntensity: 1.15
    });
  }

  // (B) Solid polished-brass charm for the ★/♥ accents (symbol font fallback)
  function brassAccentMaps(glyph, res) {
    res = res || 256;
    const font = '800 ' + Math.round(res * 0.60) + 'px "Segoe UI Symbol","Arial",sans-serif', gx = res / 2, gy = res / 2 + res * 0.02;
    const c = document.createElement('canvas'); c.width = c.height = res; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, res); g.addColorStop(0, '#EBD08A'); g.addColorStop(0.5, '#C99A44'); g.addColorStop(1, '#8F6E24');
    x.fillStyle = g; x.fillRect(0, 0, res, res);
    if (glyph) { x.fillStyle = 'rgba(90,66,20,0.55)'; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(glyph, gx, gy); }
    const cr = document.createElement('canvas'); cr.width = cr.height = res; const rr = cr.getContext('2d'); rr.fillStyle = '#383838'; rr.fillRect(0, 0, res, res);
    if (glyph) { rr.fillStyle = '#6b6b6b'; rr.font = font; rr.textAlign = 'center'; rr.textBaseline = 'middle'; rr.fillText(glyph, gx, gy); }
    return { map: _tex(c, true), roughnessMap: _tex(cr, false) };
  }
  function brassMaterial(glyph, res) {
    const p = brassAccentMaps(glyph, res);
    return new THREE.MeshPhysicalMaterial({
      map: p.map, roughnessMap: p.roughnessMap, color: 0xffffff,
      metalness: 1.0, roughness: 1.0, clearcoat: 0.30, clearcoatRoughness: 0.20, envMapIntensity: 1.25
    });
  }

  const blocks = [];
  function addBlock(size, glyph, kind, base, tilt, tiltZ, phase, bob, bobSpeed) {
    const res = size >= 1.5 ? 512 : 256;
    const mat = kind === 'brass' ? brassMaterial(glyph, res) : marbleMaterial(glyph, res);
    const m = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat);
    m.userData = { base: new THREE.Vector3(base[0], base[1], base[2]), tilt: tilt, tiltZ: tiltZ, phase: phase, bob: bob, bobSpeed: bobSpeed, glyph: glyph, kind: kind, res: res };
    group.add(m);
    blocks.push(m);
    return m;
  }

  // Two marble+brass hero blocks + two solid-brass charms (slow, weighty float)
  addBlock(1.9, 'H', 'marble', [-1.15,  0.35,  0.00],  0.18,  0.05, 0.0, 0.20, 0.72);
  addBlock(1.9, 'W', 'marble', [ 1.15, -0.35,  0.15], -0.18, -0.05, 1.4, 0.20, 0.66);
  addBlock(0.8, '★', 'brass',  [ 1.95,  1.35, -0.40],  0.30,  0.20, 2.2, 0.28, 0.90);
  addBlock(0.8, '♥', 'brass',  [-1.95, -1.20,  0.50], -0.30, -0.15, 3.0, 0.28, 0.84);

  // Canvas can't measure Oswald until the webfont loads — rebuild the letter blocks once it's ready.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      blocks.forEach((b) => {
        if (b.userData.kind !== 'marble') return;
        const p = marbleBrassMaps(b.userData.glyph, b.userData.res);
        const mt = b.material; mt.map = p.map; mt.metalnessMap = p.metalnessMap; mt.roughnessMap = p.roughnessMap; mt.needsUpdate = true;
      });
      renderOnce();
    });
  }

  // ---- Interaction: drag to spin (+ inertia) ----
  let dragging = false, lastX = 0, lastY = 0;
  let velX = 0, velY = 0;                // inertia
  let rotX = 0, rotY = 0;                // accumulated manual rotation offset

  mount.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    velX = velY = 0;
    mount.setPointerCapture && mount.setPointerCapture(e.pointerId);
    wake();
  });
  mount.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    rotY += dx * 0.01;
    rotX += dy * 0.01;
    rotX = Math.max(-0.9, Math.min(0.9, rotX));
    velX = dx * 0.01;
    velY = dy * 0.01;
    if (reduceMQ.matches) renderOnce();  // reduced motion: render on demand
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    mount.releasePointerCapture && e && e.pointerId != null && mount.releasePointerCapture(e.pointerId);
  }
  mount.addEventListener('pointerup', endDrag);
  mount.addEventListener('pointercancel', endDrag);
  mount.addEventListener('pointerleave', endDrag);

  // ---- Render / animate ----
  const clock = new THREE.Clock();
  let rafId = null, running = false, visible = true;

  function frame(t) {
    const dt = clock.getDelta();
    const reduce = reduceMQ.matches;

    const time = clock.elapsedTime;
    if (!reduce) {
      // inertia after a flick (drag adds to rotX/rotY directly in pointermove)
      if (!dragging && (Math.abs(velX) > 0.0001 || Math.abs(velY) > 0.0001)) {
        rotY += velX; rotX += velY;
        velX *= 0.95; velY *= 0.95;   // weightier, longer settle
      }
      rotX = Math.max(-0.9, Math.min(0.9, rotX));
      // each block bobs up/down and gently rocks (letters stay readable) — slowed for elegance
      blocks.forEach((b) => {
        const u = b.userData;
        b.position.set(u.base.x, u.base.y + Math.sin(time * u.bobSpeed + u.phase) * u.bob, u.base.z);
        b.rotation.set(
          Math.sin(time * 0.28 + u.phase) * 0.10,
          u.tilt + Math.sin(time * 0.34 + u.phase) * 0.14,
          u.tiltZ
        );
      });
      // whole group sways slowly around the user's drag offset
      group.rotation.y = rotY + Math.sin(time * 0.22) * 0.30;
      group.rotation.x = rotX + Math.sin(time * 0.32) * 0.05;
    } else {
      // reduced motion: hold a still, pleasant pose
      blocks.forEach((b) => {
        const u = b.userData;
        b.position.copy(u.base);
        b.rotation.set(0, u.tilt, u.tiltZ);
      });
      group.rotation.y = rotY;
      group.rotation.x = rotX;
    }

    renderer.render(scene, camera);

    if (running && !reduce && visible) rafId = requestAnimationFrame(frame);
    else running = false;
  }

  function wake() {
    if (reduceMQ.matches) { renderOnce(); return; }
    if (!running && visible) { running = true; clock.getDelta(); rafId = requestAnimationFrame(frame); }
  }
  function sleep() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }
  function renderOnce() { renderer.render(scene, camera); }

  // Position blocks initially so a first static frame looks right
  blocks.forEach((b) => {
    const u = b.userData;
    b.position.copy(u.base);
    b.rotation.set(0, u.tilt, u.tiltZ);
  });

  // ---- Resize ----
  function onResize() {
    const s = size();
    w = s.w; h = s.h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderOnce();
  }
  if (window.ResizeObserver) {
    new ResizeObserver(onResize).observe(mount);
  } else {
    window.addEventListener('resize', onResize);
  }

  // ---- Pause when off-screen / tab hidden ----
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        visible = en.isIntersecting;
        if (visible) wake(); else sleep();
      });
    }, { threshold: 0.05 }).observe(mount);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) sleep(); else wake();
  });

  // React to a live reduced-motion toggle
  const onReduce = () => { if (reduceMQ.matches) { sleep(); renderOnce(); } else { wake(); } };
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onReduce);
  else if (reduceMQ.addListener) reduceMQ.addListener(onReduce);

  // ---- Go live: reveal the 3D scene, hide the fallback illustration ----
  visual.classList.add('is-3d');
  onResize();
  wake();
  if (reduceMQ.matches) renderOnce();

  // ---- Procedural HDRI-style environment ----
  function makeEnvironment(rnd) {
    const pmrem = new THREE.PMREMGenerator(rnd);
    const c = document.createElement('canvas');
    c.width = 32; c.height = 128;
    const ctx = c.getContext('2d');
    c.width = 64; c.height = 256;   // higher res -> cleaner softbox reflections after PMREM
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.00, '#FFFDF6');   // warm softbox ceiling
    g.addColorStop(0.34, '#F7E7C8');   // champagne
    g.addColorStop(0.60, '#EAD3A7');   // warm sand
    g.addColorStop(0.82, '#8A6E48');   // brass-tinted wall
    g.addColorStop(1.00, '#3C2E1F');   // near-espresso floor — dark anchor for jewel contrast
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 256);
    // crisp softbox blooms = the clean gold specular streaks
    ctx.globalAlpha = 0.92; ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.ellipse(20, 46, 12, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.72; ctx.fillStyle = '#FFF6E2';
    ctx.beginPath(); ctx.ellipse(46, 96, 9, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#E7B678';
    ctx.beginPath(); ctx.ellipse(32, 196, 16, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const env = pmrem.fromEquirectangular(tex).texture;
    tex.dispose();
    pmrem.dispose();
    return env;
  }
})();
