"""Record the narration and save its cue times. Provide a Kokoro ONNX model and voices file."""

import argparse
import json
import wave
from pathlib import Path

import numpy as np
import onnxruntime as ort
from kokoro_onnx import Kokoro

CHAPTERS = [
    (
        "Thinking Fast and Slow for Label-Free Open-Catalog Product Retrieval",
        [
            "Suppose a shopper picks up one package from a shelf of almost identical products. How does the store know exactly what to put on the bill?",
        ],
    ),
    (
        "From the shelf to the bill",
        [
            "In a grocery store with camera-based checkout, a shopper can take an item off the shelf without scanning a barcode. A store camera records the pickup.",
            "The checkout system has to turn that picture into a line in a virtual cart. Each line identifies one product in the store’s catalog.",
            "The camera supplies an image, often blurred or partly hidden by a hand. The catalog supplies words: the brand, the variant and the package size. Matching the image to that text is called multimodal product retrieval.",
        ],
    ),
    (
        "When two packages share a name",
        [
            "Suppose a product comes in a can and a box. Both descriptions carry the same brand and product name. The shopper can be charged for the wrong item if the system confuses the packages.",
            "Here is a real GroceryVision frame. The shopper is holding boxed garbanzo beans. The frozen retriever compares the whole photograph with the catalog. The can scores 0.220, the box 0.218. The first pass puts a can in the cart.",
            "A second pass can compare the few plausible entries more closely. That is the job of a reranker. But how can it learn the packaging of a brand the store has just added?",
        ],
    ),
    (
        "When a new brand arrives",
        [
            "On its first day, a new product may have a description and one catalog picture. The store can already search for it, even though nobody has labeled a checkout photograph of it.",
            "As people shop, the camera collects views of the new package under store lighting and in different hands. These views show what the catalog picture leaves out. The store still has no product label for each frame.",
            "Why not just fine-tune the retriever? Labels from brands the store already sells help it recognize groceries. But those labels never show it the new brand’s box in a shopper’s hand. ShelfTaught keeps the retriever frozen and uses the new, unlabeled views to train its reranker. First we need a likely product label for each view.",
        ],
    ),
    (
        "An imperfect teacher",
        [
            "Consider a separate training photograph of apples. The frozen retriever ranks Pink Lady first. We give a larger vision-language model the frame and the ten most plausible descriptions.",
            "The teacher favors Royal Gala. Several candidates remain plausible, so we ask again, this time with their catalog pictures. Royal Gala still comes first.",
            "Both answers are wrong. This is a Pink Lady apple. Taking a majority vote would turn the teacher’s mistake into a training label.",
        ],
    ),
    (
        "How a label model infers the product",
        [
            "A label model estimates an unknown label from several imperfect signals. Here it can ask one more question: which other store frames look like this one?",
            "Each dot is a store frame, positioned by its similarity to two apple clusters. The ring marks our photograph. During fitting, the model combines these visual groups with the retrieval scores and both teacher answers. It also balances assignments across catalog entries.",
            "Follow the probability of Pink Lady. It passes ninety percent after the first update and reaches 99.5 percent after fifteen. The retriever also named Pink Lady, so the frame qualifies as a training example.",
        ],
    ),
    (
        "Inside ShelfTaught’s reranker",
        [
            "Those examples train ShelfTaught’s reranker, the slow thinker. It takes the image patches already computed by the frozen retriever. For each patch, it finds the strongest match among the tokens of a candidate description.",
            "Move to another patch and the best match can change. Averaging these best matches gives one score for the description. The same calculation scores its competitors.",
        ],
    ),
    (
        "Correcting the cart",
        [
            "Return to the shopper’s box of beans. At checkout, a single candidate can go straight to the cart. The first choice also stands if the store has too few training examples for it.",
            "Here three packages remain and there are enough examples. The slow thinker puts the box first with 91.9 percent probability. The cart changes from one can to one box. The offline teacher is finished.",
        ],
    ),
    (
        "What changes when the model sees the new products?",
        [
            "On GroceryVision, fine-tuning on labels from previously stocked brands raises first-choice accuracy from 78.7 to 85.2 percent on new brands. ShelfTaught learns from unlabeled views of the new products and reaches 91.2 percent.",
            "On Klasson, fine-tuning reaches 85.9 percent. ShelfTaught reaches 93.1. On Retail-786k the difference is small: 95.2 and 95.5 percent. TransCLIP with teacher answers leads there at 97.0.",
            "ShelfTaught updates 340 thousand parameters in its reranker and reuses the store’s image features. Fine-tuning the image tower on the same training targets updates 63.5 million adapter parameters. On GroceryVision that takes about nine times as long.",
        ],
    ),
    (
        "The receipt at the door",
        [
            "The shopper leaves the store carrying the box of beans. The checkout system has checked the pickup against the item in the cart.",
            "Outside, a notification arrives. In this example the box costs two dollars and forty-nine cents. The receipt shows exactly what was charged: one box of garbanzo beans.",
        ],
    ),
]

PRONUNCIATION = {
    "camera-based": "camera based",
    "vision-language": "vision language",
    "ShelfTaught": "Shelf Taught",
    "reranker": "ree-ranker",
    "GroceryVision": "Grocery Vision",
    "Klasson": "Klahsson",
    "TransCLIP": "Trans Clip",
    "Retail-786k": "Retail seven eighty-six K",
    "0.220": "zero point two two zero",
    "0.218": "zero point two one eight",
    "99.5": "ninety-nine point five",
    "91.9": "ninety-one point nine",
    "78.7": "seventy-eight point seven",
    "91.2": "ninety-one point two",
    "85.2": "eighty-five point two",
    "85.9": "eighty-five point nine",
    "95.2": "ninety-five point two",
    "63.5": "sixty-three point five",
    "75.8": "seventy-five point eight",
    "93.1": "ninety-three point one",
    "95.5": "ninety-five point five",
    "97.0": "ninety-seven",
}


def checkout_sounds(chapters):
    pickup = chapters[1]["lines"][0]
    exit_scene = chapters[-1]
    cues = json.loads(Path(__file__).with_name("exit-cues.json").read_text())
    return {
        "Camera shutter": pickup["start"] + 0.95 * 0.90 * (pickup["end"] - pickup["start"]),
        "Phone chimes": exit_scene["start"]
        + cues["chime"] / cues["seconds"] * (exit_scene["end"] - exit_scene["start"]),
    }


def mix_checkout_sounds(work, chapters):
    with wave.open(str(work / "narration.wav")) as src:
        rate = src.getframerate()
        samples = np.frombuffer(src.readframes(src.getnframes()), dtype="<i2").astype(float) / 32768
    times = checkout_sounds(chapters)

    def mix(start, sound):
        i = round(start * rate)
        samples[i : i + len(sound)] += sound

    rng = np.random.default_rng(9)
    moment = np.arange(round(rate * 0.043)) / rate
    for delay, gain in ((0, 0.075), (0.065, 0.038)):
        noise = np.convolve(rng.normal(size=len(moment)), [0.22, 0.56, 0.22], mode="same")
        shutter = (noise + 0.35 * np.sin(2 * np.pi * 1180 * moment)) * np.exp(-moment * 117)
        mix(times["Camera shutter"] + delay, gain * shutter)
    moment = np.arange(round(rate * 0.53)) / rate
    envelope = (1 - np.exp(-moment * 180)) * np.exp(-moment * 8)
    for delay, frequency in ((0, 697), (0.135, 930)):
        tone = np.sin(2 * np.pi * frequency * moment) + 0.19 * np.sin(
            4 * np.pi * frequency * moment
        )
        mix(times["Phone chimes"] + delay, 0.068 * envelope * tone)
    target = work / "soundtrack.wav"
    with wave.open(str(target), "wb") as dest:
        dest.setparams((1, 2, rate, 0, "NONE", "not compressed"))
        dest.writeframes((np.clip(samples, -1, 32767 / 32768) * 32768).astype("<i2").tobytes())
    return target


def record(model, voices, work):
    work.mkdir(parents=True, exist_ok=True)
    options = ort.SessionOptions()
    options.intra_op_num_threads = 6
    options.inter_op_num_threads = 1
    options.log_severity_level = 3
    session = ort.InferenceSession(
        str(model), sess_options=options, providers=["CPUExecutionProvider"]
    )
    engine = Kokoro.from_session(session, str(voices))
    rate = 24000
    timeline = []
    with wave.open(str(work / "narration.wav"), "wb") as output:
        output.setparams((1, 2, rate, 0, "NONE", "not compressed"))

        def pause(duration):
            output.writeframes(bytes(2 * round(rate * duration)))

        for i, (title, passages) in enumerate(CHAPTERS):
            chapter = {"title": title, "start": output.getnframes() / rate, "lines": []}
            pause(0.82 if i == 0 else 0.42)
            for j, passage in enumerate(passages):
                spoken = passage
                for word, pronunciation in PRONUNCIATION.items():
                    spoken = spoken.replace(word, pronunciation)
                samples, hz = engine.create(spoken, voice="af_heart", speed=1.025, lang="en-us")
                assert hz == rate
                begin = output.getnframes() / rate
                output.writeframes((np.clip(samples, -1, 1) * 32200).astype("<i2").tobytes())
                chapter["lines"].append(
                    {"text": passage, "start": begin, "end": output.getnframes() / rate}
                )
                if j + 1 < len(passages):
                    pause(0.34)
            pause(2.0 if i == len(CHAPTERS) - 1 else 0.72)
            chapter["end"] = output.getnframes() / rate
            timeline.append(chapter)
            print(f"{i + 1}. {title} ({chapter['end'] - chapter['start']:.1f}s)", flush=True)
    (work / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for option in ("model", "voices", "work"):
        parser.add_argument("--" + option, required=True, type=Path)
    args = parser.parse_args()
    record(args.model, args.voices, args.work)
