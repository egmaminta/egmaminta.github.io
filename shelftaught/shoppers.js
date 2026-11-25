// Both the interactive aisle and the film pose these figures from the same pickup.
import * as T from './three-r180/three.module.min.js';

const v = (x, y, z) => new T.Vector3(x, y, z);
const up = v(0, 1, 0);
const ball = new T.SphereGeometry(1, 24, 18);
const unit = new T.BoxGeometry(1, 1, 1);
const mat = (color) => new T.MeshStandardMaterial({ color, roughness: 0.88 });
const smooth = (t) => T.MathUtils.smoothstep(t, 0, 1);
const mix = T.MathUtils.lerp;
const cloth = [
  { skin: '#ad704e', hair: '#302420', shirt: '#197976', pants: '#293d49', sole: '#efe0c9', tied: true },
  { skin: '#cd916c', hair: '#372e31', shirt: '#b95836', pants: '#394a64', sole: '#f2ecdc', tied: false },
];

function group(parent) {
  const g = new T.Group();
  parent.add(g);
  return g;
}
function mesh(parent, geo, material, sx, sy, sz, x = 0, y = 0, z = 0) {
  const m = new T.Mesh(geo, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
function ellipsoid(parent, material, x, y, z, sx, sy, sz) {
  return mesh(parent, ball, material, sx, sy, sz, x, y, z);
}
function profile(parent, material, outline, depth = 1) {
  const geo = new T.LatheGeometry(
    outline.map(([r, y]) => new T.Vector2(r, y)),
    28,
  );
  return mesh(parent, geo, material, 1, 1, depth);
}
function segment(parent, material, top, bottom) {
  return mesh(parent, new T.CylinderGeometry(bottom, top, 1, 16), material, 1, 1, 1);
}
function join(bone, a, b) {
  const d = b.clone().sub(a);
  bone.position.copy(a).lerp(b, 0.5);
  bone.scale.y = d.length();
  bone.quaternion.setFromUnitVectors(up, d.normalize());
}

// Solve a two-link arm in torso coordinates. Both ends of each forearm stay attached.
function arm(parent, side, color) {
  const sleeve = segment(parent, color.shirt, 0.089, 0.069);
  const upper = segment(parent, color.skin, 0.061, 0.05);
  const lower = segment(parent, color.skin, 0.052, 0.033);
  const shoulderCap = ellipsoid(parent, color.shirt, 0, 0, 0, 0.087, 0.084, 0.087);
  const elbowCap = ellipsoid(parent, color.skin, 0, 0, 0, 0.051, 0.052, 0.051);
  const hand = group(parent);
  ellipsoid(hand, color.skin, 0, 0, 0, 0.045, 0.056, 0.031);
  for (let i = 0; i < 4; i++) {
    const digit = ellipsoid(
      hand,
      color.skin,
      -0.029 + i * 0.019,
      -0.05,
      0.007,
      0.0105,
      0.037 - Math.abs(i - 1) * 0.004,
      0.013,
    );
    digit.rotation.x = -0.2;
  }
  const thumb = ellipsoid(hand, color.skin, -side * 0.038, -0.009, 0.011, 0.016, 0.034, 0.017);
  thumb.rotation.z = -side * 0.48;

  return (goal, grip = 0) => {
    const s = v(side * 0.196, 1.418, 0.004);
    const axis = goal.clone().sub(s);
    const distance = Math.min(0.668, Math.max(0.04, axis.length()));
    axis.normalize();
    const wrist = s.clone().addScaledVector(axis, distance);
    const pole = v(side * 0.81, -0.88, -0.34);
    pole.addScaledVector(axis, -pole.dot(axis)).normalize();
    const l1 = 0.319,
      l2 = 0.351;
    const a = (l1 * l1 - l2 * l2 + distance * distance) / (2 * distance);
    const e = s
      .clone()
      .addScaledVector(axis, a)
      .addScaledVector(pole, Math.sqrt(Math.max(0, l1 * l1 - a * a)));
    const hem = s.clone().lerp(e, 0.7);
    join(sleeve, s, hem);
    join(upper, hem, e);
    join(lower, e, wrist);
    shoulderCap.position.copy(s);
    elbowCap.position.copy(e);
    hand.position.copy(wrist);
    hand.rotation.set(-0.12 + grip * 0.53, side * grip * 0.72, -side * (0.1 + grip * 0.19));
  };
}

function leg(parent, side, color) {
  const pivot = group(parent);
  pivot.position.set(side * 0.108, 0.88, 0);
  const knee = group(pivot);
  knee.position.set(0, -0.406, 0);
  const thigh = profile(
    pivot,
    color.pants,
    [
      [0.073, -0.417],
      [0.083, -0.3],
      [0.11, -0.12],
      [0.115, -0.01],
      [0.091, 0.033],
    ],
    0.96,
  );
  thigh.rotation.z = side * 0.025;
  profile(
    knee,
    color.pants,
    [
      [0.06, -0.389],
      [0.066, -0.34],
      [0.079, -0.15],
      [0.077, 0],
      [0.071, 0.036],
    ],
    0.88,
  );
  const foot = group(knee);
  foot.position.set(0, -0.38, 0);
  ellipsoid(foot, color.sole, 0, -0.043, 0.047, 0.081, 0.04, 0.149);
  ellipsoid(foot, color.shoe, 0, -0.017, 0.048, 0.079, 0.058, 0.142);
  mesh(foot, unit, color.sole, 0.081, 0.012, 0.015, 0, 0.024, 0.101);
  return (phase, stride) => {
    const a = 0.48 * Math.sin(phase) * stride;
    pivot.rotation.x = a;
    knee.rotation.x = 0.66 * Math.max(0, -Math.cos(phase)) * stride;
    foot.rotation.x = -a * 0.6 - knee.rotation.x * 0.69;
  };
}

export function makeShopper(scene, variant = 0) {
  const style = cloth[variant];
  const color = Object.fromEntries(
    Object.entries(style)
      .filter(([k]) => k !== 'tied')
      .map(([k, c]) => [k, mat(c)]),
  );
  color.shoe = mat(variant ? '#5f443c' : '#e6c691');
  const root = group(scene),
    torso = group(root),
    head = group(torso);
  profile(
    torso,
    color.pants,
    [
      [0.13, 0.79],
      [0.192, 0.87],
      [0.158, 1.036],
    ],
    0.7,
  );
  profile(
    torso,
    color.shirt,
    [
      [0.175, 0.923],
      [0.185, 0.945],
      [0.161, 1.075],
      [0.185, 1.24],
      [0.217, 1.368],
      [0.212, 1.412],
      [0.153, 1.464],
      [0.078, 1.483],
    ],
    0.68,
  );
  const collar = profile(
    torso,
    color.shirt,
    [
      [0.078, 1.462],
      [0.075, 1.502],
      [0.069, 1.5],
    ],
    0.96,
  );
  collar.scale.z = 0.86;
  ellipsoid(torso, color.skin, 0, 1.526, 0.008, 0.068, 0.096, 0.064);
  head.position.set(0, 1.68, 0.016);
  ellipsoid(head, color.skin, 0, 0, 0.004, 0.121, 0.153, 0.113);
  ellipsoid(head, color.skin, 0, -0.069, 0.024, 0.093, 0.092, 0.089);
  for (const s of [-1, 1]) {
    ellipsoid(head, color.skin, s * 0.117, -0.008, 0, 0.024, 0.042, 0.024);
    const brow = ellipsoid(head, color.hair, s * 0.046, 0.032, 0.103, 0.033, 0.007, 0.005);
    brow.rotation.z = s * 0.066;
    ellipsoid(head, color.hair, s * 0.046, 0.009, 0.109, 0.012, 0.01, 0.006);
  }
  ellipsoid(head, color.skin, 0, -0.017, 0.113, 0.024, 0.035, 0.028);
  ellipsoid(head, mat('#965e4f'), 0, -0.07, 0.104, 0.028, 0.005, 0.004);
  ellipsoid(head, color.hair, 0, 0.072, -0.018, 0.127, 0.121, 0.119);
  ellipsoid(head, color.hair, 0, 0.004, -0.06, 0.12, 0.132, 0.078);
  for (const side of [-1, 1]) {
    const lock = ellipsoid(head, color.hair, side * 0.106, 0.009, 0.013, 0.025, 0.092, 0.052);
    lock.rotation.x = -0.21;
  }
  if (style.tied) {
    ellipsoid(head, color.hair, 0, 0.061, -0.151, 0.063, 0.076, 0.071);
    const tail = ellipsoid(head, color.hair, 0.012, -0.037, -0.169, 0.046, 0.099, 0.047);
    tail.rotation.x = 0.21;
  } else {
    const fringe = ellipsoid(head, color.hair, 0.018, 0.086, 0.066, 0.111, 0.049, 0.081);
    fringe.rotation.z = -0.16;
  }
  const arms = [arm(torso, -1, color), arm(torso, 1, color)];
  const legs = [leg(root, -1, color), leg(root, 1, color)];
  function pose({ lean = 0, left, right, grasp = 0, stride = 0, phase = 0, look = 0 } = {}) {
    torso.position.set(0, 0.018 * Math.sin(phase) ** 2 * stride, lean * 0.105);
    torso.rotation.x = lean * 0.075;
    head.rotation.set(0.06 + look * 0.28, -0.1 + lean * 0.11, 0);
    root.updateMatrixWorld(true);
    for (const [i, side] of [-1, 1].entries()) {
      const goal = i ? left : right;
      const rest = v(side * 0.235, 0.925, 0.078 + Math.sin(phase + i * Math.PI) * stride * 0.23);
      arms[i](goal ? torso.worldToLocal(goal.clone()) : rest, goal ? grasp : 0);
      legs[i](phase + i * Math.PI, stride);
    }
  }
  pose();
  return { root, pose };
}

export const pickupDuration = 4.3;
export const captureAt = 0.7;
export const lensPosition = [-2.77, 3.18, 0.15];

export function stageShoppers(scene, heroes) {
  const people = { beans: makeShopper(scene, 0), ranch: makeShopper(scene, 1) };
  function stand(key, x = heroes[key].userData.shelfPosition.x) {
    const p = people[key];
    p.root.position.set(x + 0.4, 0, -1.98);
    p.root.rotation.y = -2.47;
    p.pose();
  }
  Object.keys(people).forEach((k) => stand(k));
  function reset(key, item) {
    item.position.copy(item.userData.shelfPosition);
    item.rotation.set(0, 0, 0);
    stand(key);
  }
  function pickup(key, item, time) {
    const p = people[key],
      base = item.userData.shelfPosition;
    // Reach the shelf first. Only the time interval after contact moves the package.
    const reach = smooth(time / 0.33) * (1 - smooth((time - 0.88) / 0.12));
    const held = smooth((time - 0.33) / 0.23) * (1 - smooth((time - 0.76) / 0.12));
    p.root.position.set(
      mix(heroes[key].userData.shelfPosition.x, base.x, smooth(time / 0.24)) + 0.4,
      0,
      -1.98,
    );
    p.root.rotation.y = -2.47 + held * 0.18;
    item.position.copy(base);
    item.position.z += 0.5 * held;
    item.position.x -= 0.14 * held;
    item.position.y += 0.1 * held + 0.045 * Math.sin(held * Math.PI);
    item.rotation.set(-0.08 * held, -0.47 * held, -0.075 * held);
    item.updateMatrixWorld();
    const grip = item.localToWorld(v(0.144, 0.212, 0.069));
    const rest = p.root.localToWorld(v(-0.235, 0.925, 0.078));
    // With the body turned towards the shelf, this arm reaches the near side of the box.
    p.pose({ lean: reach, right: rest.lerp(grip, reach), grasp: reach, look: held * 0.58 });
    return item.localToWorld(v(0, 0.23, 0.04));
  }
  function cameraView(cam, item, amount) {
    const center = item.localToWorld(v(0, 0.23, 0.06));
    cam.position.fromArray(lensPosition);
    cam.lookAt(center);
    cam.fov = mix(46, 13, smooth(amount));
    cam.updateProjectionMatrix();
  }
  return { people, stand, reset, pickup, cameraView };
}
