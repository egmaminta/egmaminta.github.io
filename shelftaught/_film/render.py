"""Render the project explainer. First run narration.py. Pass its work directory to this script."""

import argparse
import json
import subprocess
from concurrent.futures import ProcessPoolExecutor
from functools import partial
from pathlib import Path
from urllib.request import urlopen

from art import ASSETS, Drawing, clamp
from fontTools.ttLib import TTFont
from PIL import Image
from scenes import SCENES

FPS = 30
WIDTH, HEIGHT = 1920, 1080
FACES = {
    "regular": "Regular",
    "medium": "Medium",
    "semibold": "Semibold",
    "bold": "Bold",
    "italic": "RegularItalic",
}


def fonts_at(work):
    for name, suffix in FACES.items():
        target = work / (name + ".ttf")
        if not target.is_file():
            woff = work / (name + ".woff2")
            if not woff.is_file():
                with urlopen(
                    "https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-" + suffix + ".woff2",
                    timeout=30,
                ) as r:
                    woff.write_bytes(r.read())
            with TTFont(woff) as face:
                face.flavor = None
                face.save(target)
        with TTFont(target) as face:
            assert face["name"].getDebugName(6) == "OpenAISans-" + suffix


def draw(drawing, index, scene, time):
    drawing.clean()
    SCENES[index](drawing, scene, time)
    fade = 1
    if index > 0:
        fade = min(fade, clamp((time - scene["start"]) / 0.18))
    if index + 1 < len(SCENES):
        fade = min(fade, clamp((scene["end"] - time) / 0.18))
    if fade < 1:
        drawing.white_overlay(0, 0, 1280, 720, 1 - fade)


def stills(work, timeline):
    d = Drawing(work)
    for index, scene in enumerate(timeline):
        for j, line in enumerate(scene["lines"]):
            time = line["start"] + 0.76 * (line["end"] - line["start"])
            draw(d, index, scene, time)
            im = Image.fromarray(d.surface.makeImageSnapshot().toarray())
            im.thumbnail((800, 450))
            im.save(work / f"proof-{index:02d}-{j}.jpg", quality=93)
    draw(d, 0, timeline[0], 0)
    poster = Image.fromarray(d.surface.makeImageSnapshot().toarray())
    poster.save(ASSETS / "explainer-poster.webp", quality=95, method=6)
    thumbnail = poster.copy()
    thumbnail.thumbnail((1200, 630), Image.Resampling.LANCZOS)
    preview = Image.new("L", (1200, 630), 255)
    preview.paste(thumbnail, ((1200 - thumbnail.width) // 2, (630 - thumbnail.height) // 2))
    preview.save(ASSETS / "preview.jpg", quality=95)


def encode(index, work, timeline):
    d = Drawing(work)
    scene = timeline[index]
    first, last = round(scene["start"] * FPS), round(scene["end"] * FPS)
    path = work / f"part-{index:02d}.mp4"
    args = [
        "ffmpeg",
        "-nostdin",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "gray",
        "-s",
        f"{WIDTH}x{HEIGHT}",
        "-framerate",
        str(FPS),
        "-i",
        "pipe:0",
        "-an",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-preset",
        "veryfast",
        "-crf",
        "18",
        "-threads",
        "2",
        "-g",
        str(2 * FPS),
        "-video_track_timescale",
        "90000",
        str(path),
    ]
    proc = subprocess.Popen(args, stdin=subprocess.PIPE)
    try:
        for k in range(first, last):
            draw(d, index, scene, k / FPS)
            proc.stdin.write(memoryview(d.surface.makeImageSnapshot().toarray()))
    finally:
        proc.stdin.close()
    if proc.wait():
        raise RuntimeError("Encoding failed for " + scene["title"])
    print(f"Encoded {index + 1:02d}  {scene['title']}", flush=True)


def assemble(work, timeline):
    concat = work / "chapters.txt"
    concat.write_text("".join(f"file 'part-{i:02d}.mp4'\n" for i in range(len(SCENES))))
    meta = work / "chapters.ffmeta"

    def ms(time):
        return round(round(time * FPS) * 1000 / FPS)

    meta.write_text(
        ";FFMETADATA1\n"
        + "".join(
            f"[CHAPTER]\nTIMEBASE=1/1000\nSTART={ms(s['start'])}\nEND={ms(s['end'])}\ntitle={s['title']}\n"
            for s in timeline
        )
    )
    output = ASSETS / "shelftaught-explainer.mp4"
    subprocess.run(
        [
            "ffmpeg",
            "-nostdin",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat),
            "-i",
            str(work / "narration.wav"),
            "-i",
            str(meta),
            "-map",
            "0:v",
            "-map",
            "1:a",
            "-map_chapters",
            "2",
            "-c:v",
            "copy",
            "-af",
            "loudnorm=I=-16:TP=-1.5:LRA=9",
            "-ar",
            "48000",
            "-c:a",
            "aac",
            "-b:a",
            "112k",
            "-movflags",
            "+faststart",
            "-metadata",
            "title=" + timeline[0]["title"],
            "-metadata",
            "artist=Emmanuel G. Maminta and Rowel O. Atienza",
            "-metadata",
            "comment=4th Physical Retail AI Workshop (PRAW), WACV 2027. Set in OpenAI Sans.",
            "-t",
            f"{round(timeline[-1]['end'] * FPS) / FPS:.6f}",
            str(output),
        ],
        check=True,
    )
    print(f"{output.name}: {output.stat().st_size:,} bytes", flush=True)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--work", required=True, type=Path)
    p.add_argument("--parts-only", action="store_true", help="Encode chapters without joining them")
    p.add_argument(
        "--proof", action="store_true", help="Render the poster and representative frames only"
    )
    p.add_argument(
        "--chapters", nargs="*", type=int, help="Re-encode only these zero-based chapter indices"
    )
    args = p.parse_args()
    work = args.work.resolve()
    timeline = json.loads((work / "timeline.json").read_text())
    assert len(timeline) == len(SCENES)
    fonts_at(work)
    stills(work, timeline)
    if not args.proof:
        indices = list(range(len(SCENES))) if args.chapters is None else args.chapters
        with ProcessPoolExecutor(max_workers=5) as pool:
            list(pool.map(partial(encode, work=work, timeline=timeline), indices))
        if not args.parts_only:
            assemble(work, timeline)
