# /// script
# dependencies = ["matplotlib", "numpy", "fonttools", "brotli"]
# ///
"""Plot a measured two-bias slice of the toy classifier's cross-entropy."""
import base64
import json
from pathlib import Path
import re
import tempfile

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
import numpy as np
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets/data/softmax"
OUTPUT = ROOT / "assets/img/softmax"
record = json.loads((DATA / "classifier.json").read_text())
grid = np.genfromtxt(DATA / "loss-slice.csv", delimiter=",", names=True)
size = record["grid"]["points_per_axis"]
a = grid["bias_a"].reshape(size, size)
b = grid["bias_b"].reshape(size, size)
loss = grid["cross_entropy"].reshape(size, size)
trajectory = record["trajectory"]
path_a = np.array([point["bias_a"] for point in trajectory])
path_b = np.array([point["bias_b"] for point in trajectory])
path_loss = np.array([point["loss"] for point in trajectory])
blue, amber, gray = "#00356b", "#9a5600", "#596779"
font_source = ROOT / "assets/fonts/inter-latin.woff2"


def save(fig, name):
    svg_path = OUTPUT / f"{name}.svg"
    fig.savefig(svg_path, metadata={"Date": None})
    fig.savefig(OUTPUT / f"{name}.png", dpi=160)
    data = base64.b64encode(font_source.read_bytes()).decode()
    style = f"@font-face {{font-family: Inter; src: url(data:font/woff2;base64,{data}) format('woff2');}}"
    svg = svg_path.read_text().replace('<style type="text/css">', '<style type="text/css">' + style, 1)
    svg_path.write_text(re.sub(r"[ \t]+$", "", svg, flags=re.MULTILINE))
    plt.close(fig)


with tempfile.TemporaryDirectory() as temp:
    font = TTFont(font_source)
    font.flavor = None
    font_path = Path(temp) / "Inter.ttf"
    font.save(font_path)
    font_manager.fontManager.addfont(font_path)
    plt.rcParams.update({"font.family": "Inter", "font.size": 10,
                         "svg.fonttype": "none", "svg.hashsalt": "classifier-loss-slice",
                         "axes.labelcolor": "#334155", "text.color": "#334155",
                         "xtick.color": gray, "ytick.color": gray})
    for mobile in (False, True):
        fig = plt.figure(figsize=(4.2, 8.4) if mobile else (8.4, 4.8), layout="constrained")
        layout = fig.add_gridspec(2, 1) if mobile else fig.add_gridspec(1, 2)
        surface = fig.add_subplot(layout[0], projection="3d")
        contour = fig.add_subplot(layout[1])
        surface.plot_surface(a, b, loss, cmap="viridis", alpha=.9, rcount=size, ccount=size,
                              linewidth=0, antialiased=True)
        surface.plot(path_a, path_b, path_loss, color="#b75c00", lw=3, zorder=5)
        surface.scatter([0], [0], [record["loss"]], color=blue, s=25, depthshade=False)
        surface.set_xlabel("Bias added to A", labelpad=6)
        surface.set_ylabel("Bias added to B", labelpad=6)
        surface.set_zlabel("Cross-entropy", labelpad=3)
        surface.set_xticks([-2, 0, 2])
        surface.set_yticks([-2, 0, 2])
        surface.set_zticks([0, 1, 2])
        surface.view_init(elev=27, azim=-125)
        surface.set_box_aspect((1, 1, .75), zoom=.83)
        surface.set_title("Loss over two output biases", loc="left", pad=0, fontsize=11)
        for axis in (surface.xaxis, surface.yaxis, surface.zaxis):
            axis.pane.fill = False

        levels = [.02, .05, record["loss"], .3, .7, 1.5]
        lines = contour.contour(a, b, loss, levels=levels,
                                colors="#bac8d5", linewidths=1)
        label_x = [1.4, 1.5, 1.5, .3, -1.2, -1.7]
        label_positions = [(x, x + 2 + np.log(np.expm1(level)))
                           for x, level in zip(label_x, levels)]
        contour.clabel(lines, inline=True, fontsize=8, fmt="%.2g", colors=gray,
                        manual=label_positions)
        contour.plot(path_a, path_b, color=amber, lw=2, marker=".", markersize=5)
        contour.scatter([0], [0], color=blue, s=35, zorder=3)
        contour.scatter([path_a[-1]], [path_b[-1]], color=amber, marker="s", s=35, zorder=3)
        contour.annotate("Start", xy=(0, 0), xytext=(-1.55, -.15), color=blue,
                         arrowprops={"arrowstyle": "-", "color": blue})
        contour.annotate(f'After {record["bias_updates"]} updates', xy=(path_a[-1], path_b[-1]),
                         xytext=(-1.55, -1.55), color=amber,
                         arrowprops={"arrowstyle": "-", "color": amber})
        contour.set_xlabel("Bias added to product A")
        contour.set_ylabel("Bias added to product B")
        contour.set_xlim(-2, 2)
        contour.set_ylim(-2, 2)
        contour.set_aspect("equal")
        contour.set_xticks([-2, -1, 0, 1, 2])
        contour.set_yticks([-2, -1, 0, 1, 2])
        contour.spines[["top", "right"]].set_visible(False)
        contour.set_title("The same loss viewed from above", loc="left", pad=14, fontsize=11)
        save(fig, "loss-landscape-mobile" if mobile else "loss-landscape")
