"""Drawing primitives for the film. All layout uses a 1280 by 720 frame."""

import math
from functools import lru_cache
from pathlib import Path

import numpy as np
import skia
from PIL import Image

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent / "assets"
INK, MID, SUB, RULE, PALE, WHITE = 21, 72, 91, 183, 231, 255


TEAL, AMBER, BLUE = (25, 111, 93), (166, 78, 37), (48, 103, 148)


def clamp(v, low=0, high=1):
    return min(high, max(low, v))


def ease(v):
    v = clamp(v)
    return v * v * (3 - 2 * v)


def lerp(a, b, t):
    return a + (b - a) * t


def ramp(time, start, duration=0.85):
    return ease((time - start) / duration)


def color(grey, alpha=255):
    rgb = grey if isinstance(grey, tuple) else (grey,) * 3
    return skia.ColorSetARGB(round(alpha), *(round(clamp(v, 0, 255)) for v in rgb))


@lru_cache(300)
def paint(grey, width=0, alpha=255):
    p = skia.Paint(Color=color(grey, alpha), AntiAlias=True)
    if width:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(width)
        p.setStrokeCap(skia.Paint.kRound_Cap)
        p.setStrokeJoin(skia.Paint.kRound_Join)
    return p


@lru_cache(48)
def photograph(name):
    path = ASSETS / (name + ".webp")
    if not path.is_file():
        path = HERE / (name + ".webp")
    with Image.open(path) as source:
        arr = np.array(source.convert("RGBA"))
    return skia.Image.fromarray(
        arr,
        colorType=skia.ColorType.kRGBA_8888_ColorType,
        alphaType=skia.AlphaType.kOpaque_AlphaType,
        copy=True,
    )


class Drawing:
    def __init__(self, fonts, width=1920, height=1080):
        self.width, self.height = width, height
        info = skia.ImageInfo.Make(
            width, height, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kOpaque_AlphaType
        )
        self.frames = {}
        self.work = fonts
        self.pixels = np.empty((height, width, 4), dtype=np.uint8)
        self.surface = skia.Surface.MakeRasterDirect(info, self.pixels, self.pixels.strides[0])
        self.c = self.surface.getCanvas()
        self.c.scale(width / 1280, height / 720)
        self.faces = {
            face: skia.Typeface.MakeFromFile(str(fonts / (face + ".ttf")))
            for face in ("regular", "medium", "semibold", "bold", "italic")
        }
        if not all(f and f.getFamilyName().startswith("OpenAI Sans") for f in self.faces.values()):
            raise ValueError("The OpenAI Sans font faces must be present")
        self.fonts = {}

    def clean(self):
        self.c.clear(skia.ColorWHITE)

    def text(self, x, y, value, size=27, face="regular", grey=INK, anchor="left", maxw=None):
        key = (face, round(size, 2))
        if key not in self.fonts:
            f = skia.Font(self.faces[face], size)
            f.setSubpixel(True)
            f.setEdging(skia.Font.Edging.kAntiAlias)
            self.fonts[key] = f
        font = self.fonts[key]
        width = font.measureText(value)
        if maxw and width > maxw + 0.1:
            return self.text(x, y, value, size * maxw / width, face, grey, anchor)
        if anchor == "right":
            x -= width
        if anchor == "center":
            x -= width / 2
        self.c.drawString(value, x, y + size * 0.82, font, paint(grey))
        return width

    def line(self, pts, grey=INK, w=2, amount=1):
        if len(pts) < 2 or amount <= 0:
            return
        p = skia.Path()
        p.moveTo(*pts[0])
        for point in pts[1:]:
            p.lineTo(*point)
        if amount < 1:
            m = skia.PathMeasure(p, False)
            part = skia.Path()
            m.getSegment(0, amount * m.getLength(), part, True)
            p = part
        self.c.drawPath(p, paint(grey, w))

    def shape(self, pts, fill=WHITE, stroke=INK, w=2):
        p = skia.Path()
        p.moveTo(*pts[0])
        for point in pts[1:]:
            p.lineTo(*point)
        p.close()
        if fill is not None:
            self.c.drawPath(p, paint(fill))
        if stroke is not None:
            self.c.drawPath(p, paint(stroke, w))

    def rect(self, x, y, w, h, fill=WHITE, stroke=None, sw=1.5):
        r = skia.Rect.MakeXYWH(x, y, w, h)
        if fill is not None:
            self.c.drawRect(r, paint(fill))
        if stroke is not None:
            self.c.drawRect(r, paint(stroke, sw))

    def white_overlay(self, x, y, width, height, opacity):
        self.c.drawRect(
            skia.Rect.MakeXYWH(x, y, width, height), paint(WHITE, 0, round(255 * clamp(opacity)))
        )

    def circle(self, x, y, r, fill=INK, stroke=None, sw=2):
        if r <= 0:
            return
        if fill is not None:
            self.c.drawCircle(x, y, r, paint(fill))
        if stroke is not None:
            self.c.drawCircle(x, y, r, paint(stroke, sw))

    def oval(self, x, y, w, h, fill=WHITE, stroke=INK, sw=2):
        r = skia.Rect.MakeXYWH(x, y, w, h)
        if fill is not None:
            self.c.drawOval(r, paint(fill))
        if stroke is not None:
            self.c.drawOval(r, paint(stroke, sw))

    def arrow(self, a, b, grey=INK, amount=1, w=2):
        if amount <= 0:
            return
        xx, yy = lerp(a[0], b[0], amount), lerp(a[1], b[1], amount)
        self.line([a, (xx, yy)], grey, w)
        angle = math.atan2(b[1] - a[1], b[0] - a[0])
        if amount > 0.15:
            self.line(
                [
                    (xx - 10 * math.cos(angle - 0.48), yy - 10 * math.sin(angle - 0.48)),
                    (xx, yy),
                    (xx - 10 * math.cos(angle + 0.48), yy - 10 * math.sin(angle + 0.48)),
                ],
                grey,
                w,
            )

    def dash(self, a, b, grey=RULE, w=1.8):
        length = math.dist(a, b)
        if length == 0:
            return
        for step in range(0, math.ceil(length), 13):
            self.line(
                [
                    (lerp(a[0], b[0], step / length), lerp(a[1], b[1], step / length)),
                    (
                        lerp(a[0], b[0], min(1, (step + 6) / length)),
                        lerp(a[1], b[1], min(1, (step + 6) / length)),
                    ),
                ],
                grey,
                w,
            )

    def image(self, name, x, y, w, h, crop=False, zoom=1):
        im = photograph(name)
        iw, ih = im.width(), im.height()
        if crop:
            ratio = w / h
            sh = min(ih, iw / ratio) / zoom
            sw = ratio * sh
            src = skia.Rect.MakeXYWH((iw - sw) / 2, (ih - sh) / 2, sw, sh)
            dst = skia.Rect.MakeXYWH(x, y, w, h)
        else:
            k = min(w / iw, h / ih)
            dw, dh = iw * k, ih * k
            src = skia.Rect.MakeWH(iw, ih)
            dst = skia.Rect.MakeXYWH(x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
        self.c.drawImageRect(
            im, src, dst, skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kNone)
        )

    def film_shot(self, name, progress, x=0, y=0, w=1280, h=720):
        if name not in self.frames:
            path = self.work / (name + ".rgba")
            self.frames[name] = np.memmap(path, mode="r", dtype=np.uint8).reshape(-1, 720, 1280, 4)
        frames = self.frames[name]
        frame = frames[round((len(frames) - 1) * clamp(progress))]
        im = skia.Image.fromarray(
            frame,
            colorType=skia.ColorType.kRGBA_8888_ColorType,
            alphaType=skia.AlphaType.kOpaque_AlphaType,
            copy=False,
        )
        dst = skia.Rect.MakeXYWH(x, y, w, h)
        self.c.drawImageRect(im, dst, skia.SamplingOptions(skia.FilterMode.kLinear))

    def product(self, kind, x, y, scale=1, grey=INK):
        """Illustrated packaging, with physical edges and print on the front face."""
        c = self.c
        c.save()
        c.translate(x, y)
        c.scale(scale, scale)
        if kind == "box":
            self.shape([(0, 19), (27, 0), (118, 8), (96, 27)], (248, 235, 201), grey, 2.3)
            self.shape([(96, 27), (118, 8), (119, 156), (96, 177)], (214, 189, 140), grey, 2.3)
            self.shape([(0, 19), (96, 27), (96, 177), (0, 166)], (248, 242, 219), grey, 2.5)
            self.line([(5, 27), (93, 35)], grey, 1.4)
            self.line([(27, 3), (58, 20), (112, 10)], grey, 1.4)
            self.rect(27, 43, 38, 21, grey)
            self.text(46, 46, "365", 15, "semibold", WHITE, "center")
            self.text(47, 75, "Garbanzo", 15, "semibold", grey, "center")
            self.text(47, 94, "Beans", 19, "semibold", TEAL, "center")
            for a, b in [(33, 130), (48, 123), (60, 137)]:
                self.oval(a - 7, b - 5, 14, 9, (199, 157, 91), grey, 1.3)
            self.line([(5, 151), (92, 161)], TEAL, 5)
        else:
            self.rect(0, 15, 94, 116, 244)
            self.oval(0, 115, 94, 29, 244, grey, 2.3)
            self.rect(1.4, 19, 91, 108, 244)
            self.line([(0, 15), (0, 129)], grey, 2.3)
            self.line([(94, 15), (94, 129)], grey, 2.3)
            self.oval(0, 0, 94, 30, 248, grey, 2.5)
            self.oval(7, 5, 80, 18, None, grey, 1.15)
            self.oval(39, 10, 14, 6, None, grey, 1.3)
            self.rect(30, 39, 35, 19, grey)
            self.text(47, 41, "365", 14, "semibold", WHITE, "center")
            self.text(47, 66, "Garbanzo", 15, "semibold", grey, "center")
            self.text(47, 85, "Beans", 18, "semibold", AMBER, "center")
            self.line([(4, 113), (26, 118), (66, 118), (91, 112)], grey, 1.4)
        c.restore()

    def receipt(self, x, y, width, entry, complete=False, quantity=True):
        """A receipt with a single line item, without an invented price."""
        h = 216
        pts = [(x, y), (x + width, y), (x + width, y + h)]
        n = round(width / 16)
        for i in range(1, n + 1):
            pts.append((x + width - i * width / n, y + h - (6 if i % 2 else 0)))
        pts.append((x, y))
        self.shape(pts, 251, INK, 1.8)
        self.text(x + 22, y + 22, "Virtual cart", 26, "medium")
        self.text(x + 22, y + 80, "365 Organic", 23)
        self.text(x + 22, y + 111, "Garbanzo Beans", 25, "medium", maxw=width - 68)
        self.text(x + 22, y + 154, entry, 28, "italic", grey=INK)
        if quantity:
            self.text(x + width - 23, y + 157, "× 1", 22, grey=MID, anchor="right")
        if complete:
            self.line(
                [(x + width - 50, y + 30), (x + width - 43, y + 37), (x + width - 30, y + 20)], INK, 2.5
            )
