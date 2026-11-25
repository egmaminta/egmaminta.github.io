// Exterior of the same aisle. The door opens as the shopper crosses its threshold.
import * as T from '../three-r180/three.module.min.js';
import { handRig, orientation } from '../hands.js';
import { demoPrices, dollars } from '../store-prices.js';

const smooth = (t) => T.MathUtils.smoothstep(t, 0, 1);
const mix = T.MathUtils.lerp;
const beat = (t, start, end) => T.MathUtils.smootherstep(t, start, end);
const up = new T.Vector3(0, 1, 0);
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
  block(outside, '#a5afa0', 0, -0.37, 0, 180, 0.2, 160);
  block(outside, '#c7b7a2', 0, -0.08, 7.8, 125, 0.16, 5.2);
  block(outside, '#999a93', 0, -0.15, 13, 125, 0.15, 6);
  block(outside, '#bba990', 0, -0.04, 19, 125, 0.12, 8);
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

function roundedShape(w, h, r) {
  const s = new T.Shape();
  const x = w / 2,
    y = h / 2;
  s.moveTo(-x + r, -y);
  s.lineTo(x - r, -y);
  s.quadraticCurveTo(x, -y, x, -y + r);
  s.lineTo(x, y - r);
  s.quadraticCurveTo(x, y, x - r, y);
  s.lineTo(-x + r, y);
  s.quadraticCurveTo(-x, y, -x, y - r);
  s.lineTo(-x, -y + r);
  s.quadraticCurveTo(-x, -y, -x + r, -y);
  return s;
}

function handset(parent) {
  const phone = new T.Group();
  parent.add(phone);
  const width = 0.078,
    height = 0.155;
  const caseMaterial = new T.MeshStandardMaterial({
    color: '#294642',
    metalness: 0.26,
    roughness: 0.38,
  });
  const body = new T.Mesh(
    new T.ExtrudeGeometry(roundedShape(width, height, 0.008), {
      depth: 0.007,
      bevelEnabled: true,
      bevelThickness: 0.001,
      bevelSize: 0.001,
      bevelSegments: 3,
    }),
    caseMaterial,
  );
  body.position.z = -0.0035;
  phone.add(body);
  // The camera lenses identify the back while the handset clears the pocket.
  for (const y of [0.055, 0.066]) {
    const rim = new T.Mesh(new T.CylinderGeometry(0.0048, 0.0048, 0.0018, 20), caseMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0.0277, y, -0.0051);
    phone.add(rim);
    const lens = new T.Mesh(
      new T.CircleGeometry(0.0034, 20),
      new T.MeshStandardMaterial({ color: '#19272a', roughness: 0.18 }),
    );
    lens.rotation.y = Math.PI;
    lens.position.set(0.0277, y, -0.0061);
    phone.add(lens);
  }
  block(phone, '#526763', 0.0398, 0.016, 0.0001, 0.0015, 0.016, 0.0026);
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d');
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 8;
  const frontShape = new T.ShapeGeometry(roundedShape(0.074, 0.149, 0.007));
  const xy = frontShape.attributes.position,
    uv = frontShape.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, xy.getX(i) / 0.074 + 0.5, xy.getY(i) / 0.149 + 0.5);
  const glass = new T.Mesh(frontShape, new T.MeshBasicMaterial({ map, toneMapped: false }));
  glass.position.z = 0.00465;
  phone.add(glass);
  const total = dollars(demoPrices.beans.Box);
  function text(value, x, y, size, weight = 400, ink = '#173d36', align = 'left') {
    ctx.fillStyle = ink;
    ctx.textAlign = align;
    ctx.font = weight + ' ' + size + 'px "OpenAI Sans", sans-serif';
    ctx.fillText(value, x, y);
  }
  function pill(x, y, w, h, r, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
  function check(x, y, r) {
    ctx.fillStyle = '#2d6956';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = r * 0.15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.45, y);
    ctx.lineTo(x - r * 0.13, y + r * 0.31);
    ctx.lineTo(x + r * 0.46, y - r * 0.32);
    ctx.stroke();
  }
  function receipt() {
    ctx.fillStyle = '#fffef9';
    ctx.fillRect(0, 0, 640, 1280);
    check(82, 182, 30);
    text('Payment received', 130, 200, 49, 600);
    text(total, 47, 372, 126, 600);
    text('Itemized receipt', 48, 535, 53, 600);
    text('365 Organic', 48, 638, 47);
    text('Garbanzo Beans', 48, 710, 63, 600);
    text('Box, 13.4 oz', 48, 783, 46);
    text('Qty 1', 48, 876, 49);
    text(total, 592, 876, 53, 600, undefined, 'right');
    check(68, 997, 21);
    text('Pickup verified', 105, 1012, 46);
    text('Total charged', 48, 1174, 46, 600);
    text(total, 592, 1174, 61, 600, undefined, 'right');
  }
  function screen(notice, open) {
    if (open < 1) {
      const sky = ctx.createLinearGradient(0, 0, 520, 1280);
      sky.addColorStop(0, '#c1d6d1');
      sky.addColorStop(0.62, '#f4eee1');
      sky.addColorStop(1, '#aecdc3');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 640, 1280);
      text('10:24', 320, 336, 143, 500, undefined, 'center');
      if (notice > 0) {
        const y = 735 - 76 * notice;
        ctx.save();
        ctx.globalAlpha = notice * (1 - open);
        pill(27, y, 586, 230, 33, '#fffefa');
        check(85, y + 64, 28);
        text('Store receipt', 130, y + 80, 48, 600);
        text(total + ' charged', 55, y + 165, 66, 600);
        ctx.restore();
      }
    }
    if (open > 0) {
      ctx.save();
      ctx.globalAlpha = open;
      ctx.translate(0, 65 * (1 - open));
      receipt();
      ctx.restore();
    }
    pill(253, 18, 134, 24, 14, '#142724');
    pill(231, 1248, 178, 7, 4, '#3b5350');
    map.needsUpdate = true;
  }
  screen(0, 0);
  return { phone, screen };
}

function trouserPocket(root) {
  const pocket = new T.Group();
  root.add(pocket);
  pocket.position.set(0.167, 0.911, 0.081);
  pocket.rotation.y = 0.91;
  const cloth = new T.MeshStandardMaterial({ color: '#314957', roughness: 1, side: T.DoubleSide });
  const thread = new T.MeshStandardMaterial({ color: '#78868a', roughness: 0.94 });
  const edge = [
    [-0.055, 0.002],
    [0.055, -0.003],
    [0.052, -0.112],
    [0.032, -0.136],
    [-0.03, -0.135],
    [-0.053, -0.116],
  ];
  const poly = new T.Shape(edge.map(([x, y]) => new T.Vector2(x, y)));
  for (const z of [-0.005, 0.027]) {
    const face = new T.Mesh(new T.ShapeGeometry(poly), cloth);
    face.position.z = z;
    face.castShadow = true;
    pocket.add(face);
  }
  // A gusset on three sides leaves a real opening at the top.
  const points = [];
  for (let i = 1; i < edge.length; i++) {
    const a = edge[i],
      b = edge[(i + 1) % edge.length];
    points.push(...a, -0.005, ...b, -0.005, ...b, 0.027, ...a, -0.005, ...b, 0.027, ...a, 0.027);
  }
  const walls = new T.BufferGeometry();
  walls.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  walls.computeVertexNormals();
  pocket.add(new T.Mesh(walls, cloth));
  const seam = edge.concat([edge[0]]).map(([x, y]) => vec(x * 0.935, (y + 0.064) * 0.95 - 0.064, 0.028));
  for (let i = 1; i < seam.length; i++) {
    const path = new T.LineCurve3(seam[i - 1], seam[i]);
    pocket.add(new T.Mesh(new T.TubeGeometry(path, 1, 0.0007, 5, false), thread));
  }
  return pocket;
}

// The wrist, the phone and the thumb share a grip frame. Finger pads wrap around the
// case during the lift; the thumb can move independently to open the notification.
const wristInPhone = vec(-0.031, -0.08, -0.029);
const inHand = (x, y, z) => vec(x, y, z).sub(wristInPhone);
function phoneHand(original) {
  const { finger, turn } = handRig(original);
  const fingers = [];
  for (let i = 0; i < 4; i++) {
    const x = -0.008 + i * 0.0155,
      y = 0.079 - Math.abs(i - 1) * 0.0035,
      len = [0.063, 0.068, 0.063, 0.05][i];
    const relaxed = [
      vec(x, y, 0),
      vec(x, y + len * 0.45, 0.005),
      vec(x + 0.001, y + len * 0.78, 0.012),
      vec(x + 0.001, y + len, 0.021),
    ];
    const h = [0.008, -0.009, -0.029, -0.049][i];
    const curled =
      i === 3
        ? [
            inHand(0.002, -0.051, -0.026),
            inHand(0.016, -0.068, -0.021),
            inHand(0.025, -0.079, -0.009),
            inHand(0.032, -0.077, 0.001),
          ]
        : [
            inHand(-0.016 + 0.006 * i, h - 0.019, -0.031),
            inHand(0.012, h + 0.002, -0.025),
            inHand(0.036, h + 0.01, -0.012),
            inHand(0.039 + (i === 1 ? 0.0015 : 0), h + 0.004, -0.0005),
          ];
    fingers.push({
      relaxed,
      curled,
      draw: finger(
        [0.0081, 0.0073, 0.0065, 0.0058].map((r) => r * (1 - i * 0.035)),
        vec(0.77, 0, 0.64),
      ),
    });
  }
  const thumb = finger([0.011, 0.0101, 0.0088, 0.0069], vec(0, 0, 1));
  const relaxedThumb = [
    vec(-0.012, 0.038, 0),
    vec(-0.027, 0.052, 0.008),
    vec(-0.031, 0.065, 0.014),
    vec(-0.032, 0.074, 0.02),
  ];
  return (worldRotation, grasp, reach, contact) => {
    // Cancel the underlying forearm pose only at the wrist, leaving the arm IK intact.
    turn(worldRotation);
    for (const digit of fingers)
      digit.draw(digit.relaxed.map((p, i) => p.clone().lerp(digit.curled[i], grasp)));
    const resting = [
      inHand(-0.027, -0.048, -0.024),
      inHand(-0.042, -0.035, -0.005),
      inHand(-0.044, -0.023, -0.001),
      inHand(-0.043, -0.015, 0.004),
    ];
    const tap = [
      resting[0],
      inHand(-0.046, -0.035, 0.006),
      inHand(-0.036, -0.024, 0.02),
      inHand(-0.021, -0.015, 0.019 - 0.0074 * contact),
    ];
    thumb(relaxedThumb.map((p, i) => p.clone().lerp(resting[i].clone().lerp(tap[i], reach), grasp)));
  };
}

function carryCarton(original) {
  const { finger, turn } = handRig(original);
  // The carton rests on the palm. The fingers curl around its lower front edge.
  for (let i = 0; i < 4; i++) {
    const x = -0.013 + 0.015 * i,
      reach = 0.114 - Math.abs(1 - i) * 0.002;
    finger([0.0084, 0.0075, 0.0066, 0.006])([
      vec(x, 0.075, 0.001),
      vec(x, reach - 0.021, 0.011),
      vec(x, reach + 0.009, 0.019),
      vec(x, reach + 0.013, 0.033),
    ]);
  }
  finger([0.011, 0.0101, 0.009, 0.0073])([
    vec(-0.014, 0.037, 0.001),
    vec(-0.031, 0.056, 0.01),
    vec(-0.041, 0.071, 0.026),
    vec(-0.047, 0.078, 0.043),
  ]);
  return turn;
}

function curve(a, b, c, d, t) {
  return new T.CubicBezierCurve3(a, b, c, d).getPoint(t);
}

export function exitSequence(scene, shopper, item, cues) {
  const door = front(scene),
    root = shopper.root;
  const pocket = trouserPocket(root);
  const { phone, screen } = handset(root);
  const poseHand = phoneHand(shopper.leftHand);
  const smile = new T.CatmullRomCurve3([
    vec(-0.027, -0.068, 0.109),
    vec(-0.012, -0.071, 0.115),
    vec(0, -0.072, 0.117),
    vec(0.014, -0.071, 0.114),
    vec(0.027, -0.068, 0.109),
  ]);
  shopper.head.add(
    new T.Mesh(
      new T.TubeGeometry(smile, 18, 0.0022, 7, false),
      new T.MeshStandardMaterial({ color: '#895747' }),
    ),
  );
  const poseCartonHand = carryCarton(shopper.rightHand);
  const carryRotation = orientation(vec(0, 1, 0), vec(0, 0, 1));
  const stowed = pocket.position.clone().add(vec(0, -0.061, 0.011).applyQuaternion(pocket.quaternion));
  const clear = pocket.position.clone().add(vec(0.004, 0.105, 0.048).applyQuaternion(pocket.quaternion));
  const reading = vec(0.14, 1.315, 0.365);
  const pocketQ = pocket.quaternion
    .clone()
    .multiply(new T.Quaternion().setFromAxisAngle(vec(1, 0, 0), Math.PI));
  const readerNormal = vec(-0.16, 0.55, -0.82).normalize();
  const halfwayQ = orientation(vec(-0.53, 0.78, -0.33).normalize(), vec(0.27, 0.05, 1));
  const readQ = orientation(readerNormal);
  const world = (pos) => root.localToWorld(pos.clone());
  return (camera, u) => {
    const t = u * cues.seconds;
    // Mostly constant walking speed, with a shorter last step and a settled stance at the curb.
    const walk = Math.min(t / 6.65, 1);
    const travel = walk * (1.5 - 0.5 * walk * walk);
    const stride = 1 - beat(t, 5.1, 6.65);
    const phase = travel * 30.8 + 0.5;
    root.position.set(mix(-0.37, -0.15, travel), 0, mix(3.29, 7.62, travel));
    root.rotation.y =
      0.06 + 0.095 * beat(t, cues.chime, cues.clearPocket + 0.6) + 0.025 * Math.sin(phase) * stride;
    root.updateMatrixWorld(true);
    door(smooth((root.position.z - 3.7) / 1.2) * (1 - smooth((root.position.z - 6.55) / 0.91)));
    // Right hand carries the carton while the left arm swings freely until the chime.
    item.scale.setScalar(0.66);
    item.position.copy(
      world(
        vec(-0.247, 0.84 + 0.015 * Math.sin(phase) * stride, 0.19 - 0.06 * Math.sin(phase) * stride),
      ),
    );
    item.quaternion
      .copy(root.quaternion)
      .multiply(new T.Quaternion().setFromEuler(new T.Euler(0.07, 0.12, -0.1)));
    item.updateMatrixWorld();
    const grip = item.localToWorld(vec(0.062, -0.033, -0.09));
    const reach = beat(t, cues.chime + 0.12, cues.grasp - 0.035);
    const pull = beat(t, cues.grasp, cues.clearPocket);
    const lift = beat(t, cues.clearPocket, cues.clearPocket + 1.85);
    const thumbReach =
      beat(t, cues.tap - 0.66, cues.tap - 0.16) * (1 - beat(t, cues.tap + 0.16, cues.tap + 0.64));
    const contact = beat(t, cues.tap - 0.15, cues.tap) * (1 - beat(t, cues.tap + 0.05, cues.tap + 0.2));
    phone.position.copy(stowed).lerp(clear, pull);
    if (lift > 0)
      phone.position.copy(
        curve(
          clear,
          clear.clone().add(vec(0.1, 0.093, 0.045)),
          reading.clone().add(vec(0.14, -0.065, -0.072)),
          reading,
          lift,
        ),
      );
    phone.quaternion
      .copy(pocketQ)
      .slerp(halfwayQ, lift)
      .slerp(halfwayQ.clone().slerp(readQ, lift), lift);
    phone.rotateX(-0.021 * contact);
    const wrist = phone.position.clone().add(wristInPhone.clone().applyQuaternion(phone.quaternion));
    const relaxed = vec(
      0.244,
      0.81 + 0.016 * Math.cos(phase) * stride,
      0.036 + 0.142 * Math.sin(phase) * stride,
    );
    const left = curve(
      relaxed,
      relaxed.clone().add(vec(0.082, 0.042, 0.024)),
      wrist.clone().add(vec(0.047, 0.039, 0.03)),
      wrist,
      reach,
    );
    shopper.pose({
      right: grip,
      left: world(left),
      lean: 0.035 * reach * (1 - lift),
      stride,
      phase,
      grasp: 1,
    });
    poseCartonHand(item.quaternion.clone().multiply(carryRotation));
    poseHand(
      root.quaternion.clone().multiply(phone.quaternion),
      beat(t, cues.grasp - 0.32, cues.clearPocket + 0.16),
      thumbReach,
      contact,
    );
    // Her eyes turn to the pocket first, then follow the rising screen.
    const attention = beat(t, cues.chime + 0.06, cues.grasp - 0.08);
    const sight = phone.position.clone().sub(vec(0, 1.68, 0.04));
    shopper.head.rotation.set(
      mix(0.055, Math.min(0.68, Math.atan2(-sight.y, Math.hypot(sight.x, sight.z))), attention),
      mix(-0.06, Math.min(0.47, Math.atan2(sight.x, Math.max(0.02, sight.z))), attention),
      -0.055 * attention,
    );
    screen(beat(t, cues.chime, cues.chime + 0.24), beat(t, cues.tap, cues.tap + 0.23));

    // A continuous move around the open (left) side: doorway, pocket, then over the shoulder.
    const wide = vec(1.87, 1.47, 10.87);
    const medium = vec(1.44, 1.44, 1.61),
      detail = vec(0.8, 1.1, 0.53);
    const approach = beat(t, 3.9, cues.chime + 0.12),
      pocketView = beat(t, cues.chime + 0.08, cues.grasp + 0.72);
    camera.position.copy(wide).lerp(world(medium), approach).lerp(world(detail), pocketView);
    const target = world(
      vec(0.015, 1.12, 0.035)
        .lerp(vec(0.07, 1.25, 0.07), approach)
        .lerp(vec(0.158, 0.982, 0.09), pocketView),
    );
    const arc = beat(t, cues.clearPocket - 0.44, cues.clearPocket + 2.12);
    const shoulder = vec(0.65, 1.54, -0.155);
    const sweep = curve(detail, vec(1.04, 1.19, 0.29), vec(0.95, 1.49, -0.07), shoulder, arc);
    camera.position.lerp(world(sweep), arc);
    const follow = beat(t, cues.clearPocket - 0.34, cues.clearPocket + 0.65);
    target.lerp(world(phone.position), follow);
    const over = reading
      .clone()
      .addScaledVector(readerNormal, 0.47)
      .add(vec(0.12, 0.042, 0.018));
    camera.position.lerp(world(over), beat(t, cues.clearPocket + 1.12, cues.tap - 0.59));
    const close = reading
      .clone()
      .addScaledVector(readerNormal, 0.278)
      .add(vec(0.018, 0.004, 0));
    camera.position.lerp(world(close), beat(t, cues.tap - 0.75, cues.tap + 1.35));
    camera.lookAt(target);
    camera.fov = mix(mix(46, 37, approach), 34, beat(t, cues.clearPocket, cues.tap));
    camera.updateProjectionMatrix();
    return { distance: camera.position.distanceTo(target), radius: 5.8 * approach };
  };
}
