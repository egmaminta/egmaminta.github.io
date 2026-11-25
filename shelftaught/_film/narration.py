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
            "ShelfTaught uses these unlabeled views to train a reranker offline. The first step is deciding which catalog entry each training frame probably shows.",
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
        "What the reranker looks at",
        [
            "Those examples train the slow thinker. It takes the image patches already computed by the frozen retriever. For each patch, it finds the strongest match among the tokens of a candidate description.",
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
        "How often is the first entry correct?",
        [
            "Across ten brand splits, the share of correct first choices on GroceryVision rises from 78.7 to 91.2 percent. On Klasson it rises from 75.8 to 93.1.",
            "Retail-786k starts higher. ShelfTaught reaches 95.5 percent, while TransCLIP with teacher answers reaches 97.0 percent there.",
        ],
    ),
    (
        "One box on the bill",
        [
            "A description lets a new product enter the catalog. Unlabeled views from the store can then teach the checkout system to make the distinction that matters on this bill: one box of beans.",
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
    "75.8": "seventy-five point eight",
    "93.1": "ninety-three point one",
    "95.5": "ninety-five point five",
    "97.0": "ninety-seven",
}


def record(model, voices, work):
    work.mkdir(parents=True, exist_ok=True)
    options = ort.SessionOptions()
    options.intra_op_num_threads = 6
    options.inter_op_num_threads = 1
    options.log_severity_level = 3
    session = ort.InferenceSession(str(model), sess_options=options, providers=["CPUExecutionProvider"])
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
