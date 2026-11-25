"""The paper's examples, animated in narration order using recorded model outputs."""

import json
import math

from art import (
    AMBER,
    ASSETS,
    BLUE,
    INK,
    MID,
    PALE,
    RULE,
    SUB,
    TEAL,
    WHITE,
    clamp,
    ease,
    lerp,
    ramp,
)

DATA = json.loads(
    (ASSETS.parent / "trace.js").read_text().split("const appleTrace = ", 1)[1].strip().rstrip(";")
)
PINK, GALA = DATA["cands"].index(2), DATA["cands"].index(4)


def segment(scene, time):
    lines = scene["lines"]
    index = 0
    for j, line in enumerate(lines):
        if time >= line["start"]:
            index = j
    line = lines[index]
    return index, clamp((time - line["start"]) / (line["end"] - line["start"]))


def title(d, scene, t):
    for j, line in enumerate(
        ["Thinking Fast and Slow", "for Label-Free Open-Catalog", "Product Retrieval"]
    ):
        d.text(67, 58 + j * 67, line, 60, "medium", maxw=830)
    d.text(69, 296, "Emmanuel G. Maminta     Rowel O. Atienza", 32, "medium", maxw=1000)
    d.text(69, 353, "Artificial Intelligence Graduate Program", 27)
    d.text(69, 393, "University of the Philippines, Diliman, Quezon City", 27)
    # The same two objects reappear at the first retrieval error.
    lift = 6 * math.sin(math.pi * clamp((t - scene["start"] - 2.1) / 5.5)) ** 2
    d.product("can", 1031, 154, 1.18)
    d.product("box", 895, 126 - lift, 1.33)
    d.text(68, 486, "4th Physical Retail AI Workshop (PRAW)", 28, "medium")
    d.text(
        68,
        527,
        "2027 IEEE/CVF Winter Conference on Applications of Computer Vision (WACV)",
        25,
        maxw=1120,
    )
    width = d.text(68, 577, "Oral Presentation", 27, "bold")
    d.line([(68, 604), (68 + width, 604)], INK, 2.3)


def focus_marks(d, u):
    if not 0.67 < u < 0.92:
        return
    tightening = ramp(u, 0.67, 0.19)
    w, h = lerp(256, 144, tightening), lerp(236, 181, tightening)
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = 640 + sx * w, 360 + sy * h
            pts = [(x - sx * 22, y), (x, y), (x, y - sy * 22)]
            d.line(pts, INK, 4.7)
            d.line(pts, WHITE if u < 0.845 else (137, 234, 164), 2.5)


def checkout(d, scene, t):
    j, q = segment(scene, t)
    if j == 0:
        u = clamp(q / 0.95)
        d.film_shot("shelf-pickup", u)
        focus_marks(d, u)
        if 0.88 <= u < 0.92:
            # Closing and reopening the shutter leaves the actual held pose on screen.
            blade = math.sin(math.pi * (u - 0.88) / 0.04) ** 2 * 360
            d.rect(0, 0, 1280, blade, INK)
            d.rect(0, 720 - blade, 1280, blade, INK)
    elif j == 1:
        d.film_shot("shelf-pickup", 1, 72, 176, 654, 368)
        d.arrow((736, 359), (818, 359), TEAL, ramp(q, 0.04, 0.32))
        d.receipt(839, 256, 343, "?", False, False)
    else:
        d.image("beans-frame", 88, 141, 369, 438)
        d.text(268, 110, "GroceryVision", 22, grey=MID, anchor="center")
        d.arrow((486, 355), (627, 355), TEAL, ramp(q, 0.05, 0.31))
        d.text(682, 175, "365 Organic", 34)
        d.text(682, 227, "Garbanzo Beans", 45, "medium")
        for i, (name, kind) in enumerate(
            [("beans-can", "can"), ("beans-box", "box"), ("beans-bag", "bag")]
        ):
            x = 648 + 167 * i
            d.image(name, x, 311, 150, 157)
            d.text(x + 75, 486, kind, 25, "italic", anchor="center")


def close_call(d, scene, t):
    j, q = segment(scene, t)
    if j == 0:
        d.image("beans-can", 171, 188, 331, 334)
        d.image("beans-box", 763, 180, 353, 347)
        d.text(337, 538, "can", 33, "italic", AMBER, "center")
        d.text(937, 538, "box", 33, "italic", TEAL, "center")
        d.text(638, 97, "365 Organic Garbanzo Beans", 38, "medium", anchor="center")
    else:
        d.image("beans-frame", 64, 172, 278, 355)
        d.text(202, 540, "Shopper’s box", 25, "italic", anchor="center")
        d.text(394, 178, "First pass", 30, "medium")
        d.text(765, 229, "Cosine similarity", 21, grey=SUB, anchor="right")
        for i, (label, score) in enumerate([("Can", "0.220"), ("Box", "0.218"), ("Bag", "0.184")]):
            progress = 1 if j == 2 else ramp(q, 0.20 + i * 0.07, 0.16)
            if not progress:
                continue
            y = 283 + i * 67
            ink = AMBER if i == 0 else INK
            d.text(394, y, str(i + 1), 23, grey=ink)
            d.text(438, y, label, 34, "italic", ink)
            d.text(767, y, score, 34, "medium", ink, "right")
        if j == 2 or q > 0.65:
            d.arrow((785, 337), (853, 337), AMBER, 1 if j == 2 else ramp(q, 0.65, 0.15))
            d.receipt(864, 236, 337, "can", False)


def insertion(d, scene, t):
    j, q = segment(scene, t)
    names = ["099482441647_3", "099482441647_21", "099482441647_75"]
    if j < 2:
        d.image("beans-box", 87, 225, 238, 268)
        d.text(204, 153, "Catalog", 30, "medium", anchor="center")
        d.text(210, 516, "Garbanzo beans, box", 23, "italic", anchor="center")
        d.text(846, 153, "Unlabeled store frames", 30, "medium", anchor="center")
        for i, name in enumerate(names):
            x = 476 + i * 235
            d.rect(x, 240, 221, 221, WHITE, PALE, 1.3)
            reveal = 0 if j == 0 else ramp(q, 0.03 + 0.18 * i, 0.23)
            if reveal:
                d.image(name, x + 1, 241, 219, 219, True)
                if reveal < 1:
                    d.white_overlay(x, 240, 221, 221, 1 - reveal)
        return
    # The two training paths differ in whose packages the training frames show.
    d.text(77, 195, "Seen-brand labels", 28, "medium")
    for i in range(3):
        x = 87 + i * 78
        d.rect(x, 255, 61, 76, (240, 244, 246), BLUE, 2)
        for row in range(3):
            d.line([(x + 12, 277 + 12 * row), (x + 49 - 4 * row, 277 + 12 * row)], BLUE, 2)
    d.arrow((365, 289), (494, 289), BLUE, ramp(q, 0.03, 0.17))
    d.text(527, 272, "Fine-tune image tower", 34, "medium", BLUE)
    if q > 0.24:
        d.text(77, 391, "New products", 28, "medium")
        for i, name in enumerate(names):
            d.image(name, 83 + 82 * i, 446, 74, 74, True)
        d.arrow((365, 482), (494, 482), TEAL, ramp(q, 0.28, 0.19))
        d.text(528, 466, "Infer labels", 32, "medium", TEAL)
        d.arrow((730, 484), (833, 484), TEAL, ramp(q, 0.59, 0.18))
        if q > 0.62:
            d.text(862, 466, "Train reranker", 32, "medium", TEAL)


def teacher(d, scene, t):
    j, q = segment(scene, t)
    d.image("apple-train", 67, 187, 316, 316)
    d.text(67, 526, "First retrieval choice", 22, grey=SUB)
    d.text(67, 554, "Pink Lady", 31, "medium")
    d.text(444, 184, "Teacher input", 23, grey=SUB)
    d.text(902, 184, "Royal Gala", 27, "medium", anchor="center")
    d.text(1115, 184, "Pink Lady", 27, "medium", anchor="center")
    d.line([(444, 225), (1205, 225)], RULE, 1.5)
    d.text(444, 251, "Candidate texts", 28, "medium")
    d.text(444, 292, "10 descriptions", 22, grey=SUB)
    d.text(903, 257, "86.5%", 39, "medium", AMBER, anchor="center")
    d.text(1116, 262, "3.8%", 31, anchor="center")
    if j > 0:
        c = 1 if j > 1 else ramp(q, 0.20, 0.30)
        d.line([(444, 347), (1205, 347)], RULE, 1.3, c)
        d.text(444, 373, "Texts and pictures", 27, "medium")
        for i, n in enumerate(["catalog-2", "catalog-4", "catalog-3", "catalog-0"]):
            d.image(n, 442 + i * 64, 421, 52, 48)
        if c > 0.45:
            d.text(903, 377, "81.0%", 39, "medium", AMBER, anchor="center")
            d.text(1116, 381, "5.9%", 31, anchor="center")
    if j == 2:
        d.line([(443, 499), (1205, 499)], RULE, 1.4)
        d.text(444, 524, "Majority vote", 23, grey=SUB)
        d.text(642, 518, "Royal Gala", 31)
        d.text(444, 568, "True variety", 23, grey=SUB)
        d.text(642, 562, "Pink Lady", 31, "semibold", TEAL)


def model(d, scene, t):
    j, q = segment(scene, t)
    if j == 0:
        d.image("apple-train", 73, 223, 227, 227)
        d.text(185, 475, "One unlabeled frame", 21, grey=SUB, anchor="center")
        for k, name in enumerate(["Retrieval scores", "Teacher answers", "Similar store frames"]):
            yy = 238 + 92 * k
            d.text(404, yy, name, 30, "medium")
            d.line(
                [(713, yy + 16), (754, yy + 16), (803, 340), (853, 340)],
                MID,
                1.7,
                ramp(q, 0.05 + k * 0.13, 0.37),
            )
        d.circle(949, 339, 74, WHITE, INK, 2.3)
        d.text(949, 301, "?", 68, "regular", anchor="center")
        d.text(949, 437, "Product label", 28, "medium", anchor="center")
        return
    d.text(71, 171, "Similarity to Royal Gala", 22, grey=SUB)
    x0, x1 = 125, 505
    y0, y1 = 484, 219

    def ax(v):
        return lerp(x0, x1, (v - 0.8) / 0.2)

    def ay(v):
        return lerp(y0, y1, (v - 0.8) / 0.2)

    for val in (0.8, 0.9, 1.0):
        d.line([(ax(val), y0), (ax(val), y1)], PALE, 1)
        d.line([(x0, ay(val)), (x1, ay(val))], PALE, 1)
        d.text(ax(val), y0 + 9, f"{val:.1f}", 17, grey=SUB, anchor="center")
        d.text(x0 - 12, ay(val) - 8, f"{val:.1f}", 17, grey=SUB, anchor="right")
    d.text(x1, 529, "Similarity to Pink Lady", 22, grey=SUB, anchor="right")
    if j == 1:
        u = 0
    elif q < 0.30:
        u = ease(q / 0.30)
    else:
        u = 1 + 14 * ease((q - 0.30) / 0.52)
    i = int(u)
    n = min(i + 1, 15)
    frac = u - i
    left, right = DATA["trace"][i], DATA["trace"][n]
    for k, (a, b) in enumerate(DATA["cloud"]):
        if j == 1 and k / 72 > q * 2 + 0.04:
            continue
        v = lerp(left["cloud"][k], right["cloud"][k], frac)
        d.circle(
            ax(a), ay(b), 4.3, tuple(lerp(a, b, (v + 1) / 2) for a, b in zip(AMBER, TEAL)), MID, 0.7
        )
    a, b = DATA["cloud"][DATA["point"]]
    d.circle(ax(a), ay(b), 10.5, None, INK, 2.5)
    d.line([(ax(a) + 9, ay(b) - 7), (ax(a) + 34, ay(b) - 33), (558, ay(b) - 33)], MID, 1.4)
    d.text(557, ay(b) - 62, "This frame", 19, grey=MID, anchor="right")
    d.text(639, 173, "Probability of Pink Lady", 30, "medium")
    px0, px1, py0, py1 = 688, 1182, 463, 244

    def xx(v):
        return lerp(px0, px1, v / 15)

    def yy(v):
        return lerp(py0, py1, v)

    for val in (0, 0.5, 1):
        d.line([(px0, yy(val)), (px1, yy(val))], PALE, 1)
        d.text(px0 - 9, yy(val) - 10, f"{val:.0%}", 17, grey=SUB, anchor="right")
    d.dash((px0, yy(0.9)), (px1, yy(0.9)), SUB, 1.3)
    d.text(px1, yy(0.9) + 7, "90% target threshold", 18, grey=SUB, anchor="right")
    for ix in (0, 5, 10, 15):
        d.text(xx(ix), py0 + 8, str(ix), 17, grey=SUB, anchor="center")
    values = [row["p"][PINK] for row in DATA["trace"]]
    p = lerp(values[i], values[n], frac)
    points = [(xx(h), yy(values[h])) for h in range(i + 1)] + [(xx(u), yy(p))]
    d.line(points, TEAL, 3.6)
    d.circle(*points[-1], 5.5, TEAL)
    d.text(640, 508, f"Update {round(u):02d} / 15", 23, grey=SUB)
    d.text(1190, 491, f"{p:.1%}", 45, "medium", anchor="right")


def patches(d, scene, t):
    j, q = segment(scene, t)
    x, y, size = 76, 181, 351
    d.image("apple-train", x, y, size, size)
    n = 24
    cell = size / n
    for k in range(1, n):
        d.line([(x + k * cell, y), (x + k * cell, y + size)], 196, 0.48)
        d.line([(x, y + k * cell), (x + size, y + k * cell)], 196, 0.48)
    ck = DATA["checkpoints"]["8"]["patch"][0]
    tokens = ck["tokens"]
    choices = [(12, 12), (5, 10), (14, 17), (17, 7), (10, 13)]
    stage = (0.12 + 0.88 * ease(q)) * 1.5 if j == 0 else 1.5 + 2.5 * ease(q)
    h = int(stage)
    nh = min(h + 1, 4)
    f = ease(stage - h)
    row = round(lerp(choices[h][0], choices[nh][0], f))
    col = round(lerp(choices[h][1], choices[nh][1], f))
    lx = x + col * cell
    ly = y + row * cell
    d.rect(lx - 2, ly - 2, cell + 4, cell + 4, None, INK, 4)
    d.rect(lx - 1, ly - 1, cell + 2, cell + 2, None, WHITE, 2)
    d.line([(lx + cell + 2, ly + cell / 2), (448, ly + cell / 2), (475, 318), (508, 318)], MID, 1.7)
    d.text(76, 544, "24 × 24 patches", 23, grey=SUB)
    d.text(545, 185, "Tokens in “Pink Lady, Apple”", 29, "medium")
    d.text(1180, 237, "Similarity", 21, grey=SUB, anchor="right")
    first = (row * 24 + col) * len(tokens)
    scores = [v / 10000 for v in ck["values"][first : first + len(tokens)]]
    best = max(range(len(tokens)), key=lambda k: scores[k])
    for i, (name, v) in enumerate(zip(tokens, scores)):
        yy = 281 + i * 58
        shade = TEAL if i == best else SUB
        d.text(546, yy - 11, name, 27, "medium" if i == best else "regular", shade)
        d.line([(721, yy + 5), (1024, yy + 5)], PALE, 2)
        pos = lerp(721, 1024, clamp((v + 0.3) / 1.05))
        zero = lerp(721, 1024, 0.3 / 1.05)
        d.line([(zero, yy + 5), (pos, yy + 5)], shade, 5 if i == best else 2.5)
        d.circle(pos, yy + 5, 5 if i == best else 3, shade)
        d.text(1178, yy - 13, f"{v:+.3f}", 27, "medium" if i == best else "regular", shade, "right")
    if j == 1:
        d.text(545, 526, "Mean over 576 best matches", 22, grey=SUB)
        d.text(1180, 511, "0.4331", 35, "medium", anchor="right")


def corrected(d, scene, t):
    j, q = segment(scene, t)
    d.image("beans-frame", 64, 188, 257, 329)
    d.text(191, 537, "Shopper’s box", 24, "italic", anchor="center")
    if j == 0:
        d.text(380, 207, "Frozen retriever", 31, "medium")
        d.text(380, 270, "One candidate or", 26)
        d.text(380, 308, "too few examples", 26)
        d.arrow((666, 307), (822, 307), MID, ramp(q, 0.12, 0.28))
        d.text(851, 279, "Return the first entry", 27, "medium", maxw=346)
        d.text(380, 409, "Several candidates,", 26)
        d.text(380, 447, "enough examples", 26)
        d.arrow((666, 449), (822, 449), MID, ramp(q, 0.32, 0.32))
        d.text(851, 422, "Run the slow thinker", 27, "medium", maxw=346)
    else:
        v = ease((q - 0.13) / 0.35)
        d.text(374, 192, "Shortlist", 30, "medium")
        d.text(749, 237, "Reranker probability", 19, grey=SUB, anchor="right")
        d.line([(374, 270), (756, 270)], RULE, 1.4)
        for k, (name, score, target) in enumerate(
            [("Can", "4.8%", 1), ("Box", "91.9%", 0), ("Bag", "3.2%", 2)]
        ):
            yy = 303 + 63 * lerp(k, target, v)
            d.text(384, yy, name, 31, "italic")
            if v > 0.15:
                d.text(749, yy, score, 31, "medium" if name == "Box" else "regular", anchor="right")
        d.receipt(842, 231, 361, "box" if v >= 0.5 else "can", v >= 0.5)


def results(d, scene, t):
    j, q = segment(scene, t)
    if j == 2:
        methods = [("Reranker", TEAL), ("Fine-tuned tower", BLUE)]
        if q < 0.50:
            d.text(97, 167, "GroceryVision", 34, "medium")
            d.text(97, 226, "Same inferred labels", 26, grey=MID)
            x0, x1 = 482, 1130

            def on_axis(value):
                return lerp(x0, x1, (value - 85) / 10)

            for value in (85, 90, 95):
                x = on_axis(value)
                d.line([(x, 289), (x, 512)], PALE, 1.5)
                d.text(x, 245, f"{value}%", 23, grey=SUB, anchor="center")
            d.text(x1, 167, "Recall@1", 30, "medium", anchor="right")
            for i, ((name, ink), value) in enumerate(zip(methods, [91.2, 92.3])):
                y = 349 + 111 * i
                x = on_axis(value)
                stop = lerp(x0, x, ramp(q, 0.025 + i * 0.135, 0.14))
                d.text(97, y - 18, name, 31, "medium", ink)
                d.line([(x0, y), (stop, y)], ink, 3)
                d.circle(stop, y, 7, ink)
                if abs(stop - x) < 1:
                    d.text(x + 18, y - 19, f"{value:.1f}%", 32, "medium", ink)
        else:
            for i, (name, ink) in enumerate(methods):
                x = 98 + i * 256
                d.circle(x, 172, 7, ink)
                d.text(x + 18, 156, name, 29, "medium", ink)
            measures = [
                ("Trainable parameters", [0.34, 63.5], ["0.34 M", "63.5 M"], 0.50),
                ("Training time", [1, 9], ["1×", "~9×"], 0.66),
            ]
            for k, (label, values, labels, start) in enumerate(measures):
                y = 272 + k * 161
                if q < start:
                    continue
                d.text(89, y + 25, label, 28, "medium")
                for i, ((_, ink), value, quantity) in enumerate(zip(methods, values, labels)):
                    yy = y + 19 + i * 49
                    length = 563 * value / max(values) * ramp(q, start, 0.14)
                    d.rect(448, yy, max(2, length), 14, ink)
                    d.text(466 + length, yy - 9, quantity, 26, "medium", ink)
        return
    cols = [(632, "Frozen", MID), (900, "Fine-tuned", BLUE), (1186, "ShelfTaught", TEAL)]
    d.text(92, 141, "New-brand Recall@1", 31, "medium")
    for x, label, ink in cols:
        d.text(x, 217, label, 29, "medium", ink, "right")
    rows = [
        ("GroceryVision", 78.7, 85.2, 91.2),
        ("Klasson", 75.8, 85.9, 93.1),
        ("Retail-786k", 94.4, 95.2, 95.5),
    ]
    for i, (name, *scores) in enumerate(rows):
        reveal = [1, 0, 0] if j == 0 else [1, 1, 1]
        if j == 0:
            reveal = [1, ramp(q, 0.16, 0.19), ramp(q, 0.54, 0.18)]
        if i > 0 and (j == 0 or (i == 2 and q < 0.4)):
            continue
        y = 292 + 90 * i
        d.text(92, y, name, 31, "medium")
        for (x, _, ink), score, visible in zip(cols, scores, reveal):
            if visible:
                d.text(x, y, f"{score:.1f}%", 37, "medium", ink, "right")
                if visible < 1:
                    d.white_overlay(x - 150, y - 2, 155, 51, 1 - visible)
    if j == 1 and q > 0.70:
        d.text(92, 553, "Retail-786k", 22, grey=MID)
        d.text(353, 550, "TransCLIP + teacher", 26, grey=MID)
        d.text(1186, 548, "97.0%", 29, "medium", anchor="right")


def finish(d, scene, t):
    j, q = segment(scene, t)
    u = 0.58 * q if j == 0 else 0.58 + 0.42 * clamp(q / 0.94)
    d.film_shot("store-exit", u)


SCENES = [
    title,
    checkout,
    close_call,
    insertion,
    teacher,
    model,
    patches,
    corrected,
    results,
    finish,
]
