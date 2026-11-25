"""Synchronize WebVTT captions, chapter marks and the accessible HTML transcript with the recorded narration."""

import argparse
import html
import json
import re
import textwrap
import wave
from math import floor
from pathlib import Path

import numpy as np
from narration import PRONUNCIATION, checkout_sounds

PAGE = Path(__file__).resolve().parents[1]
MEDIA = "./assets/shelftaught-explainer.mp4?v=3"


def stamp(value):
    ms = round(value * 1000)
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def chunks(text):
    sentences = re.split(r"(?<=[.!?])\s+", text)
    for sentence in sentences:
        words = sentence.split()
        while len(" ".join(words)) > 75:
            candidates = [i for i in range(1, len(words)) if 27 <= len(" ".join(words[:i])) <= 75]
            if not candidates:
                break
            punct = [i for i in candidates if words[i - 1].endswith((",", ";", "—", ":"))]
            clauses = [
                i
                for i in candidates
                if words[i].lower()
                in {"with", "when", "and", "that", "so", "which", "while", "as", "from"}
            ]
            i = (punct or clauses or candidates)[-1]
            yield " ".join(words[:i])
            words = words[i:]
        if words:
            yield " ".join(words)


def spoken_weight(text):
    for written, spoken in PRONUNCIATION.items():
        text = text.replace(written, spoken)
    return sum(1 for c in text if c.isalpha()) + 0.65 * text.count(" ")


def emphasize_packages(text):
    value = html.escape(text)
    return re.sub(r"\b(a|A|the|The|one|One) (can|box|bag)\b", r"\1 <em>\2</em>", value)


def write(work):
    scenes = json.loads((work / "timeline.json").read_text())
    sounds = checkout_sounds(scenes)
    with wave.open(str(work / "narration.wav")) as wav:
        sr = wav.getframerate()
        a = np.frombuffer(wav.readframes(wav.getnframes()), dtype="<i2").astype(float) / 32768
    hop = round(sr * 0.015)
    rms = np.sqrt(np.mean(a[: len(a) // hop * hop].reshape(-1, hop) ** 2, axis=1))
    smoothed = np.convolve(rms, np.ones(6) / 6, mode="same")
    caps = ["WEBVTT", ""]
    chap = ["WEBVTT", ""]
    items = []
    for chapter in scenes:
        start, end = chapter["start"], chapter["end"]
        end = min(end, round(scenes[-1]["end"] * 30) / 30)
        chap.extend([stamp(start) + " --> " + stamp(end), chapter["title"], ""])
        text = []
        for line in chapter["lines"]:
            text.append(emphasize_packages(line["text"]))
            parts = list(chunks(line["text"]))
            weights = np.cumsum([spoken_weight(p) for p in parts])
            t0, t1 = line["start"], line["end"]
            boundaries = [t0]
            for w in weights[:-1]:
                ideal = t0 + (t1 - t0) * w / weights[-1]
                lo = floor(max(boundaries[-1] + 0.28, ideal - 0.40) * sr / hop)
                hi = floor(min(t1 - 0.24, ideal + 0.40) * sr / hop)
                if hi > lo:
                    times = np.arange(lo, hi) * hop / sr
                    choice = np.argmin(smoothed[lo:hi] + 0.026 * np.abs(times - ideal))
                    boundaries.append(times[choice])
                else:
                    boundaries.append(ideal)
            boundaries.append(t1)
            for p, begin, finish in zip(parts, boundaries, boundaries[1:]):
                assert begin < finish
                sound = next((name for name, time in sounds.items() if begin <= time < finish), None)
                if sound:
                    p = f"[{sound}] {p}"
                caps.extend(
                    [
                        stamp(begin) + " --> " + stamp(finish),
                        "\n".join(textwrap.wrap(p, 40, break_long_words=False, break_on_hyphens=False)),
                        "",
                    ]
                )
        clock = f"{int(start) // 60}:{int(start) % 60:02d}"
        items.append(
            f'          <li><a href="{MEDIA}" data-seek="{start:.3f}">{clock}</a><div><strong>{html.escape(chapter["title"])}</strong><p>{" ".join(text)}</p></div></li>'
        )
    for name, lines in [("shelftaught.en.vtt", caps), ("shelftaught.chapters.vtt", chap)]:
        (PAGE / "assets" / name).write_text("\n".join(lines).rstrip() + "\n")
    path = PAGE / "index.html"
    source = path.read_text()
    section = source.index('class="film-transcript prose"')
    a = source.index("<ol>", section) + 4
    b = source.index("</ol>", a)
    source = source[:a] + "\n" + "\n".join(items) + "\n        " + source[b:]
    path.write_text(source)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--work", required=True, type=Path)
    write(parser.parse_args().work)
