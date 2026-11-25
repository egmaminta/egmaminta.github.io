"""A guided reading of Figure 1. The view and annotations use PDF page coordinates."""

from functools import lru_cache

import pymupdf
import skia
from art import AMBER, ASSETS, BLUE, TEAL, clamp, lerp, ramp

FIGURE = (55, 69, 552, 312)
SCREEN = (50, 117, 1180, 548)
LOCATOR = (1046, 12, 174, 86)

# Each cue belongs to a spoken passage. Zooms preserve the printed arrows and
# return through the whole figure when crossing from training to a new test frame.
VIEWS = [
    (0, 0, FIGURE),
    (1, 0, (57, 203, 222, 307)),
    (1, 0.31, (214, 201, 378, 264)),
    (1, 0.63, (214, 248, 378, 309)),
    (2, 0, (379, 201, 534, 311)),
    (3, 0, (429, 225, 526, 298)),
    (3, 0.74, (365, 159, 532, 248)),
    (4, 0, (55, 69, 249, 194)),
    (4, 0.42, (126, 69, 247, 195)),
    (5, 0, (229, 68, 426, 195)),
    (5, 0.29, (262, 69, 422, 194)),
    (5, 0.59, (270, 121, 499, 194)),
    (5, 0.82, FIGURE),
]


@lru_cache(maxsize=1)
def artwork():
    # Rasterize the vector diagram once per worker at the closest shot's resolution.
    with pymupdf.open(ASSETS / "shelftaught.pdf") as paper:
        page = paper[1]
        if "Fast thinker" not in page.get_textbox(pymupdf.Rect(FIGURE)):
            raise ValueError("The Figure 1 crop no longer matches page 2 of the paper")
        pixels = page.get_pixmap(
            matrix=pymupdf.Matrix(9, 9), clip=pymupdf.Rect(FIGURE), alpha=False
        )
        return skia.Image.MakeFromEncoded(pixels.tobytes("png"))


def camera(rect):
    w, h = SCREEN[2:]
    x0, y0, x1, y1 = rect
    scale = min(w / (x1 - x0), h / (y1 - y0))
    return (x0 + x1) / 2, (y0 + y1) / 2, scale


def render_figure(d, cx, cy, scale, viewport):
    x, y, w, h = viewport
    d.c.translate(x + w / 2 - scale * cx, y + h / 2 - scale * cy)
    d.c.scale(scale, scale)
    d.c.drawImageRect(
        artwork(),
        skia.Rect.MakeLTRB(*FIGURE),
        skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kNone),
    )


def pipeline(d, scene, t):
    lines = scene["lines"]
    j = max((i for i, line in enumerate(lines) if line["start"] <= t), default=0)
    line = lines[j]
    q = clamp((t - line["start"]) / (line["end"] - line["start"]))
    view = camera(FIGURE)
    for i, fraction, region in VIEWS[1:]:
        cue = lines[i]["start"] + fraction * (lines[i]["end"] - lines[i]["start"])
        if t < cue:
            break
        dest = camera(region)
        view = tuple(lerp(a, b, ramp(t, cue, 0.95)) for a, b in zip(view, dest))
    cx, cy, scale = view
    d.text(51, 40, "Figure 1", 33, "medium")
    d.c.save()
    d.c.clipRect(skia.Rect.MakeXYWH(*SCREEN))
    render_figure(d, cx, cy, scale, SCREEN)

    def isolate(rect, opacity):
        x0, y0, x1, y1 = rect
        l, top, r, bottom = FIGURE
        for x, y, w, h in [
            (l, top, r - l, y0 - top),
            (l, y1, r - l, bottom - y1),
            (l, y0, x0 - l, y1 - y0),
            (x1, y0, r - x1, y1 - y0),
        ]:
            d.white_overlay(x, y, w, h, opacity)

    # Annotations stay registered to the paper as the camera moves. Their stroke
    # width is specified in video pixels so that a zoom never covers a symbol.
    def trace(path, start, duration, ink=TEAL):
        d.line(path, ink, 3.1 / scale, ramp(q, start, duration))

    def rim(x, y, radius, start, ink):
        amount = ramp(q, start, 0.085)
        if amount:
            d.circle(x, y, radius + (1 - amount) * 1.4, None, ink, amount * 3.0 / scale)

    if j == 0:
        top = ramp(q, 0.24, 0.10)
        bottom = ramp(q, 0.55, 0.13)
        d.white_overlay(55, 204, 497, 107, 0.68 * top * (1 - bottom))
        d.white_overlay(55, 69, 497, 124, 0.68 * bottom)
        trace([(60, 72), (57, 72), (57, 192), (60, 192)], 0.24, 0.17, BLUE)
        trace([(60, 204), (57, 204), (57, 309), (60, 309)], 0.55, 0.17)
    elif j == 1:
        isolate((58, 204, 369, 308), 0.78 * ramp(q, 0, 0.12))
        trace([(120, 257.4), (130, 257.4)], 0.035, 0.16)
        trace(
            [(211.2, 257.4), (220.4, 257.4), (220.4, 232.3), (231.3, 232.3)], 0.27, 0.17
        )
        trace(
            [(211.2, 257.4), (220.4, 257.4), (220.4, 280.8), (231.3, 280.8)], 0.60, 0.22
        )
    elif j == 2:
        isolate((385, 209, 528, 304), 0.86 * ramp(q, 0, 0.12))
        for x, y, start in [
            (400.7, 232.5, 0.19),
            (400.7, 280.7, 0.23),
            (400.7, 256.5, 0.33),
            (436.5, 286.7, 0.41),
        ]:
            rim(x, y, 8.4, start, BLUE)
        rim(436.5, 256.5, 10.5, 0.58, TEAL)
    elif j == 3:
        trace([(470, 243.2), (506.5, 243.2)], 0.15, 0.22, AMBER)
        trace([(474.8, 270.1), (481.4, 270.1)], 0.38, 0.12)
        trace(
            [(488.4, 210.8), (488.4, 198.4), (405.4, 198.4), (405.4, 193)], 0.78, 0.19
        )
    elif j == 4:
        isolate((58, 70, 242, 194), 0.78 * ramp(q, 0, 0.10))
        trace([(117, 131.4), (131.8, 131.4)], 0.026, 0.13, BLUE)
        trace([(143.5, 128.5), (229, 128.5)], 0.33, 0.13, AMBER)
        trace([(146, 189.1), (227, 189.1)], 0.58, 0.18, BLUE)
    else:
        trace([(240.8, 131.4), (265.4, 131.4)], 0.01, 0.13, BLUE)
        trace([(271.4, 155.5), (299.1, 155.5)], 0.33, 0.12)
        trace([(315.1, 178.2), (384.5, 178.2)], 0.55, 0.16)
        trace([(417.8, 131.4), (445.2, 131.4)], 0.71, 0.10)
        d.white_overlay(55, 204, 497, 107, 0.71 * ramp(q, 0.85, 0.10))
    d.c.restore()

    if j == 2:
        for start, end, label in [
            (0.15, 0.34, "Teacher answers  p₁, p₂"),
            (0.34, 0.42, "Retrieval scores  s"),
            (0.42, 0.60, "Frame embedding  f"),
            (0.60, 1.0, "Unknown product  y"),
        ]:
            if start <= q < end:
                d.text(
                    640,
                    48,
                    label,
                    23,
                    "medium",
                    BLUE if start < 0.6 else TEAL,
                    "center",
                )
                break

    # The small complete figure keeps the current detail in context.
    locator_alpha = clamp(abs(scale - camera(FIGURE)[2]) / 0.65)
    if locator_alpha:
        x, y, w, h = LOCATOR
        map_scale = min(w / (FIGURE[2] - FIGURE[0]), h / (FIGURE[3] - FIGURE[1]))
        d.c.save()
        d.c.clipRect(skia.Rect.MakeXYWH(*LOCATOR))
        render_figure(
            d,
            (FIGURE[0] + FIGURE[2]) / 2,
            (FIGURE[1] + FIGURE[3]) / 2,
            map_scale,
            LOCATOR,
        )
        ww, hh = SCREEN[2] / scale, SCREEN[3] / scale
        left, top = max(FIGURE[0], cx - ww / 2), max(FIGURE[1], cy - hh / 2)
        right, bottom = min(FIGURE[2], cx + ww / 2), min(FIGURE[3], cy + hh / 2)
        d.rect(
            left + 1,
            top + 1,
            right - left - 2,
            bottom - top - 2,
            None,
            TEAL,
            2 / map_scale,
        )
        d.c.restore()
        d.white_overlay(x, y, w, h, 1 - locator_alpha)
