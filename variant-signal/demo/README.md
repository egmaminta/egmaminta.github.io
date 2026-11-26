# Subspace transfer on a held-out brand

This is the retrieval experiment on the [ACCV 2026 paper page](https://egmaminta.github.io/variant-signal/#retrieval) for *A Transferable Variant Signal That Grocery Retrieval Cannot Reach*, by Emmanuel G. Maminta and Rowel O. Atienza. The [paper](https://egmaminta.github.io/variant-signal/assets/paper.pdf) describes the brand splits and the [OpenMPR repository](https://github.com/upeee/openmpr) provides the grocery retrieval benchmark code.

## Using the projection weights

Download [the fitted projection](https://egmaminta.github.io/variant-signal/demo/siglip2-draw10-variant-basis.npz) and [subspace.py](subspace.py). The archive contains the leading 128 axes fit on images of seen brands in the paper’s tenth draw (split seed 9). It also records the backbone, the brands in the fit and the evaluated ranks. Starbucks belongs to the test brands on this draw.

Use the 1,536-dimensional pooled image and text features from [timm/ViT-gopt-16-SigLIP2-384](https://huggingface.co/timm/ViT-gopt-16-SigLIP2-384). Rows of the basis are ordered by singular value. Both towers use the same basis. For new photos and text, project directly and normalize. Centering by brand is part of fitting only.

```python
import numpy as np
from subspace import scores

with np.load("siglip2-draw10-variant-basis.npz") as weights:
    basis = weights["basis"][:64]  # 64 x 1536

# images and texts are two-dimensional arrays of pooled SigLIP2 embeddings.
cosines = scores(images, texts, basis)
ranking = np.argsort(-cosines, axis=1)
```

The `fit_basis` function also fits new axes from images of seen brands. Pass an optional NumPy random generator to shuffle photo labels within each brand before fitting. This preserves the number of photos per variant.

## Reproducing the interactive scores

[page.js](../page.js) uses the stored coordinates of 30 Starbucks photos and 409 catalog descriptions. The byte layout of [coordinates.f32](coordinates.f32) is little-endian float32 with shape `(2, 439, 128)`. The first fit uses true variant labels. The second is the shuffled-label fit shown in Figure 2, the second fit from the seed-12345 generator. It was selected as the closest to the mean within-brand accuracy of ten shuffled fits.

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

At rank 64 the true-label fit retrieves 29 of 30 within Starbucks and the displayed shuffled fit retrieves 16. The matrices in [fig-examples.csv](fig-examples.csv) score each normalized **mean** of ten projected photos against the three texts. The browser starts with an **individual** photo. Select “Average the 10 photos, as in Figure 2” at rank 64 with the three Starbucks descriptions to reproduce each published row. The supplement documents this brand’s selection as the largest within-brand gain among the eligible examples.

[supp-fig-transfer-panel.csv](supp-fig-transfer-panel.csv) contains the ten-draw results used in the rank sweep. [tab-panel.csv](tab-panel.csv) contains the fine-tuning comparison.

Photographs are from [GroceryVision Track 2](https://grocery-vision.github.io/past_challenge/iccv2025.html) under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) and have been resized for display.
