// Both the interactive aisle and the film pose these figures from the same pickup.
import * as T from './three-r180/three.module.min.js';
import { shelfHand, orientation } from './hands.js';

const v = (x, y, z) => new T.Vector3(x, y, z);
const up = v(0, 1, 0);
const down = v(0, -1, 0);
const step = T.MathUtils.smootherstep;
const forearmShape = new T.LatheGeometry(
  [
    [0.001, -0.5],
    [0.04, -0.49],
    [0.051, -0.43],
    [0.052, -0.34],
    [0.05, -0.2],
    [0.045, 0],
    [0.038, 0.18],
    [0.031, 0.33],
    [0.027, 0.43],
    [0.025, 0.48],
    [0.023, 0.508],
    [0.017, 0.536],
    [0.001, 0.552],
  ].map(([r, y]) => new T.Vector2(r, y)),
  28,
);

const ball = new T.SphereGeometry(1, 24, 18);
const unit = new T.BoxGeometry(1, 1, 1);
const mat = (color) => new T.MeshStandardMaterial({ color, roughness: 0.88 });
const smooth = (t) => T.MathUtils.smoothstep(t, 0, 1);
const mix = T.MathUtils.lerp;
const cloth = [
  {
    skin: '#ad704e',
    hair: '#302420',
    shirt: '#197976',
    pants: '#293d49',
    sole: '#efe0c9',
    tied: true,
  },
  {
    skin: '#cd916c',
    hair: '#372e31',
    shirt: '#b95836',
    pants: '#394a64',
    sole: '#f2ecdc',
    tied: false,
  },
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
  const lower = mesh(parent, forearmShape, color.skin, 1, 1, 1);
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

  function solve(goal, grip = 0, shelf = false) {
    const s = v(side * 0.196, 1.418, 0.004);
    const axis = goal.clone().sub(s);
    const distance = Math.min(0.668, Math.max(0.04, axis.length()));
    axis.normalize();
    const wrist = s.clone().addScaledVector(axis, distance);
    const pole = shelf ? v(side * 0.33, -0.96, -0.46) : v(side * 0.81, -0.88, -0.34);
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
  }
  return { hand, solve };
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
  function walk(phase, stride) {
    const a = 0.48 * Math.sin(phase) * stride;
    pivot.rotation.x = a;
    knee.rotation.x = 0.66 * Math.max(0, -Math.cos(phase)) * stride;
    foot.rotation.x = -a * 0.6 - knee.rotation.x * 0.69;
  }
  function plant(hip, ankle) {
    const start = hip.clone().add(v(side * 0.108, 0, 0));
    const axis = ankle.clone().sub(start);
    const length = axis.length();
    axis.normalize();
    const forward = v(side * 0.12, 0, 1);
    forward.addScaledVector(axis, -forward.dot(axis)).normalize();
    const along = (0.406 ** 2 - 0.38 ** 2 + length ** 2) / (2 * length);
    const bend = start
      .clone()
      .addScaledVector(axis, along)
      .addScaledVector(forward, Math.sqrt(Math.max(0, 0.406 ** 2 - along ** 2)));
    pivot.position.copy(start);
    pivot.quaternion.setFromUnitVectors(down, bend.clone().sub(start).normalize());
    const shin = new T.Quaternion().setFromUnitVectors(down, ankle.clone().sub(bend).normalize());
    knee.quaternion.copy(pivot.quaternion).invert().multiply(shin);
    foot.quaternion
      .copy(shin)
      .invert()
      .multiply(new T.Quaternion().setFromAxisAngle(up, side * 0.09));
  }
  return { walk, plant };
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
    seat = group(root),
    torso = group(root),
    head = group(torso);
  profile(
    seat,
    color.pants,
    [
      [0.13, 0.79],
      [0.192, 0.87],
      [0.171, 0.925],
      [0.137, 0.992],
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
  const pelvis = v(0, 0.88, 0);
  function pose({
    lean = 0,
    left,
    right,
    grasp = 0,
    stride = 0,
    phase = 0,
    look = 0,
    stance,
  } = {}) {
    const hip = stance
      ? stance.hip
      : pelvis.clone().add(v(0, 0.018 * Math.sin(phase) ** 2 * stride, 0));
    seat.position.copy(hip).sub(pelvis);
    torso.rotation.set(lean, stance?.twist ?? 0, 0, 'YXZ');
    // The belt stays over the pelvis as the chest inclines.
    torso.position.copy(hip).sub(pelvis.clone().applyQuaternion(torso.quaternion));
    head.rotation.set(0.06 + look * 0.28, -0.1, 0);
    root.updateMatrixWorld(true);
    for (const [i, side] of [-1, 1].entries()) {
      const goal = i ? left : right;
      const rest = v(side * 0.235, 0.86, 0.065 + Math.sin(phase + i * Math.PI) * stride * 0.23);
      arms[i].solve(goal ? torso.worldToLocal(goal.clone()) : rest, goal ? grasp : 0, !!stance);
      if (stance) legs[i].plant(hip, stance.ankles[i]);
      else legs[i].walk(phase + i * Math.PI, stride);
    }
  }
  pose();
  return {
    root,
    pose,
    head,
    leftHand: arms[1].hand,
    rightHand: arms[0].hand,
  };
}

const reachSeconds = 3.42;
const holdSeconds = 0.48;
export const pickupDuration = 2 * reachSeconds + holdSeconds;
export const captureAt = 0.5;
export const lensPosition = [2.44, 3.18, 0.87];

export function stageShoppers(scene, heroes) {
  const people = { beans: makeShopper(scene, 0), ranch: makeShopper(scene, 1) };
  const grips = Object.fromEntries(
    Object.entries(people).map(([key, p]) => [key, shelfHand(p.rightHand, key)]),
  );
  const supportHand = shelfHand(people.beans.leftHand, 'support');
  const sideGrip = orientation(v(1, 0, 0), v(0, 0, -1));
  const underGrip = orientation(up, v(0, 0, -1));
  const restRight = orientation(v(-1, 0, 0), v(0, -1, 0.1));
  const restLeft = orientation(v(1, 0, 0), v(0, -1, 0.1));

  function pickup(key, item, time) {
    const shopper = people[key],
      root = shopper.root;
    const home = heroes[key].userData.shelfPosition,
      base = item.userData.shelfPosition;
    const beans = key === 'beans';
    // For a second facing of the same product, step along the shelf before reaching.
    const dx = base.x - home.x;
    const steps = Math.ceil(Math.abs(dx) / 0.34);
    const walkPart = steps ? Math.min(0.34, 0.1 + 0.07 * steps) : 0;
    const elapsed = time * pickupDuration;
    const outward = T.MathUtils.clamp(Math.min(elapsed, pickupDuration - elapsed) / reachSeconds, 0, 1);
    const walk = walkPart ? step(outward, 0, walkPart) : 1;
    const t = T.MathUtils.clamp((outward - walkPart) / (1 - walkPart), 0, 1);
    const approach = step(t, 0.055, 0.43);
    const closeHand = step(t, 0.405, 0.515);
    const clear = step(t, 0.52, 0.76);
    const carry = step(t, 0.68, 1);
    const shift = step(t, 0.025, 0.4) * (1 - step(t, 0.55, 0.94));
    const support = beans ? step(t, 0.68, 0.975) : 0;

    root.rotation.y = beans ? 2.81 : 2.91;
    const anchor = v(home.x - (beans ? 0.21 : 0.15), 0, beans ? -2.015 : -2.045);
    // The planted shoe has zero world velocity while the other foot crosses the aisle tiles.
    const ankles = [-1, 1].map((side) => {
      const tick = walk * steps,
        stepIndex = Math.min(Math.floor(tick), Math.max(0, steps - 1));
      const swing = T.MathUtils.clamp((tick - stepIndex) * 2 - (side * dx > 0 ? 0 : 1), 0, 1);
      const progress = steps ? (stepIndex + smooth(swing)) / steps : 1;
      const stride = v(
        dx * (progress - walk),
        steps ? 0.045 * Math.sin(Math.PI * swing) : 0,
        0,
      ).applyQuaternion(root.quaternion.clone().invert());
      return v(side * 0.132, 0.085, side < 0 ? 0.091 : -0.089).add(stride);
    });
    root.position.copy(anchor).add(v(dx * walk, 0, 0));
    root.updateMatrixWorld();
    const world = (point) => root.localToWorld(point);
    const hip = v(-0.01 - 0.017 * shift, 0.846 - 0.016 * shift, 0.018 + 0.024 * shift);

    item.position.copy(base);
    item.position.z += 0.218 * clear + 0.111 * carry;
    item.position.x -= (beans ? 0.052 : 0.032) * carry;
    item.position.y += 0.025 * step(t, 0.515, 0.61) - (beans ? 0.235 : 0.197) * carry;
    item.rotation.set(-0.06 * carry, (beans ? 0.36 : 0.19) * carry, -0.035 * carry);
    item.updateMatrixWorld();
    const wrist = item.localToWorld(v(beans ? 0.157 : 0.137, beans ? 0.223 : 0.271, 0.135));
    const rest = world(v(-0.22, 0.815, 0.079));
    const right = new T.CubicBezierCurve3(
      rest,
      world(v(-0.25, 1.035, 0.15)),
      wrist.clone().add(v(0.025, -0.062, 0.106)),
      wrist,
    ).getPoint(approach);
    const leftRest = world(v(0.22, 0.815, 0.072));
    const under = item.localToWorld(v(-0.049, -0.028, 0.108));
    const left = new T.CubicBezierCurve3(
      leftRest,
      world(v(0.229, 0.926, 0.16)),
      under.clone().add(v(-0.034, -0.075, 0.072)),
      under,
    ).getPoint(support);
    shopper.pose({
      stance: { hip, ankles, twist: -0.075 * shift },
      lean: 0.025 + 0.072 * shift,
      left,
      right,
    });
    // Direct the gaze before the wrist moves, then follow the package down.
    const sight = root.worldToLocal(item.localToWorld(v(0, 0.26, 0)));
    const attention = 0.35 + 0.65 * step(t, 0, 0.25);
    shopper.head.rotation.set(
      0.055 + attention * Math.atan2(1.66 - sight.y, Math.max(0.31, sight.z)) * 0.77,
      attention * Math.atan2(sight.x, Math.max(0.3, sight.z)) * 0.83,
      0.018 * shift,
    );
    grips[key](
      root.quaternion
        .clone()
        .multiply(restRight)
        .slerp(item.quaternion.clone().multiply(sideGrip), approach),
      closeHand,
    );
    if (beans)
      supportHand(
        root.quaternion
          .clone()
          .multiply(restLeft)
          .slerp(item.quaternion.clone().multiply(underGrip), support),
        support,
      );
    return item.localToWorld(v(0, 0.23, 0.04));
  }
  function reset(key, item) {
    item.position.copy(item.userData.shelfPosition);
    item.rotation.set(0, 0, 0);
    pickup(key, heroes[key], 0);
  }
  for (const [key, item] of Object.entries(heroes)) reset(key, item);
  function cameraView(cam, item, amount) {
    const center = item.localToWorld(v(0, 0.23, 0.06));
    cam.position.fromArray(lensPosition);
    cam.lookAt(center);
    cam.fov = mix(43, 6.5, smooth(amount));
    cam.updateProjectionMatrix();
  }
  return { people, reset, pickup, cameraView };
}
