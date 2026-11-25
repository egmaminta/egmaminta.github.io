// Articulated fingers for the shelf pickup and the receipt close-up.
import * as T from './three-r180/three.module.min.js';

const vec = (x, y, z) => new T.Vector3(x, y, z);
const up = vec(0, 1, 0);
export function orientation(normal, top = up) {
  return new T.Quaternion().setFromRotationMatrix(
    new T.Matrix4().lookAt(normal, vec(0, 0, 0), top),
  );
}

export function handRig(original) {
  const skin = original.children[0].material;
  // Give the wrist a continuous taper into the palm in the close shots.
  const hand = new T.Group();
  original.children.forEach((part) => (part.visible = false));
  original.add(hand);
  const sphere = new T.SphereGeometry(1, 24, 16);
  function soft(radii, material = skin) {
    const m = new T.Mesh(sphere, material);
    m.scale.copy(radii);
    m.castShadow = true;
    hand.add(m);
    return m;
  }
  const rings = [
    [-0.018, -0.001, 0.015, 0.014],
    [-0.008, 0, 0.022, 0.018],
    [0.003, 0.001, 0.0255, 0.02],
    [0.018, 0.004, 0.028, 0.0185],
    [0.037, 0.01, 0.037, 0.019],
    [0.053, 0.013, 0.039, 0.02],
    [0.067, 0.014, 0.037, 0.017],
    [0.077, 0.014, 0.032, 0.013],
    [0.084, 0.014, 0.021, 0.009],
    [0.086, 0.014, 0.001, 0.001],
  ];
  const palmGeometry = new T.LatheGeometry(
    rings.map(([y, , rx]) => new T.Vector2(rx, y)),
    32,
  );
  const points = palmGeometry.attributes.position;
  for (let i = 0; i < points.count; i++) {
    const [, cx, rx, rz] = rings[i % rings.length];
    points.setXYZ(i, points.getX(i) + cx, points.getY(i), (points.getZ(i) * rz) / rx - 0.002);
  }
  palmGeometry.computeVertexNormals();
  const palm = new T.Mesh(palmGeometry, skin);
  palm.castShadow = true;
  hand.add(palm);
  const nailMaterial = new T.MeshStandardMaterial({ color: '#c79579', roughness: 0.58 });
  function finger(radii, nailNormal = null) {
    const joints = radii.map((r) => soft(vec(r, r, r)));
    const bones = radii.slice(1).map((next, i) => {
      const mesh = new T.Mesh(new T.CylinderGeometry(next, radii[i], 1, 20), skin);
      mesh.castShadow = true;
      hand.add(mesh);
      return mesh;
    });
    const tipRadius = radii[radii.length - 1];
    const nail =
      nailNormal && soft(vec(tipRadius * 0.67, tipRadius * 0.89, tipRadius * 0.14), nailMaterial);
    return (path) => {
      path.forEach((point, i) => joints[i].position.copy(point));
      bones.forEach((bone, i) => {
        const ray = path[i + 1].clone().sub(path[i]);
        bone.position.copy(path[i]).lerp(path[i + 1], 0.5);
        bone.scale.y = ray.length();
        bone.quaternion.setFromUnitVectors(up, ray.normalize());
      });
      if (nail) {
        const last = path.length - 1;
        const tangent = path[last]
          .clone()
          .sub(path[last - 1])
          .normalize();
        const normal = nailNormal
          .clone()
          .addScaledVector(tangent, -nailNormal.dot(tangent))
          .normalize();
        nail.position
          .copy(path[last])
          .addScaledVector(tangent, -tipRadius * 0.35)
          .addScaledVector(normal, tipRadius * 0.94);
        nail.quaternion.copy(orientation(normal, tangent));
      }
    };
  }
  function turn(worldRotation) {
    hand.quaternion
      .copy(original.getWorldQuaternion(new T.Quaternion()).invert())
      .multiply(worldRotation);
  }
  return { finger, turn };
}

// In palm coordinates the fingers extend along +Y. The approach leaves room for
// the thumb; it closes over the near face only once the wrist reaches the package.
export function shelfHand(original, kind) {
  const { finger, turn } = handRig(original);
  const support = kind === 'support';
  const bottle = kind === 'ranch';
  const digits = [0, 1, 2, 3].map((index) => {
    const x = -0.009 + 0.015 * index;
    const base = 0.075 - Math.abs(index - 1) * 0.002;
    const length = [0.065, 0.071, 0.066, 0.053][index];
    const spread = (index - 1.5) * 0.0055;
    const open = [
      vec(x, base, 0),
      vec(x + spread * 0.45, base + length * 0.45, 0.005),
      vec(x + spread * 0.8, base + length * 0.78, 0.005),
      vec(x + spread, base + length, 0.002),
    ];
    const closed = support
      ? [
          open[0],
          vec(x, base + length * 0.45, 0.007),
          vec(x, base + length * 0.78, 0.012),
          vec(x, base + length, 0.016),
        ]
      : [
          open[0],
          vec(x, base + length * 0.44, -0.009),
          vec(x, base + length * 0.79, bottle ? -0.029 : -0.015),
          vec(x, base + length * (bottle ? 0.9 : 1), bottle ? -0.044 : -0.025),
        ];
    return { open, closed, draw: finger([0.0084, 0.0075, 0.0067, 0.0057]) };
  });
  const thumb = finger([0.011, 0.0098, 0.0084, 0.007]);
  const thumbOpen = [
    vec(-0.012, 0.031, 0),
    vec(-0.03, 0.048, 0.006),
    vec(-0.041, 0.06, 0.013),
    vec(-0.046, 0.068, 0.019),
  ];
  const thumbClosed = support
    ? [
        thumbOpen[0],
        vec(-0.027, 0.043, 0.006),
        vec(-0.041, 0.057, 0.011),
        vec(-0.047, 0.068, 0.016),
      ]
    : [
        thumbOpen[0],
        vec(-0.033, 0.037, -0.013),
        vec(-0.044, 0.032, -0.035),
        vec(-0.044, bottle ? 0.043 : 0.03, -0.056),
      ];
  return (rotation, closed) => {
    turn(rotation);
    for (const digit of digits)
      digit.draw(digit.open.map((p, i) => p.clone().lerp(digit.closed[i], closed)));
    thumb(thumbOpen.map((p, i) => p.clone().lerp(thumbClosed[i], closed)));
  };
}
