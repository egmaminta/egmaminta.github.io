// Interactive illustrations for Chapter 1. Explanations remain in the HTML.
// Geometry is calculated for teaching. These diagrams do not run MuJoCo.
(() => {
  'use strict';
  const revealControls = (figure) => {
    figure.querySelectorAll('[data-interactive-only]').forEach((node) => { node.hidden = false; });
  };
  const degrees = (angle) => `${angle < 0 ? '−' : ''}${Math.abs(angle)}°`;

  const motion = document.getElementById('so101-motion');
  if (motion) {
    const picture = document.getElementById('so101-animation');
    const button = document.getElementById('so101-motion-toggle');
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let playing = false;
    const setPlaying = (value) => {
      playing = value;
      picture.src = playing ? picture.dataset.motionSrc : picture.dataset.stillSrc;
      picture.alt = playing
        ? 'The SO-101 arm turns at its shoulder while its gripper opens and closes in MuJoCo.'
        : 'The SO-101 arm in MuJoCo with its gripper open.';
      button.textContent = playing ? 'Stop animation' : 'Play animation';
      button.setAttribute('aria-pressed', String(playing));
    };
    button.addEventListener('click', () => setPlaying(!playing));
    preference.addEventListener('change', (event) => {
      if (event.matches) setPlaying(false);
    });
    setPlaying(!preference.matches);
    revealControls(motion);
  }

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
      get('chain-gripper').setAttribute('transform', `translate(${pair(tip)}) rotate(${-a - b})`);
      get('chain-direction').setAttribute('d', `M${pair(tip)}L${pair(point(tip, 40, q1 + q2))}`);
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
      get('chain-desc').textContent = `An arm with an open gripper. Shoulder angle ${a} degrees. Relative elbow angle ${b} degrees. The blue dot marks where the gripper attaches to the forearm at (${x}, ${y}) in arbitrary units. Gripper direction ${a + b} degrees from the positive x axis. The jaw opening stays fixed.`;
    };
    shoulder.addEventListener('input', update);
    elbow.addEventListener('input', update);
    get('chain-reset').addEventListener('click', () => { shoulder.value = '60'; elbow.value = '-45'; update(); });
    update();
    revealControls(chain);
  }

  const command = document.getElementById('paused-command-figure');
  if (command) {
    // Drawing coordinates for alternative requests while the joint stays fixed.
    const targets = {
      below: { x: 190.495, y: 249.846, labelX: 207, labelY: 259 },
      above: { x: 258.727, y: 83, labelX: 270, labelY: 80 }
    };
    const buttons = [...command.querySelectorAll('[data-command]')];
    const get = (id) => document.getElementById(id);
    buttons.forEach((button) => button.addEventListener('click', () => {
      const direction = button.dataset.command;
      const target = targets[direction];
      get('command-target').setAttribute('d', `M160 140L${target.x} ${target.y}`);
      get('command-target-label').setAttribute('x', target.labelX);
      get('command-target-label').setAttribute('y', target.labelY);
      get('command-request').textContent = `Turn ${direction} the starting direction`;
      get('command-desc').textContent = `The amber target points ${direction} the blue joint direction. The joint stays at its starting angle while physics is paused.`;
      buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    }));
    revealControls(command);
  }
})();
