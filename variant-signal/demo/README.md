# Subspace transfer on a held-out brand

This is the retrieval experiment on the [ACCV 2026 paper page](https://egmaminta.github.io/variant-signal/#retrieval) for *A Transferable Variant Signal That Grocery Retrieval Cannot Reach*, by Emmanuel G. Maminta and Rowel O. Atienza. The [paper](https://egmaminta.github.io/variant-signal/assets/paper.pdf) describes how brands were assigned to training and testing and the [OpenMPR repository](https://github.com/upeee/openmpr) provides the grocery retrieval benchmark code.

## Reproducing the interactive scores

[page.js](../page.js) uses the stored coordinates of 30 Starbucks photos and 409 catalog descriptions. The byte layout of [coordinates.f32](coordinates.f32) is little-endian float32 with shape `(2, 439, 128)`. Both fits use the frozen image features from SigLIP2-gopt-384 training photos, with Starbucks excluded. The first groups those photos by their correct variety labels. At test time we project both the Starbucks photo vectors and the catalog text vectors from the same SigLIP2 model. The second is the shuffled-label fit shown in Figure 2, the second fit from the seed-12345 generator. It was selected as the closest to the mean within-brand accuracy of ten shuffled fits.

Within each fit, rows 0–29 are photos and rows 30–438 are catalog texts, in the order of [catalog.json](catalog.json). The arrays store projections **before** normalization. Taking the first 16, 32, 64 or 128 coordinates and normalizing each row reproduces the interactive scores.

```python
import json
import numpy as np
from subspace import normalize

with open("catalog.json", encoding="utf-8") as f:
    catalog = json.load(f)
coords = np.fromfile("coordinates.f32", dtype="<f4").reshape(2, 439, 128)
v = normalize(coords[0, :, :64].astype(np.float64))
query = 10  # the first Sumatra photo
cosines = v[30:] @ v[query]
print(catalog["products"][int(np.argmax(cosines))]["description"])
```

At rank 64, the subspace fitted with original labels retrieves the correct Starbucks roast for 29 of 30 photos. When restricted to the same three descriptions, the displayed fit trained with shuffled labels identifies 16 of the same 30 photos correctly. The matrices in [fig-examples.csv](fig-examples.csv) score each normalized **mean** of ten projected photos against the three texts. The browser starts with an **individual** photo. Select “Average the 10 image vectors (Figure 2)” at rank 64 with the three Starbucks descriptions to reproduce each published row. The supplement documents this brand’s selection as the largest within-brand gain among the eligible examples.

[supp-fig-transfer-panel.csv](supp-fig-transfer-panel.csv) reports how often the correct description ranked first among all 409 entries at each rank. For each trial we averaged accuracy equally across test brands with at least two products. We then averaged across ten assignments of brands to training, validation and testing. [tab-panel.csv](tab-panel.csv) contains the fine-tuning comparison.

## Linear probe example

The [linear probe](https://egmaminta.github.io/variant-signal/#probe) uses the pooled SigLIP2 image features of 30 GroceryVision photographs of Blue Diamond almonds. Each of the three varieties supplies six training photos and four test photos. We shuffle the ten indices of each variety, in sorted SKU order, with a single NumPy default generator seeded with 0. We fit a standard scaler on the training features and a multinomial logistic regression with L2 regularization, C = 1, and the L-BFGS solver. A second fit uses the same training features and a permutation of their labels from a generator seeded with 12345. Both classifiers predict the variety for each of the same twelve test photos. The original labels yield twelve correct predictions and the shuffled labels yield five. The splits, original and shuffled assignments, and both predictions for each test photo are recorded in [probe.json](probe.json). Table 1 of the paper reports the separate benchmark results averaged over brands and three runs.

Photographs are from [GroceryVision Track 2](https://grocery-vision.github.io/past_challenge/iccv2025.html) under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) and have been resized for display.
