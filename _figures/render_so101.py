"""Render a programmed SO-101 joint-motion demonstration from Menagerie.

Run with Python packages mujoco, numpy, and Pillow installed.
Pass the Menagerie checkout and an output directory as positional arguments.
"""
import argparse
from pathlib import Path
import json
import numpy as np
import mujoco
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('menagerie', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
model = mujoco.MjModel.from_xml_path(str(args.menagerie / 'robotstudio_so101/scene.xml'))
data = mujoco.MjData(model)
width, height, fps, seconds = 720, 450, 20, 8
model.vis.global_.offwidth = width
model.vis.global_.offheight = height
camera = mujoco.MjvCamera()
mujoco.mjv_defaultCamera(camera)
camera.lookat[:] = [0.15, 0, 0.16]
camera.distance = 0.60
camera.azimuth = 90
camera.elevation = -18

def target(t):
    phase = 2 * np.pi * t / seconds
    return np.array([
        -0.5 * np.cos(phase),
        0.08 * np.sin(phase),
        0.08 * (1 - np.cos(phase)),
        -0.08 * (1 - np.cos(phase)),
        0.12 * np.sin(phase),
        0.1 + 0.5 * (1 - np.cos(2 * phase)),
    ])

data.qpos[:] = target(0)
data.ctrl[:] = target(0)
mujoco.mj_forward(model, data)
# Start after a full cycle so the dynamics repeat across the GIF boundary.
steps_per_frame = round(1 / (fps * model.opt.timestep))
assert np.isclose(steps_per_frame * model.opt.timestep, 1 / fps)
for _ in range(round(seconds / model.opt.timestep)):
    data.ctrl[:] = target(data.time)
    mujoco.mj_step(model, data)
frames, states, controls = [], [], []
with mujoco.Renderer(model, height=height, width=width) as renderer:
    for frame in range(fps * seconds):
        renderer.update_scene(data, camera)
        frames.append(Image.fromarray(renderer.render()))
        states.append(data.qpos.copy())
        controls.append(data.ctrl.copy())
        for _ in range(steps_per_frame):
            data.ctrl[:] = target(data.time)
            mujoco.mj_step(model, data)
        assert np.isfinite(data.qpos).all()
        assert (data.ctrl >= model.actuator_ctrlrange[:, 0]).all()
        assert (data.ctrl <= model.actuator_ctrlrange[:, 1]).all()
frames[0].save(args.output / 'so101-motion-poster.png')
# A shared palette avoids frame-to-frame color flicker.
palette_samples = Image.new('RGB', (width, height * 8))
for i, frame in enumerate(frames[::20]):
    palette_samples.paste(frame, (0, i * height))
palette = palette_samples.quantize(colors=128)
indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
indexed[0].save(args.output / 'so101-motion.gif', save_all=True,
               append_images=indexed[1:], duration=1000 // fps, loop=0,
               optimize=True, disposal=1)
for i in (0, 20, 40, 60, 80, 100, 120, 140):
    frames[i].save(args.output / f'preview-{i:03}.png')
np.savez(args.output / 'motion-validation.npz', qpos=states, ctrl=controls)
metadata = {'model': 'robotstudio_so101/scene.xml', 'mujoco': mujoco.__version__,
            'frames': len(frames), 'fps': fps, 'seconds': seconds,
            'max_loop_joint_difference': float(np.abs(states[-1] - states[0]).max()),
            'gif_bytes': (args.output / 'so101-motion.gif').stat().st_size}
(args.output / 'render-metadata.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(json.dumps(metadata))
