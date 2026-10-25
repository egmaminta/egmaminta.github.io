# /// script
# dependencies = ["matplotlib", "numpy", "fonttools", "brotli"]
# ///
"""Draw the article figures from saved PyTorch measurements."""
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
OUTPUT.mkdir(parents=True, exist_ok=True)
examples = json.loads((DATA / "examples.json").read_text())
rows = json.loads((DATA / "margin-sweep.json").read_text())
blue, amber, gray = "#00356b", "#9a5600", "#596779"
font_source = ROOT / "assets/fonts/inter-latin.woff2"


def save(fig, stem):
    svg_path = OUTPUT / f"{stem}.svg"
    fig.savefig(svg_path, metadata={"Date": None})
    fig.savefig(OUTPUT / f"{stem}.png", dpi=160)
    # Preserve selectable SVG labels and bundle the font for standalone viewing.
    svg = svg_path.read_text()
    font_data = base64.b64encode(font_source.read_bytes()).decode()
    font_css = f"@font-face {{font-family: Inter; src: url(data:font/woff2;base64,{font_data}) format('woff2');}}"
    svg = svg.replace('<style type="text/css">', '<style type="text/css">' + font_css, 1)
    svg = re.sub(r"[ \t]+$", "", svg, flags=re.MULTILINE)
    svg_path.write_text(svg)
    plt.close(fig)


with tempfile.TemporaryDirectory() as temp:
    font = TTFont(font_source)
    font.flavor = None
    font_path = Path(temp) / "Inter.ttf"
    font.save(font_path)
    font_manager.fontManager.addfont(font_path)
    plt.rcParams.update({"font.family": "Inter", "font.size": 11,
                         "axes.titlesize": 12, "axes.labelsize": 11,
                         "svg.fonttype": "none", "svg.hashsalt": "softmax-article",
                         "axes.spines.top": False, "axes.spines.right": False,
                         "text.color": "#1c2937", "axes.labelcolor": "#334155",
                         "xtick.color": gray, "ytick.color": gray})

    margin = np.array([r["margin"] for r in rows])
    standard = np.abs([r["standard_gradient"][0] for r in rows])
    fixed = np.abs([r["reformulated_gradient"][0] for r in rows])
    reference = np.abs([r["reference_target_gradient"] for r in rows])
    for mobile in (False, True):
        fig, (ax, zeros) = plt.subplots(2, 1, figsize=(4.2, 5.8) if mobile else (8.4, 5.3), sharex=True,
                                        gridspec_kw={"height_ratios": [4.1, 1]}, layout="constrained")
        ax.plot(margin, fixed, color=blue, lw=2, label="Reformulated")
        ax.plot(margin, np.where(standard > 0, standard, np.nan),
                color=amber, lw=1.8, ls="--", label="Standard PyTorch")
        ax.plot(margin[::12], reference[::12], color=gray, marker="x", ms=5,
                ls="none", label="High-precision reference")
        ax.set_yscale("log")
        ax.set_ylim(1e-14, 2)
        ax.set_xlim(0, 30)
        ax.set_ylabel("Target-gradient magnitude")
        ax.set_title("Target gradients" if mobile else "A confident prediction loses its target gradient",
                     loc="left", pad=74 if mobile else 36)
        ax.legend(loc="lower left", bbox_to_anchor=(0, 1.01), ncol=1 if mobile else 3, frameon=False, fontsize=9)
        ax.grid(axis="y", color="#e4e9ef", lw=.7)
        cliff = examples["sweep"]["first_zero_target_gradient"]
        ax.axvline(cliff, color=amber, lw=1, ls=":")
        ax.annotate("Standard returns zero\nat a sampled gap\nof 16.75" if mobile else
                    "Standard returns zero\nfrom the sampled gap of 16.75",
                    xy=(cliff, 6e-8), xytext=(12, 2e-2) if mobile else (18.5, 2e-3),
                    color=amber, fontsize=9 if mobile else 10,
                    arrowprops={"arrowstyle": "-", "color": amber, "lw": .8})
        ax.tick_params(axis="x", labelbottom=False)
        zeros.scatter(margin[standard == 0], np.ones(np.sum(standard == 0)),
                       marker="|", s=70, color=amber)
        zeros.text(15, 0, "No zero results", color=blue, fontsize=10, va="center", ha="center")
        zeros.set_yticks([1, 0], ["Standard", "Reformulated"])
        zeros.set_ylim(-.6, 1.6)
        zeros.set_title("Exactly zero target gradients", loc="left", fontsize=10, pad=8)
        zeros.set_xlabel("Score gap" if mobile else
                         "Score gap between the correct product and its competitor")
        zeros.spines["left"].set_visible(False)
        zeros.tick_params(axis="y", length=0, labelsize=9 if mobile else 11)
        save(fig, "target-gradient-mobile" if mobile else "target-gradient")

        fig, axes = plt.subplots(2 if mobile else 1, 1 if mobile else 2,
                                 figsize=(4.2, 6.8) if mobile else (8.4, 4.4), sharex=True, sharey=True,
                                 layout="constrained")
        for ax, key, title in zip(axes, ("equal", "near"),
                                  ("Student equals teacher", "Student is close to teacher")):
            record = examples[key]
            positions = np.arange(3)
            ax.axvline(0, color="#b8c3ce", lw=1)
            for method, color, offset, marker, label in (
                    ("standard", amber, -.16, "s", "Standard PyTorch"),
                    ("reformulated", blue, .16, "o", "Reformulated")):
                values = np.array(record[method]["gradient"]) * 1e8
                ax.hlines(positions+offset, 0, values, color=color, lw=2)
                ax.scatter(values, positions+offset, color=color, marker=marker, s=30, label=label)
            ref = np.array([float(g) for g in record["reference"]["gradient"]]) * 1e8
            ax.scatter(ref, positions+.16, color="#111827", marker="x", s=20,
                       linewidths=1, zorder=4, label="Reference")
            ax.set_title(title, loc="left", fontsize=11, pad=16)
            ax.set_yticks(positions, ["Product A", "Product B", "Product C"])
            ax.set_xlim(-7, 7)
            ax.set_xticks([-6, -3, 0, 3, 6])
            ax.grid(axis="x", color="#edf0f4", lw=.7)
            ax.set_axisbelow(True)
            ax.spines["left"].set_visible(False)
            ax.tick_params(axis="y", length=0)
        axes[0].invert_yaxis()
        axes[0].set_ylim(2.6, -.65)
        axes[1].tick_params(axis="y", labelleft=mobile)
        fig.supxlabel("Gradient for each product score\n" + r"($\times 10^{-8}$)" if mobile else
                      r"Gradient with respect to each product score  ($\times 10^{-8}$)", fontsize=11)
        handles, labels = axes[0].get_legend_handles_labels()
        fig.legend(handles, labels, loc="outside upper center", ncol=2 if mobile else 3, frameon=False, fontsize=9 if mobile else 10)
        save(fig, "teacher-gradient-mobile" if mobile else "teacher-gradient")
