"""Film the deterministic 3D sequences. Serve the repository's site root over HTTP first."""

import argparse
import base64
import json
import os
import subprocess
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent


def capture(args):
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            executable_path=os.environ.get("CHROMIUM"),
            args=[
                "--use-gl=angle",
                "--use-angle=swiftshader",
                "--enable-unsafe-swiftshader",
            ],
        )
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        if args.fonts:

            def local_font(route):
                weight = "semibold" if "Semibold" in route.request.url else "regular"
                route.fulfill(
                    path=args.fonts / (weight + ".woff2"),
                    content_type="font/woff2",
                    headers={"Access-Control-Allow-Origin": "*"},
                )

            page.route("https://cdn.openai.com/common/fonts/**", local_font)
        page.goto(args.url)
        page.wait_for_function("typeof window.frameAt === 'function'")

        def frame(shot, time):
            data = page.evaluate(
                """([shot,t]) => {
                window.frameAt(shot,t);
                return document.querySelector('canvas').toDataURL('image/jpeg',.965).split(',')[1];
            }""",
                [shot, time],
            )
            return base64.b64decode(data)

        if args.proof:
            for shot, positions in {
                "pickup": [0.12, 0.30, 0.40, 0.46, 0.50, 0.56, 0.62, 0.70, 0.86, 1],
                "exit": [
                    0.08,
                    0.30,
                    0.38,
                    0.405,
                    0.43,
                    0.455,
                    0.485,
                    0.52,
                    0.55,
                    0.59,
                    0.64,
                    0.672,
                    0.70,
                    0.74,
                    0.94,
                ],
            }.items():
                if args.shot and shot != args.shot:
                    continue
                for t in positions:
                    (args.proof / f"{shot}-{round(100 * t):02d}.jpg").write_bytes(frame(shot, t))
            browser.close()
            return

        import io

        if args.shot in (None, "pickup"):
            Image.open(io.BytesIO(frame("poster", 0))).save(
                HERE.parent / "assets/checkout-aisle.webp", quality=92
            )
        exit_seconds = json.loads((HERE / "exit-cues.json").read_text())["seconds"]
        for shot, seconds, fps, file in [
            ("pickup", 9, 30, "shelf-pickup.mp4"),
            ("exit", exit_seconds, 30, "store-exit.mp4"),
        ]:
            if args.shot and shot != args.shot:
                continue
            encoder = subprocess.Popen(
                [
                    "ffmpeg",
                    "-loglevel",
                    "error",
                    "-y",
                    "-f",
                    "image2pipe",
                    "-framerate",
                    str(fps),
                    "-vcodec",
                    "mjpeg",
                    "-i",
                    "pipe:0",
                    "-an",
                    "-c:v",
                    "libx264",
                    "-crf",
                    "16",
                    "-preset",
                    "veryfast",
                    "-pix_fmt",
                    "yuv420p",
                    "-threads",
                    "2",
                    str(HERE / file),
                ],
                stdin=subprocess.PIPE,
            )
            try:
                for i in range(fps * seconds):
                    encoder.stdin.write(frame(shot, i / (fps * seconds - 1)))
            finally:
                encoder.stdin.close()
            if encoder.wait():
                raise RuntimeError(file)
            print(f"Filmed {file}", flush=True)
        browser.close()


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--url", default="http://127.0.0.1:8772/shelftaught/_film/camera.html")
    p.add_argument(
        "--fonts", type=Path, help="Optional directory of cached OpenAI Sans WOFF2 files"
    )
    p.add_argument("--proof", type=Path, help="Write representative frames for review")
    p.add_argument("--shot", choices=["pickup", "exit"], help="Film just this sequence")
    capture(p.parse_args())
