// Progressive enhancements for Chapter 1. All explanations and observations
// remain in the HTML. These diagrams do not run MuJoCo or a physics model.
(() => {
  'use strict';
  const revealControls = (figure) => {
    figure.querySelectorAll('[data-interactive-only]').forEach((node) => { node.hidden = false; });
  };
  const degrees = (angle) => `${angle < 0 ? '−' : ''}${Math.abs(angle)}°`;

  const anatomy = document.getElementById('arm-anatomy');
  if (anatomy) {
    const buttons = [...anatomy.querySelectorAll('[data-joint]')];
    const markers = [...anatomy.querySelectorAll('[data-joint-mark]')];
    buttons.forEach((button) => {
      button.disabled = false;
      button.addEventListener('click', () => {
        buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        markers.forEach((marker) => marker.classList.toggle('is-selected', marker.dataset.jointMark === button.dataset.joint));
      });
    });
    revealControls(anatomy);
  }

  const chain = document.getElementById('local-world-figure');
  if (chain) {
    const shoulder = document.getElementById('shoulder-angle');
    const elbow = document.getElementById('elbow-angle');
    const get = (id) => document.getElementById(id);
    const origin = [220, 270];
    const point = (start, length, angle) => [start[0] + length * Math.cos(angle), start[1] - length * Math.sin(angle)];
    const pair = (p) => p.map((n) => n.toFixed(3)).join(' ');
    const moveCircle = (id, p) => { get(id).setAttribute('cx', p[0]); get(id).setAttribute('cy', p[1]); };
    const update = () => {
      const a = Number(shoulder.value);
      const b = Number(elbow.value);
      const q1 = a * Math.PI / 180;
      const q2 = b * Math.PI / 180;
      const joint = point(origin, 100, q1);
      const tip = point(joint, 80, q1 + q2);
      get('chain-links').setAttribute('d', `M${pair(origin)}L${pair(joint)}L${pair(tip)}`);
      get('chain-extension').setAttribute('d', `M${pair(joint)}L${pair(point(joint, 40, q1))}`);
      get('chain-direction').setAttribute('d', `M${pair(tip)}L${pair(point(tip, 30, q1 + q2))}`);
      get('chain-shoulder-arc').setAttribute('d', `M256 270A36 36 0 0 0 ${pair(point(origin, 36, q1))}`);
      get('chain-elbow-arc').setAttribute('d', `M${pair(point(joint, 28, q1))}A28 28 0 0 ${b < 0 ? 1 : 0} ${pair(point(joint, 28, q1 + q2))}`);
      moveCircle('chain-elbow', joint);
      moveCircle('chain-tip', tip);
      get('shoulder-value').textContent = degrees(a);
      get('elbow-value').textContent = degrees(b);
      shoulder.setAttribute('aria-valuetext', `${a} degrees`);
      elbow.setAttribute('aria-valuetext', `${b} degrees relative to the upper link`);
      const x = ((tip[0] - origin[0]) / 100).toFixed(2);
      const y = ((origin[1] - tip[1]) / 100).toFixed(2);
      get('chain-position').textContent = `(${x}, ${y})`;
      get('chain-orientation').textContent = degrees(a + b);
      get('chain-desc').textContent = `Planar two-link arm: shoulder ${a} degrees; relative elbow ${b} degrees. Tool position (${x}, ${y}) in arbitrary world units; tool direction ${a + b} degrees from the positive x axis.`;
    };
    shoulder.addEventListener('input', update);
    elbow.addEventListener('input', update);
    get('chain-reset').addEventListener('click', () => { shoulder.value = '60'; elbow.value = '-45'; update(); });
    update();
    revealControls(chain);
  }

  const snapshots = document.getElementById('target-snapshots');
  if (snapshots) {
    // Approximate observations transcribed from the October 17–18 lesson notes.
    // No interpolated samples or unrecorded trajectory are generated.
    const observations = [
      { time: '0 s', angle: 0, label: '0 rad', velocity: '0 rad/s', explanation: 'The target is set, but no physics step has run. The actual angle is still zero.' },
      { time: '0.005 s', angle: -0.00152, label: '≈ −0.00152 rad', velocity: '≈ −0.304 rad/s', explanation: 'After one physics step, the angle has changed only slightly. The nonzero velocity shows that movement has begun; the target is still −1.3 rad.' },
      { time: '≈ 1 s', angle: -1.3, label: '≈ −1.3 rad', velocity: '≈ −9.04 × 10⁻⁸ rad/s', explanation: 'At the final snapshot, the angle is near the target and velocity is near zero. These snapshots do not establish whether overshoot occurred between observations.' }
    ];
    const buttons = [...snapshots.querySelectorAll('[data-snapshot]')];
    const get = (id) => document.getElementById(id);
    buttons.forEach((button) => button.addEventListener('click', () => {
      const sample = observations[Number(button.dataset.snapshot)];
      const x = 160 + 100 * Math.cos(sample.angle);
      const y = 140 - 100 * Math.sin(sample.angle);
      get('snapshot-actual').setAttribute('d', `M160 140L${x} ${y}`);
      get('snapshot-tip').setAttribute('cx', x);
      get('snapshot-tip').setAttribute('cy', y);
      get('snapshot-time').textContent = sample.time;
      get('snapshot-angle').textContent = sample.label;
      get('snapshot-velocity').textContent = sample.velocity;
      get('snapshot-explanation').textContent = sample.explanation;
      get('snapshot-desc').textContent = `Simulation time ${sample.time}. Target −1.3 rad; actual ${sample.label}; angular velocity ${sample.velocity}. Dashed amber is the target; solid blue is actual.`;
      buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    }));
    revealControls(snapshots);
  }
})();
