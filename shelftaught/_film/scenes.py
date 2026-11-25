"""The paper's examples, animated in narration order using recorded model outputs."""

import json
import math

from art import ASSETS, INK, MID, PALE, RULE, SUB, WHITE, clamp, ease, lerp, ramp

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
    d.line([(878, 374), (1167, 374)], INK, 2)
    d.line([(68, 463), (1210, 463)], RULE, 1.5)
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


def checkout(d, scene, t):
    j, q = segment(scene, t)
    d.title("From the shelf to the bill")
    if j == 0:
        d.subtitle("A store camera records the pickup.")
        d.aisle_shot(66, 165, 700, 394, clamp((t - scene["lines"][0]["start"] - 0.25) / 6.5))
        if q < 0.57:
            d.text(824, 205, "On the shelf", 29, "medium")
            d.product("can", 875, 315, 0.88)
            d.product("box", 976, 287 - 8 * ease(q / 0.57), 1.03)
        else:
            d.text(824, 179, "The recorded pickup", 27, "medium")
            d.image("beans-frame", 835, 227, 278, 293)
            if q < 0.65:
                d.white_overlay(815, 166, 397, 371, 1 - ease((q - 0.57) / 0.08))
        d.note("A package leaves the shelf. The camera supplies a view of what the shopper picked up.")
    elif j == 1:
        d.subtitle("A pickup has to become a catalog entry.")
        d.image("store-camera", 66, 171, 521, 307, True, 1 + 0.06 * ease(q))
        d.text(66, 496, "Shelf camera viewpoint", 23, grey=SUB)
        d.arrow((596, 329), (761, 329), MID, ramp(q, 0.04, 0.38))
        d.receipt(792, 198, 346, "Which package?", False, False)
        d.text(792, 447, "The cart needs one exact item.", 23, maxw=401)
    else:
        d.subtitle("The two inputs describe the same product in different ways.")
        d.text(67, 174, "Store image", 30, "medium")
        d.image("beans-frame", 67, 225, 325, 325, False)
        d.arrow((430, 376), (594, 376), MID, ramp(q, 0.08, 0.35))
        d.text(630, 173, "Catalog text", 30, "medium")
        d.text(630, 244, "365 Organic", 36, "medium")
        d.text(630, 291, "Garbanzo Beans", 42, "medium")
        d.line([(630, 358), (1160, 358)], RULE, 1.5)
        for i, (label, value) in enumerate(
            [("Brand", "365"), ("Product", "Garbanzo beans"), ("Package", "can, box or bag")]
        ):
            y = 384 + i * 47
            d.text(630, y, label, 23, grey=SUB)
            d.text(801, y, value, 26, "italic" if i == 2 else "regular")
        d.note("Matching a store image to a catalog description is multimodal product retrieval.")


def close_call(d, scene, t):
    j, q = segment(scene, t)
    d.title("When two packages share a name")
    if j == 0:
        d.subtitle("The brand and the product name can match both entries.")
        d.product("can", 198, 232, 1.52)
        d.product("box", 487, 187, 1.47)
        d.text(271, 485, "can", 30, "italic", anchor="center")
        d.text(569, 485, "box", 30, "italic", anchor="center")
        d.line([(730, 206), (730, 516)], RULE, 1.3)
        d.text(793, 259, "One product name.", 33, "medium")
        d.text(793, 312, "Two catalog entries.", 33, "medium")
        if q > 0.43:
            d.text(793, 399, "Which one should", 28)
            d.text(793, 439, "appear on the bill?", 28)
    else:
        d.subtitle("GroceryVision  /  365 Organic Garbanzo Beans")
        d.image("beans-frame", 64, 180, 278, 355)
        d.text(202, 544, "Shopper’s box", 25, "italic", anchor="center")
        d.text(395, 184, "First retrieval pass", 30, "medium")
        d.text(765, 247, "Cosine", 20, grey=SUB, anchor="right")
        d.line([(394, 275), (772, 275)], RULE, 1.5)
        for i, (label, score) in enumerate([("Can", "0.220"), ("Box", "0.218"), ("Bag", "0.184")]):
            p = 1 if j == 2 else ramp(q, 0.26 + i * 0.075, 0.18)
            y = 300 + i * 64
            grey = round(lerp(206, INK, p))
            d.text(394, y, str(i + 1), 23, grey=grey)
            d.text(437, y, label, 33, "italic", grey)
            d.text(766, y, score, 33, "medium", grey, anchor="right")
        shown = j == 2 or q > 0.65
        if shown:
            d.arrow((786, 343), (849, 343), MID, 1 if j == 2 else ramp(q, 0.65, 0.15))
            d.receipt(862, 236, 339, "can")
        if j == 2:
            d.note(
                "A second pass compares the shortlisted entries. Where do its training labels come from?"
            )


def insertion(d, scene, t):
    j, q = segment(scene, t)
    d.title("When a new brand arrives")
    d.subtitle("The catalog entry comes first. The store photographs arrive over time.")
    d.text(67, 189, "At catalog insertion", 28, "medium")
    d.image("beans-box", 74, 234, 157, 182)
    d.text(248, 253, "365 Organic", 25)
    d.text(248, 287, "Garbanzo Beans", 26, "medium", maxw=245)
    d.text(248, 327, "box", 25, "italic")
    d.text(66, 455, "Description and at most", 24)
    d.text(66, 489, "one catalog picture", 24)
    d.line([(505, 192), (505, 526)], RULE, 1.4)
    d.text(547, 189, "After shoppers handle the product", 28, "medium", maxw=653)
    for i, name in enumerate(["099482441647_3", "099482441647_21", "099482441647_75"]):
        x = 549 + 213 * i
        p = 0 if j == 0 else (1 if j > 1 else ramp(q, 0.035 + 0.19 * i, 0.22))
        if p > 0:
            d.image(name, x, 232 + (1 - p) * 17, 191, 199)
            if p < 1:
                d.white_overlay(x, 231, 194, 222, 1 - p)
        else:
            d.line([(x + 24, 329), (x + 157, 329)], PALE, 1.5)
    if j == 0:
        d.text(548, 458, "No labeled checkout frames yet.", 25, grey=SUB)
    else:
        d.text(548, 457, "Real store views, product labels withheld", 25, maxw=653)
    if j == 2:
        d.note("ShelfTaught uses these unlabeled store views to train a reranker offline.")


def teacher(d, scene, t):
    j, q = segment(scene, t)
    d.title("An imperfect teacher")
    d.subtitle("A separate training example from Klasson")
    d.image("apple-train", 67, 187, 316, 316)
    d.text(67, 526, "First retrieval choice", 22, grey=SUB)
    d.text(67, 554, "Pink Lady", 31, "medium")
    d.text(444, 184, "Teacher input", 23, grey=SUB)
    d.text(902, 184, "Royal Gala", 27, "medium", anchor="center")
    d.text(1115, 184, "Pink Lady", 27, "medium", anchor="center")
    d.line([(444, 225), (1205, 225)], RULE, 1.5)
    d.text(444, 251, "Candidate texts", 28, "medium")
    d.text(444, 292, "10 descriptions", 22, grey=SUB)
    d.text(903, 257, "86.5%", 39, "medium", anchor="center")
    d.text(1116, 262, "3.8%", 31, anchor="center")
    if j > 0:
        c = 1 if j > 1 else ramp(q, 0.20, 0.30)
        d.line([(444, 347), (1205, 347)], RULE, 1.3, c)
        d.text(444, 373, "Texts and pictures", 27, "medium")
        for i, n in enumerate(["catalog-2", "catalog-4", "catalog-3", "catalog-0"]):
            d.image(n, 442 + i * 64, 421, 52, 48)
        if c > 0.45:
            d.text(903, 377, "81.0%", 39, "medium", anchor="center")
            d.text(1116, 381, "5.9%", 31, anchor="center")
    if j == 2:
        d.line([(443, 499), (1205, 499)], RULE, 1.4)
        d.text(444, 524, "Majority vote", 23, grey=SUB)
        d.text(642, 518, "Royal Gala", 31)
        d.text(444, 568, "True variety", 23, grey=SUB)
        d.text(642, 562, "Pink Lady", 31, "semibold")


def model(d, scene, t):
    j, q = segment(scene, t)
    d.title("How a label model infers the product")
    if j == 0:
        d.subtitle("The product identity is unknown. Several sources provide evidence about it.")
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
        d.note("A label model estimates which entry best explains the evidence.")
        return
    d.subtitle("One marked photograph among 72 store frames")
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
        d.circle(ax(a), ay(b), 4.3, round(lerp(245, 27, (v + 1) / 2)), MID, 0.7)
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
    d.line(points, INK, 3.6)
    d.circle(*points[-1], 5.5, INK)
    d.text(640, 508, f"Update {round(u):02d} / 15", 23, grey=SUB)
    d.text(1190, 491, f"{p:.1%}", 45, "medium", anchor="right")
    d.note(
        "Keep this frame when probability reaches 90% and a source names the same product."
        if j == 2
        else "Fitting uses frame similarity and the source answers, with balanced assignments across entries."
    )


def patches(d, scene, t):
    j, q = segment(scene, t)
    d.title("What the reranker looks at")
    d.subtitle("Select a patch. Find its best match in one catalog description.")
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
        shade = INK if i == best else SUB
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
        d.note("The tokens carry context. A visual match can fall on any word in the description.")


def corrected(d, scene, t):
    j, q = segment(scene, t)
    d.title("Correcting the cart")
    d.subtitle("The same GroceryVision frame as in the first pass")
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
        d.note("The coverage gate uses the number of retained targets for the retriever’s first choice.")
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
        d.note(
            "The slow thinker reuses the image features. When invoked, it adds 0.22 ms to measured latency."
        )


def results(d, scene, t):
    j, q = segment(scene, t)
    d.title("How often is the first entry correct?")
    d.subtitle("Held-out brands  /  Recall@1")
    left, right = 396, 1168

    def x(num):
        return lerp(left, right, (num - 70) / 30)

    for val in (70, 80, 90, 100):
        d.line([(x(val), 209), (x(val), 510)], PALE, 1.6)
        d.text(x(val), 526, f"{val}%", 21, grey=SUB, anchor="center")
    for k, (name, a, b) in enumerate(
        [("GroceryVision", 78.7, 91.2), ("Klasson", 75.8, 93.1), ("Retail-786k", 94.4, 95.5)]
    ):
        yy = 241 + 110 * k
        d.text(70, yy - 15, name, 29, "medium")
        p = (
            (1 if j > 0 else ramp(q, 0.04 + 0.40 * k, 0.25))
            if k < 2
            else (0 if j == 0 else ramp(q, 0.025, 0.26))
        )
        stop = lerp(x(a), x(b), p)
        d.line([(x(a), yy), (stop, yy)], INK, 3)
        d.circle(x(a), yy, 7.5, WHITE, INK, 2.3)
        d.text(x(a) - 8, yy + 13, str(a), 24, grey=MID, anchor="right")
        if p > 0.02:
            d.circle(stop, yy, 7, INK)
            if p > 0.75:
                d.text(x(b) + 8, yy - 37, str(b), 26, "medium")
    d.circle(76, 582, 6, WHITE, INK, 2)
    d.text(94, 570, "Frozen retriever", 23)
    d.circle(346, 582, 6, INK)
    d.text(365, 570, "ShelfTaught", 23)
    if j == 1 and q > 0.32:
        d.text(
            1220, 570, "Retail-786k: TransCLIP + teacher  97.0%", 23, "medium", anchor="right", maxw=598
        )


def finish(d, scene, t):
    _, q = segment(scene, t)
    d.title("One box on the bill")
    d.image("checkout-aisle", 67, 177, 598, 325, True, 1.08 - 0.08 * ease(q))
    d.receipt(749, 184, 445, "box", True)
    d.text(747, 444, "ShelfTaught", 38, "medium")
    d.text(747, 496, "egmaminta.github.io/shelftaught", 23, maxw=460)
    d.note(
        "Catalog text starts retrieval. Store views teach the reranker which package the shopper picked up."
    )


SCENES = [title, checkout, close_call, insertion, teacher, model, patches, corrected, results, finish]
