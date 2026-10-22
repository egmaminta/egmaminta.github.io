# /// script
# dependencies = ["matplotlib", "numpy", "fonttools", "brotli"]
# ///
"""Plot the frozen Chapter 1 trajectory without running the experiment."""
from pathlib import Path
import json
import tempfile

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
import numpy as np
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
results = root / 'assets/data/robotics/chapter-1'
summary = json.loads((results / 'summary.json').read_text())
data = np.genfromtxt(results / 'shoulder-pan-trajectory.csv', delimiter=',', names=True)
t = data['simulation_time_s']
angle = data['joint_angle_rad']
target = data['target_angle_rad']
velocity = data['angular_velocity_rad_s']
settling = summary['angle_settling_time_s']
tolerance = summary['tolerance_rad']

with tempfile.TemporaryDirectory() as temp:
    font = TTFont(root / 'assets/fonts/inter-latin.woff2')
    font.flavor = None
    font_path = Path(temp) / 'Inter.ttf'
    font.save(font_path)
    font_manager.fontManager.addfont(font_path)
    plt.rcParams.update({'font.family': 'Inter', 'font.size': 10,
                         'axes.titlesize': 11, 'axes.labelsize': 10,
                         'svg.fonttype': 'path', 'axes.unicode_minus': True})
    fig, (angle_ax, velocity_ax) = plt.subplots(2, 1, figsize=(9, 6.5), sharex=True,
                                               layout='constrained')
    blue, amber, gray = '#00356b', '#9a5600', '#596779'
    angle_ax.axhspan(summary['lower_bound_rad'], summary['upper_bound_rad'],
                    color=blue, alpha=.12, label='Angle tolerance')
    angle_ax.plot(t, angle, color=blue, linewidth=2, label='Joint angle')
    angle_ax.plot(t, target, color=amber, linewidth=1.6, linestyle='--', label='Target')
    angle_ax.set_title('Joint angle', loc='left')
    angle_ax.set_ylabel('Angle (rad)')
    angle_ax.legend(loc='lower right', bbox_to_anchor=(1, 1.02), ncol=3,
                    frameon=False, fontsize=9)
    velocity_ax.plot(t, velocity, color=blue, linewidth=2)
    velocity_ax.axhline(0, color=gray, linewidth=.8)
    velocity_ax.set_title('Angular velocity', loc='left')
    velocity_ax.set_ylabel('Angular velocity (rad/s)')
    velocity_ax.set_xlabel('Simulation time (s)')
    velocity_ax.annotate(f'Angle criterion met at {settling:.3f} s',
                         xy=(settling, summary['velocity_at_angle_settling_rad_s']),
                         xytext=(.88, 1.8), color=blue, fontsize=10,
                         arrowprops={'arrowstyle': '-', 'color': blue, 'lw': .9})
    inset = angle_ax.inset_axes([.51, .43, .46, .48])
    inset.axhspan(-tolerance, tolerance, color=blue, alpha=.12)
    inset.axhline(0, color=amber, linewidth=1, linestyle='--')
    inset.plot(t, target-angle, color=blue, linewidth=1.4)
    inset.axvline(settling, color=gray, linestyle=':', linewidth=1.2)
    inset.set_xlim(.45, .75)
    inset.set_ylim(-.045, .045)
    inset.set_xticks([.45, .60, .75])
    inset.set_yticks([-.03, 0, .03])
    inset.set_title('Angle error near settling', loc='left', fontsize=9)
    inset.set_xlabel('Time (s)', fontsize=8)
    inset.set_ylabel('Error (rad)', fontsize=8)
    inset.tick_params(labelsize=8)
    for ax in (angle_ax, velocity_ax, inset):
        ax.set_axisbelow(True)
        ax.grid(True, color='#e2e8f0', linewidth=.65)
        ax.spines[['top', 'right']].set_visible(False)
        ax.spines[['bottom', 'left']].set_color('#94a3b8')
        ax.tick_params(colors='#334155')
    for ax in (angle_ax, velocity_ax):
        ax.axvline(settling, color=gray, linestyle=':', linewidth=1.2)
        ax.set_xlim(0, summary['recorded_duration_s'])
    dest = root / 'assets/img/robotics'
    svg_path = dest / 'shoulder-pan-response.svg'
    fig.savefig(svg_path, metadata={'Date': None})
    svg_path.write_text('\n'.join(line.rstrip() for line in svg_path.read_text().splitlines()) + '\n')
    fig.savefig(dest / 'shoulder-pan-response.png', dpi=180)
    plt.close(fig)
print('Plotted the recorded shoulder-pan response')
