// Exterior of the same aisle. The door opens as the shopper crosses its threshold.
import * as T from '../three-r180/three.module.min.js';
import { demoPrices, dollars } from '../store-prices.js';

const smooth = (t) => T.MathUtils.smoothstep(t, 0, 1);
const mix = T.MathUtils.lerp;
const vec = (x, y, z) => new T.Vector3(x, y, z);
const unit = new T.BoxGeometry(1, 1, 1);
const crown = new T.IcosahedronGeometry(1, 1);
function block(parent, color, x, y, z, w, h, d, glass = false) {
  const material = new T.MeshStandardMaterial({
    color,
    roughness: 0.77,
    transparent: glass,
    opacity: glass ? 0.21 : 1,
    depthWrite: !glass,
  });
  const m = new T.Mesh(unit, material);
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  m.castShadow = !glass;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function front(scene) {
  const outside = new T.Group();
  scene.add(outside);
  const stone = '#e5cfaa',
    trim = '#254d49',
    silver = '#638181';
  block(outside, '#c7b7a2', 0, -0.08, 7.8, 23, 0.16, 5.2);
  block(outside, '#999a93', 0, -0.15, 13, 24, 0.15, 6);
  block(outside, '#bba990', 0, -0.04, 19, 75, 0.12, 8);
  for (let i = -5; i <= 5; i++) {
    const x = i * 3.1,
      h = 3.4 + (Math.abs(i) % 3) * 0.6;
    block(outside, ['#bd9e83', '#aab8aa', '#c3b7a5'][Math.abs(i) % 3], x, h * 0.5, 20, 3.1, h, 2.7);
    for (const dx of [-0.85, 0.05, 0.92]) {
      block(outside, '#6a8782', x + dx, 2.45, 18.63, 0.49, 0.87, 0.05);
      block(outside, '#788c84', x + dx, 0.89, 18.63, 0.61, 1.05, 0.05);
    }
  }
  for (let x = -10; x < 12; x += 1.8) block(outside, '#af9e89', x, 0.003, 7.9, 0.012, 0.008, 5.1);
  for (const x of [-3.47, 3.47]) {
    block(outside, stone, x, 2, 5.64, 4.75, 4, 0.14);
    block(outside, trim, x, 1.69, 5.76, 3.84, 2.73, 0.14);
    block(outside, '#94bdb9', x, 1.7, 5.85, 3.65, 2.57, 0.04);
    for (const off of [-0.89, 0, 0.89]) block(outside, trim, x + off, 1.7, 5.9, 0.044, 2.64, 0.06);
    block(outside, trim, x, 2.35, 5.9, 3.7, 0.043, 0.05);
    block(outside, '#7d9a8c', x, 0.5, 5.92, 3.72, 0.24, 0.04);
    for (let j = 0; j < 12; j++) {
      const brick = block(
        outside,
        '#c9ad88',
        x + ((j % 4) - 1.5) * 1.12,
        0.17 + 0.13 * Math.floor(j / 4),
        5.73,
        0.99,
        0.012,
        0.02,
      );
      brick.position.x += (Math.floor(j / 4) % 2) * 0.32;
    }
  }
  block(outside, stone, 0, 3.44, 5.67, 2.35, 1.12, 0.2);
  block(outside, trim, 0, 3.34, 5.95, 11.6, 0.15, 0.81);
  for (let i = 0; i < 31; i++) {
    const x = (i - 15) * 0.37;
    const m = block(outside, i % 2 ? '#e9e1c6' : '#3d7264', x, 3.25, 6.16, 0.37, 0.075, 1.01);
    m.rotation.x = 0.13;
    block(outside, i % 2 ? '#eee4c9' : '#467969', x, 3.1, 6.63, 0.37, 0.18, 0.06);
  }
  const doors = [];
  for (const side of [-1, 1]) {
    block(outside, trim, side * 1.07, 1.43, 5.76, 0.12, 2.9, 0.2);
    const leaf = new T.Group();
    outside.add(leaf);
    leaf.position.set(side * 0.51, 0, 5.72);
    doors.push(leaf);
    block(leaf, '#b1dfd9', 0, 1.38, 0, 1.0, 2.72, 0.045, true);
    for (const edge of [-0.48, 0.48]) block(leaf, silver, edge, 1.41, 0, 0.045, 2.8, 0.058);
    for (const y of [0.1, 1.08, 2.75]) block(leaf, silver, 0, y, 0, 1, 0.048, 0.06);
  }
  block(outside, trim, 0, 2.89, 5.76, 2.25, 0.16, 0.2);
  const treeMaterial = new T.MeshStandardMaterial({ color: '#568064', flatShading: true });
  for (const x of [-4.1, 4.3]) {
    block(outside, '#857461', x, 0.24, 7.24, 0.9, 0.48, 0.85);
    block(outside, '#71604c', x, 1.06, 7.24, 0.12, 1.75, 0.12);
    for (const [dx, dy, s] of [
      [0, 2.03, 0.75],
      [-0.27, 1.8, 0.46],
      [0.24, 1.83, 0.53],
    ]) {
      const m = new T.Mesh(crown, treeMaterial);
      m.position.set(x + dx, dy, 7.24);
      m.scale.set(s, 0.97 * s, 0.84 * s);
      m.castShadow = true;
      outside.add(m);
    }
  }
  const sun = new T.DirectionalLight('#fff3da', 1.5);
  sun.position.set(-4, 7, 10);
  sun.target.position.set(0, 1, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 4, bottom: -4, near: 0.1, far: 18 });
  sun.shadow.normalBias = 0.013;
  sun.shadow.bias = -0.0005;
  outside.add(sun, sun.target);
  return (open) => doors.forEach((leaf, i) => (leaf.position.x = (i ? 1 : -1) * (0.51 + open * 0.91)));
}

function handset(scene) {
  const phone = new T.Group();
  scene.add(phone);
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 1060;
  const ctx = canvas.getContext('2d');
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 8;
  const s = new T.Shape(),
    w = 0.127,
    h = 0.215,
    r = 0.011;
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const body = new T.Mesh(
    new T.ExtrudeGeometry(s, { depth: 0.013, bevelEnabled: false }),
    new T.MeshStandardMaterial({ color: '#263635' }),
  );
  body.position.z = -0.0065;
  phone.add(body);
  body.receiveShadow = false;
  const face = new T.Mesh(
    new T.PlaneGeometry(0.118, 0.197),
    new T.MeshBasicMaterial({ map, toneMapped: false }),
  );
  face.position.z = 0.008;
  phone.add(face);
  function rounded(x, y, w, h, r, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
  function text(t, x, y, size, weight = 400, color = '#193a36', align = 'left') {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.font = weight + ' ' + size + 'px "OpenAI Sans", sans-serif';
    ctx.fillText(t, x, y);
  }
  function check(x, y, r) {
    ctx.fillStyle = '#286956';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = r * 0.15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.46, y + 0.02 * r);
    ctx.lineTo(x - r * 0.13, y + r * 0.3);
    ctx.lineTo(x + r * 0.48, y - r * 0.34);
    ctx.stroke();
  }
  const total = dollars(demoPrices.beans.Box);
  const screen = (notice, opened) => {
    ctx.fillStyle = opened ? '#fffdf9' : '#dfebe2';
    ctx.fillRect(0, 0, 640, 1060);
    rounded(252, 15, 137, 24, 13, '#17201e');
    if (opened) {
      check(85, 163, 30);
      text('Payment received', 134, 179, 42, 600);
      text(total, 54, 329, 105, 600);
      text('Itemized receipt', 56, 444, 42, 600);
      text('365 Organic', 56, 530, 40);
      text('Garbanzo Beans', 56, 584, 48, 600);
      text('Box, 13.4 oz', 56, 638, 38);
      text('Qty 1', 56, 710, 39);
      text(total, 585, 710, 45, 600, undefined, 'right');
      check(74, 821, 18);
      text('Pickup verified', 111, 834, 37);
      text('Total charged', 56, 964, 42, 600);
      text(total, 585, 964, 48, 600, undefined, 'right');
    } else {
      text('10:24', 320, 245, 115, 500, undefined, 'center');
      if (notice > 0) {
        const y = 336 - 68 * notice;
        ctx.save();
        ctx.globalAlpha = notice;
        rounded(29, y, 582, 231, 30, '#ffffff');
        check(88, y + 62, 29);
        text('Store receipt', 138, y + 78, 43, 600);
        text(total + ' charged', 63, y + 156, 54, 600);
        ctx.restore();
      }
    }
    map.needsUpdate = true;
  };
  return { phone, screen };
}

export function exitSequence(scene, shopper, item) {
  const door = front(scene);
  const { phone, screen } = handset(scene);
  const priceView = vec(0.44, 0.3, -0.63).normalize();
  return (camera, u) => {
    const walk = smooth(u / 0.48),
      lift = smooth((u - 0.41) / 0.16);
    const z = mix(3.66, 7.43, walk),
      x = mix(-0.37, -0.12, walk);
    const stride = Math.sin(Math.PI * walk) ** 0.54;
    shopper.root.position.set(x, 0, z);
    shopper.root.rotation.y = 0.13 + 0.27 * lift;
    const step = walk * 27.4;
    const held = vec(x - 0.29, 0.73 + 0.026 * Math.cos(step) * stride, z + 0.13);
    item.position.copy(held);
    item.rotation.set(0.065, 0.14, 0.11);
    item.updateMatrixWorld();
    const grip = item.localToWorld(vec(0.1, 0.2, 0.045));
    const left = vec(x + 0.25 + lift * 0.035, 0.93 + 0.45 * lift, z + 0.12 + 0.23 * lift);
    shopper.pose({ right: grip, left, grasp: 1, stride, phase: step, look: lift * 0.92 });
    phone.visible = u >= 0.41;
    phone.position.copy(left);
    phone.lookAt(phone.position.clone().add(priceView));
    phone.position.sub(vec(0.068, -0.077, -0.052).applyQuaternion(phone.quaternion));
    phone.updateMatrixWorld();
    door(smooth((z - 3.8) / 1.18) * (1 - smooth((z - 6.44) / 0.87)));
    const wide = vec(2.06, 1.49, 10.39);
    const subject = vec(x, 1.14, z);
    if (u < 0.52) {
      const push = smooth(u / 0.52);
      camera.position.copy(wide).add(vec(-0.24 * push, 0.05 * push, 0.24 * push));
      camera.lookAt(subject);
      camera.fov = mix(46, 43, push);
    } else {
      // Cut over the shopper's shoulder. Stay on this side of the handset for the push-in.
      const near = smooth((u - 0.52) / 0.2);
      const dist = mix(0.85, 0.355, near);
      camera.position.copy(phone.position).addScaledVector(priceView, dist);
      camera.lookAt(phone.position);
      camera.fov = mix(46, 38, near);
    }
    const notice = smooth((u - 0.6) / 0.075);
    screen(notice, u >= 0.766);
    camera.updateProjectionMatrix();
  };
}
