// The room illustrates a pickup. All retrieval values are supplied by checkout.js from recorded queries.
import * as THREE from './three-r180/three.module.min.js';
import { stageShoppers, pickupDuration, captureAt, lensPosition } from './shoppers.js?v=2';

const views = {
  aisle: [
    [0.15, 1.65, 4.05],
    [0, 1.46, -2.55],
  ],
  beans: [
    [-0.72, 1.61, -0.57],
    [-1.14, 1.48, -2.51],
  ],
  ranch: [
    [0.73, 1.61, -0.57],
    [1.14, 1.48, -2.51],
  ],
  camera: [lensPosition, [0.02, 1.23, -2.52]],
};

function printed(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  paint(ctx, width, height);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}

function signTexture(text, background = '#ede8da', color = '#292f2c') {
  return printed(896, 160, (ctx, w, h) => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.font = '500 73px "OpenAI Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2, w - 30);
  });
}

const packaging = {
  box: ['#fbf5d8', '#48693e', '365', 'Garbanzo', 'Beans'],
  can: ['#f5edcb', '#926028', '365', 'Garbanzo', 'Beans'],
  ranch: ['#f9f5e7', '#246b48', 'Hidden Valley', 'Original', 'Ranch'],
  ketchup: ['#e6b7a1', '#aa4d37', 'PANTRY', 'Tomato', 'Sauce'],
  oats: ['#d3c6a6', '#51493c', 'GRAINS', 'Rolled', 'Oats'],
  rice: ['#f2e9ca', '#9b753d', 'PANTRY', 'Brown', 'Rice'],
  tea: ['#d9e6dc', '#416052', 'GARDEN', 'Green', 'Tea'],
  pasta: ['#e6d5ad', '#a44d32', 'PANTRY', 'Penne', 'Pasta'],
  milk: ['#e4edec', '#598095', 'DAIRY', 'Fresh', 'Milk'],
};

function packageTexture(kind) {
  const [paper, ink, brand, title, variant] = packaging[kind];
  return printed(256, 336, (ctx, w, h) => {
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = ink;
    ctx.fillRect(0, 0, w, 15);
    ctx.fillRect(0, h - 41, w, 41);
    ctx.textAlign = 'center';
    if (brand === '365') {
      ctx.fillStyle = '#292d29';
      ctx.fillRect(83, 26, 90, 56);
      ctx.fillStyle = '#fff';
      ctx.font = '600 43px "OpenAI Sans", sans-serif';
      ctx.fillText(brand, 128, 70);
    } else {
      ctx.fillStyle = ink;
      ctx.font = '600 29px "OpenAI Sans", sans-serif';
      ctx.fillText(brand, 128, 65, 224);
    }
    ctx.fillStyle = ink;
    ctx.font = '600 49px Georgia, serif';
    ctx.fillText(title, 128, 143, 234);
    ctx.fillText(variant, 128, 193, 224);
    for (const [x, y, a] of [
      [95, 248, -0.5],
      [133, 239, 0.22],
      [161, 259, -0.34],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 16, 10, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fffdf3';
    ctx.font = '500 18px "OpenAI Sans", sans-serif';
    ctx.fillText(
      kind === 'ranch' ? 'DRESSING' : kind === 'box' || kind === 'can' ? 'ORGANIC' : brand,
      128,
      321,
    );
  });
}

export function buildRoom(scene) {
  const surface = (color, extras = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extras });
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 22);
  const flat = new THREE.PlaneGeometry(1, 1);
  const cream = surface('#eeece4'),
    white = surface('#f5f2e9'),
    metal = surface('#757c78');
  const wood = surface('#b18a60'),
    edge = surface('#d4b998'),
    charcoal = surface('#343b38');
  const glass = surface('#a2b6b6', { roughness: 0.32 }),
    brass = surface('#a7a093');
  const capGreen = surface('#2c784c'),
    capBlue = surface('#376997'),
    milk = surface('#eeeadd');
  const labels = {},
    bodies = {};
  for (const [kind, colors] of Object.entries(packaging)) {
    labels[kind] = surface('#ffffff', { map: packageTexture(kind) });
    bodies[kind] = surface(colors[0]);
  }
  const fixed = new THREE.Group();
  const moving = new THREE.Group();
  scene.add(fixed, moving);
  function mesh(geometry, material, x, y, z, sx, sy, sz, parent = fixed) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function box(x, y, z, w, h, d, mat, parent) {
    return mesh(cube, mat, x, y, z, w, h, d, parent);
  }
  function tube(x, y, z, r, h, mat, parent) {
    return mesh(cylinder, mat, x, y, z, r, h, r, parent);
  }
  function face(x, y, z, w, h, mat, parent) {
    return mesh(flat, mat, x, y, z, w, h, 1, parent);
  }
  function sign(text, x, y, z, w, h, bg, fg) {
    return face(x, y, z, w, h, surface('#ffffff', { map: signTexture(text, bg, fg) }));
  }
  const bottle = new THREE.LatheGeometry(
    [
      [0.001, 0],
      [0.102, 0],
      [0.117, 0.035],
      [0.124, 0.12],
      [0.102, 0.23],
      [0.115, 0.32],
      [0.114, 0.37],
      [0.083, 0.42],
      [0.05, 0.455],
      [0.047, 0.48],
      [0.003, 0.48],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    24,
  );
  function product(kind, x, y, z, parent = fixed, blueCap = false) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.setScalar(0.66);
    parent.add(group);
    if (kind === 'ranch') {
      mesh(bottle, milk, 0, 0, 0, 1, 1, 0.78, group);
      tube(0, 0.491, 0, 0.054, 0.058, blueCap ? capBlue : capGreen, group);
      face(0, 0.235, 0.098, 0.181, 0.227, labels.ranch, group);
    } else if (kind === 'can' || kind === 'ketchup') {
      tube(0, 0.171, 0, 0.117, 0.326, bodies[kind], group);
      tube(0, 0.337, 0, 0.12, 0.012, brass, group);
      tube(0, 0.012, 0, 0.12, 0.014, brass, group);
      face(0, 0.167, 0.117, 0.178, 0.272, labels[kind], group);
    } else {
      const height = kind === 'box' ? 0.455 : 0.37;
      box(0, height / 2, 0, 0.249, height, 0.161, bodies[kind], group);
      face(0, height / 2, 0.081, 0.249, height, labels[kind], group);
    }
    return group;
  }
  const floor = surface('#d6d1c4', {
    map: printed(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#e7e2d7';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e0dcd2';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillRect(256, 256, 256, 256);
      ctx.strokeStyle = '#c1bdb3';
      ctx.lineWidth = 2;
      for (const n of [0, 256, 512]) {
        ctx.beginPath();
        ctx.moveTo(n, 0);
        ctx.lineTo(n, h);
        ctx.moveTo(0, n);
        ctx.lineTo(w, n);
        ctx.stroke();
      }
    }),
  });
  floor.map.wrapS = floor.map.wrapT = THREE.RepeatWrapping;
  floor.map.repeat.set(9, 8);
  box(0, -0.05, 1, 12, 0.1, 11, floor);
  box(0, 2.05, -3.67, 12, 4.1, 0.12, cream);
  box(-5.35, 2.05, 1, 0.12, 4.1, 9.4, cream);
  box(5.35, 2.05, 1, 0.12, 4.1, 9.4, cream);
  box(0, 3.89, 1, 10.8, 0.11, 9.4, white);
  for (const x of [-3.35, 0, 3.35]) {
    for (const z of [-1.0, 2.4]) {
      box(x, 3.76, z, 0.24, 0.095, 2.3, metal);
      box(
        x,
        3.7,
        z,
        0.205,
        0.03,
        2.24,
        surface('#ffffff', { emissive: '#ece8d9', emissiveIntensity: 0.6 }),
      );
    }
  }
  const heroes = {};
  const stock = [];
  const shelves = [0.28, 0.79, 1.3, 1.91];
  const bayPositions = [-3.42, -1.14, 1.14, 3.42];
  const sections = ['Grains', 'Pantry', 'Dressings', 'Drinks'];
  bayPositions.forEach((x, bay) => {
    box(x, 1.28, -3.19, 2.22, 2.55, 0.09, white);
    for (const post of [-1.1, 1.1]) box(x + post, 1.24, -2.98, 0.044, 2.48, 0.05, metal);
    for (const y of shelves) {
      box(x, y, -2.85, 2.27, 0.06, 0.68, cream);
      box(x, y - 0.005, -2.496, 2.27, 0.07, 0.037, edge);
    }
    box(x, 0.135, -2.87, 2.22, 0.24, 0.62, wood);
    box(x, 2.59, -3.12, 2.22, 0.34, 0.08, edge);
    sign(sections[bay], x, 2.59, -3.073, 2.09, 0.3, '#eee8d9', '#28332d');
    for (let level = 0; level < shelves.length; level++) {
      for (let col = 0; col < 11; col++) {
        const offset = col - 5;
        const sx = x + offset * 0.198,
          sy = shelves[level] + 0.032;
        const hero = level === 2 && offset === 0 && (bay === 1 || bay === 2);
        let kind;
        if (bay === 1 && level === 2) kind = Math.abs(offset) % 2 ? 'can' : 'box';
        else if (bay === 2 && level === 2) kind = 'ranch';
        else
          kind = [
            ['oats', 'rice', 'tea'],
            ['pasta', 'can', 'box'],
            ['ketchup', 'tea', 'ranch'],
            ['milk', 'tea', 'rice'],
          ][bay][(level + Math.floor(col / 3)) % 3];
        const blueCap = kind === 'ranch' && Math.abs(offset) % 2 === 1;
        const key =
          bay === 1 && level === 2 && kind === 'box'
            ? 'beans'
            : bay === 2 && level === 2 && kind === 'ranch' && !blueCap
              ? 'ranch'
              : null;
        const g = product(kind, sx, sy, -2.64, key ? moving : fixed, blueCap);
        if (key) {
          g.userData.pick = key;
          g.userData.shelfPosition = g.position.clone();
          stock.push(g);
          if (hero) heroes[key] = g;
        }
        if (level > 0 && col % 2 === 0) product(kind, sx + 0.026, sy, -2.97);
      }
    }
    sign(
      ['Brown rice', 'Garbanzo beans', 'Original ranch', 'Oat milk'][bay],
      x,
      1.288,
      -2.472,
      0.87,
      0.063,
      '#fffdf5',
      '#34332e',
    );
  });
  // Side fixtures frame the aisle at eye level.
  for (const side of [-1, 1]) {
    const x = side * 3.66;
    for (const z of [0.14, 1.78]) {
      box(x, 0.72, z, 0.75, 1.42, 1.59, cream);
      for (const y of [0.28, 0.75, 1.22]) {
        box(x - side * 0.32, y, z, 0.48, 0.06, 1.65, wood);
        for (let i = 0; i < 4; i++) {
          const g = product(
            side < 0 ? 'tea' : 'pasta',
            x - side * 0.39,
            y + 0.035,
            z + (i - 1.5) * 0.34,
          );
          g.rotation.y = (-side * Math.PI) / 2;
        }
      }
    }
  }
  // Ceiling-mounted shelf camera and the checkout counter.
  const direction = new THREE.Vector3(-0.52, -0.44, -0.73).normalize();
  const mount = new THREE.Vector3(...lensPosition).addScaledVector(direction, -0.2);
  tube(mount.x, 3.55, mount.z, 0.025, 0.52, metal);
  const cameraBody = box(mount.x, mount.y, mount.z, 0.24, 0.15, 0.35, white);
  cameraBody.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
  const lens = tube(0, 0, 0, 0.06, 0.08, charcoal);
  lens.position.copy(cameraBody.position).addScaledVector(direction, 0.2);
  lens.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  box(4.45, 0.48, 3.16, 1.2, 0.96, 1.48, wood);
  box(4.45, 1, 3.16, 1.3, 0.1, 1.55, white);
  box(4.42, 1.24, 3.04, 0.055, 0.42, 0.055, metal);
  box(4.42, 1.43, 3.04, 0.52, 0.3, 0.055, charcoal);
  for (const side of [-1, 1]) {
    for (const z of [0.2, 2.1]) {
      const pane = box(side * 5.23, 2.28, z, 0.07, 1.72, 1.65, glass);
      for (const dz of [-0.83, 0, 0.83])
        box(pane.position.x - side * 0.055, 2.28, z + dz, 0.04, 1.76, 0.035, white);
    }
  }
  // Repeated packages and shelf parts share draw calls. The two pickable items stay independent.
  fixed.updateMatrixWorld(true);
  const batches = new Map();
  fixed.traverse((child) => {
    if (!child.isMesh) return;
    const key = child.geometry.uuid + child.material.uuid;
    if (!batches.has(key))
      batches.set(key, { geometry: child.geometry, material: child.material, matrices: [] });
    batches.get(key).matrices.push(child.matrixWorld.clone());
  });
  scene.remove(fixed);
  for (const { geometry, material, matrices } of batches.values()) {
    const batch = new THREE.InstancedMesh(geometry, material, matrices.length);
    matrices.forEach((matrix, i) => batch.setMatrixAt(i, matrix));
    batch.castShadow = material !== floor;
    batch.receiveShadow = true;
    scene.add(batch);
  }
  return { heroes, stock };
}

export function lightRoom(scene) {
  scene.add(new THREE.HemisphereLight(0xfffcf0, 0xd1d4cf, 2.35));
  const sun = new THREE.DirectionalLight(0xfff2da, 2.1);
  sun.position.set(-2.5, 5.8, 3.2);
  sun.target.position.set(0, 0.8, -2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 4, bottom: -4, near: 0.1, far: 14 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.018;
  scene.add(sun, sun.target);
}

export function openStore({ onPick, onUnavailable }) {
  const canvas = document.getElementById('store-canvas');
  const room = document.getElementById('store-view');
  const nav = document.getElementById('store-nav');
  const guide = document.getElementById('store-guide');
  const picks = document.getElementById('shelf-picks');
  const controls = document.getElementById('store-keys');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xeae7df);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(47, 1, 0.07, 30);
  camera.rotation.order = 'YXZ';
  lightRoom(scene);
  const { heroes, stock } = buildRoom(scene);
  const shoppers = stageShoppers(scene, heroes);
  const monitor = document.getElementById('camera-preview');
  const photo = monitor.querySelector('canvas');
  const cameraLabel = monitor.querySelector('span');
  const photoContext = photo.getContext('2d');
  const shelfCamera = new THREE.PerspectiveCamera(46, photo.width / photo.height, 0.04, 30);
  let photoGeneration = 0;
  function showPhoto(expanded) {
    monitor.setAttribute('aria-expanded', String(expanded));
    monitor.setAttribute(
      'aria-label',
      (expanded ? 'Reduce' : 'Enlarge') +
        ' the shelf camera photo' +
        (monitor.dataset.product ? ' of ' + monitor.dataset.product : ''),
    );
  }
  monitor.addEventListener('click', () => showPhoto(monitor.getAttribute('aria-expanded') !== 'true'));
  monitor.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') showPhoto(false);
  });
  function filmPickup(item, zoom) {
    shoppers.cameraView(shelfCamera, item, zoom);
    const ratio = renderer.getPixelRatio();
    const w = Math.min(canvas.width, canvas.height * shelfCamera.aspect, photo.width);
    const h = w / shelfCamera.aspect;
    renderer.setViewport(0, 0, w / ratio, h / ratio);
    renderer.setScissor(0, 0, w / ratio, h / ratio);
    renderer.setScissorTest(true);
    renderer.render(scene, shelfCamera);
    photoContext.drawImage(canvas, 0, canvas.height - h, w, h, 0, 0, photo.width, photo.height);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, canvas.width / ratio, canvas.height / ratio);
    monitor.hidden = false;
  }
  function captureHeldItem() {
    shoppers.pickup(lift.key, lift.item, captureAt);
    filmPickup(lift.item, 1);
    monitor.dataset.state = 'captured';
    cameraLabel.textContent = 'Pickup photo';
    lift.captured = true;
    lift.save?.(photo.toDataURL('image/jpeg', 0.9));
  }
  function finishPickup() {
    if (!lift) return;
    if (!lift.captured && !lost) captureHeldItem();
    shoppers.reset(lift.key, lift.item);
    lift = null;
  }
  const heroParts = stock.flatMap((g) => g.children);
  const origins = Object.fromEntries(
    Object.entries(heroes).map(([key, g]) => [key, g.position.clone()]),
  );
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const keys = new Set();
  const keyButtons = [...controls.querySelectorAll('[data-key]')];
  const aliases = { arrowup: 'w', arrowdown: 's', arrowleft: 'a', arrowright: 'd' };
  const movementKeys = keyButtons.map((b) => b.dataset.key);
  function releaseKeys() {
    keys.clear();
    keyButtons.forEach((b) => b.classList.remove('is-down'));
  }
  function press(key, down) {
    if (down) {
      manual();
      keys.add(key);
      request();
    } else keys.delete(key);
    keyButtons.find((b) => b.dataset.key === key)?.classList.toggle('is-down', down);
  }
  const startPosition = new THREE.Vector3(),
    endPosition = new THREE.Vector3();
  const startRotation = new THREE.Quaternion(),
    endRotation = new THREE.Quaternion();
  const reference = new THREE.PerspectiveCamera();
  reference.rotation.order = 'YXZ';
  const walk = new THREE.Vector3(),
    look = new THREE.Vector3(),
    anchor = new THREE.Vector3();
  let motion = null,
    lift = null,
    frame = 0,
    visible = true,
    lost = false,
    drag = null,
    lastTime = 0,
    chosen = 'aisle';
  const buttons = Array.from(picks.querySelectorAll('[data-pick]'));
  function request() {
    if (!frame && visible && !lost) frame = requestAnimationFrame(draw);
  }
  function moveTo(key, instant = false) {
    chosen = key;
    releaseKeys();
    const [position, target] = views[key];
    startPosition.copy(camera.position);
    startRotation.copy(camera.quaternion);
    endPosition.fromArray(position);
    reference.position.copy(endPosition);
    reference.lookAt(...target);
    endRotation.copy(reference.quaternion);
    motion = null;
    if (instant || reduced.matches) {
      camera.position.copy(endPosition);
      camera.quaternion.copy(endRotation);
    } else motion = performance.now();
    nav
      .querySelectorAll('[data-view]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === key)));
    request();
  }
  function manual() {
    motion = null;
    chosen = '';
    nav.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  }
  function moveCamera(pressed, dt) {
    camera.rotation.y += ((pressed.has('q') ? 1 : 0) - (pressed.has('e') ? 1 : 0)) * dt * 1.52;
    camera.getWorldDirection(look);
    look.y = 0;
    look.normalize();
    walk.set(0, 0, 0);
    if (pressed.has('w')) walk.add(look);
    if (pressed.has('s')) walk.sub(look);
    const side = anchor.set(-look.z, 0, look.x);
    if (pressed.has('a')) walk.sub(side);
    if (pressed.has('d')) walk.add(side);
    camera.position.addScaledVector(walk.normalize(), dt * 1.75);
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -2.65, 2.65);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -1.55, 4.9);
  }
  function draw(time) {
    frame = 0;
    const dt = Math.max(0, Math.min(0.04, (time - lastTime) / 1000));
    lastTime = time;
    if (motion !== null) {
      const t = Math.min(1, (time - motion) / 660),
        f = t * t * (3 - 2 * t);
      camera.position.lerpVectors(startPosition, endPosition, f);
      camera.quaternion.slerpQuaternions(startRotation, endRotation, f);
      if (t >= 1) motion = null;
    }
    if (keys.size) moveCamera(keys, dt);
    if (lift) {
      const t = reduced.matches
        ? 1
        : THREE.MathUtils.clamp((time - lift.start) / (1000 * pickupDuration), 0, 1);
      // Always photograph the held pose, including when a tab misses animation frames.
      if (t >= captureAt && !lift.captured) captureHeldItem();
      shoppers.pickup(lift.key, lift.item, t);
      const approach = t / captureAt;
      if (approach >= 0.32 && !lift.captured) filmPickup(lift.item, (approach - 0.32) / 0.6);
      if (t === 1) {
        finishPickup();
      }
    }
    camera.updateMatrixWorld();
    for (const button of buttons) {
      const key = button.dataset.pick;
      anchor.copy(origins[key]);
      anchor.y -= 0.06;
      anchor.z += 0.2;
      anchor.project(camera);
      const inView =
        anchor.z > -1 && anchor.z < 1 && Math.abs(anchor.x) < 0.89 && Math.abs(anchor.y) < 0.88;
      button.hidden = !inView;
      if (inView) {
        button.style.left = (anchor.x + 1) * 50 + '%';
        button.style.top = (1 - anchor.y) * 50 + '%';
      }
    }
    renderer.render(scene, camera);
    if (motion !== null || lift || keys.size) request();
  }
  function resize() {
    const { width, height } = room.getBoundingClientRect();
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    request();
  }
  function rayHit(e) {
    const r = canvas.getBoundingClientRect();
    mouse.set((2 * (e.clientX - r.left)) / r.width - 1, 1 - (2 * (e.clientY - r.top)) / r.height);
    ray.setFromCamera(mouse, camera);
    return ray.intersectObjects(heroParts, false)[0]?.object.parent;
  }
  function clearPhoto() {
    photoGeneration++;
    if (lift) {
      finishPickup();
      request();
    }
    monitor.hidden = true;
    delete monitor.dataset.state;
    delete monitor.dataset.product;
    showPhoto(false);
  }
  function identifyPhoto(key) {
    monitor.dataset.product =
      key === 'beans' ? 'the boxed garbanzo beans' : 'the green-cap ranch dressing';
    showPhoto(false);
  }
  function restorePhoto(data, key) {
    clearPhoto();
    if (!data || lost) return;
    const generation = photoGeneration;
    const image = new Image();
    image.onload = () => {
      if (generation !== photoGeneration || lost) return;
      photoContext.drawImage(image, 0, 0);
      identifyPhoto(key);
      cameraLabel.textContent = 'Pickup photo';
      monitor.dataset.state = 'captured';
      monitor.hidden = false;
    };
    image.src = data;
  }
  function animatePickup(key, item = heroes[key], save) {
    clearPhoto();
    if (lost) return;
    lift = { key, item, save, captured: false, start: performance.now() };
    identifyPhoto(key);
    cameraLabel.textContent = 'Shelf camera';
    monitor.dataset.state = 'live';
    if (!visible || reduced.matches) finishPickup();
    request();
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    canvas.focus({ preventScroll: true });
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      yaw: camera.rotation.y,
      pitch: camera.rotation.x,
      moved: false,
    };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) {
      canvas.style.cursor = rayHit(e) ? 'pointer' : 'grab';
      return;
    }
    if (drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 5) drag.moved = true;
    if (!drag.moved) return;
    manual();
    canvas.style.cursor = 'grabbing';
    camera.rotation.y = drag.yaw - dx * 0.0045;
    camera.rotation.x = THREE.MathUtils.clamp(drag.pitch - dy * 0.004, -1.07, 0.76);
    request();
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const item = !drag.moved && rayHit(e);
    drag = null;
    canvas.style.cursor = 'grab';
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (item) onPick(item.userData.pick, item);
  });
  canvas.addEventListener('pointercancel', () => {
    drag = null;
  });
  function onKey(e) {
    const raw = e.key.toLowerCase();
    const key = aliases[raw] || raw;
    if (key === 'escape') {
      moveTo('aisle');
      return;
    }
    if (!movementKeys.includes(key) || e.ctrlKey || e.altKey || e.metaKey) return;
    e.preventDefault();
    press(key, e.type === 'keydown');
  }
  for (const el of [canvas, controls]) {
    el.addEventListener('keydown', onKey);
    el.addEventListener('keyup', onKey);
    el.addEventListener('focusout', releaseKeys);
  }
  keyButtons.forEach((b) => {
    const key = b.dataset.key;
    let began = 0;
    b.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      began = performance.now();
      b.setPointerCapture(e.pointerId);
      press(key, true);
    });
    b.addEventListener('pointerup', () => {
      const extra = Math.max(0, 0.12 - (performance.now() - began) / 1000);
      moveCamera(new Set([key]), extra);
      press(key, false);
      request();
    });
    b.addEventListener('lostpointercapture', () => press(key, false));
    b.addEventListener('click', (e) => {
      if (e.detail === 0) {
        manual();
        moveCamera(new Set([key]), 0.14);
        request();
      }
    });
  });
  window.addEventListener('blur', releaseKeys);
  buttons.forEach((b) => b.addEventListener('click', () => onPick(b.dataset.pick)));
  nav
    .querySelectorAll('[data-view]')
    .forEach((b) => b.addEventListener('click', () => moveTo(b.dataset.view)));
  function fallback() {
    lost = true;
    clearPhoto();
    releaseKeys();
    cancelAnimationFrame(frame);
    frame = 0;
    canvas.hidden = true;
    nav.hidden = true;
    picks.hidden = true;
    controls.hidden = true;
    document.getElementById('store-poster').hidden = false;
    onUnavailable();
  }
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    fallback();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    canvas.hidden = false;
    nav.hidden = false;
    picks.hidden = false;
    controls.hidden = false;
    document.getElementById('store-poster').hidden = true;
    guide.textContent = help;
    resize();
    request();
  });
  const help =
    'Select a shelf or drag to look around. Click the aisle to use the keys, or hold a movement button. Pick a package to see the shelf camera take its photo.';
  canvas.hidden = false;
  nav.hidden = false;
  picks.hidden = false;
  controls.hidden = false;
  guide.textContent = help;
  moveTo('aisle', true);
  resize();
  document.getElementById('store-poster').hidden = true;
  new ResizeObserver(resize).observe(room);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) request();
    else {
      releaseKeys();
      finishPickup();
    }
  }).observe(room);
  return { animatePickup, restorePhoto, focusShelf: moveTo };
}
