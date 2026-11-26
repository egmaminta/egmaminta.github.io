"""Fit and apply the variant subspace from Maminta and Atienza (ACCV 2026)."""
import numpy as np


def normalize(rows):
    """Unit-normalize each image, text, or projected embedding."""
    return rows / (np.linalg.norm(rows, axis=1, keepdims=True) + 1e-8)


def fit_basis(features, brands, variants, seen_brands, rank=64, shuffle_rng=None):
    """Fit on seen-brand image embeddings. Rows of the result are orthonormal."""
    features = normalize(np.asarray(features, dtype=np.float64))
    brands, variants = np.asarray(brands), np.asarray(variants)
    residuals = []
    for brand in sorted(set(seen_brands)):
        keep = brands == brand
        brand_features, labels = features[keep], variants[keep]
        unique_labels = np.unique(labels)
        if len(unique_labels) < 2:
            continue
        if shuffle_rng is not None:
            labels = shuffle_rng.permutation(labels)
        means = np.stack([brand_features[labels == label].mean(axis=0)
                          for label in unique_labels])
        residuals.append(means - means.mean(axis=0))
    if not residuals:
        raise ValueError("The fit needs a seen brand with at least two variants.")
    differences = np.concatenate(residuals)
    _, values, axes = np.linalg.svd(differences - differences.mean(axis=0),
                                    full_matrices=False)
    available = np.count_nonzero(values > values[0] * max(differences.shape) * np.finfo(values.dtype).eps)
    if not 1 <= rank <= available:
        raise ValueError("The requested rank exceeds the available variant directions.")
    return axes[:rank]


def project(features, basis):
    """Apply the same basis to new image and text vectors, with no centering."""
    return normalize(np.asarray(features) @ basis.T)


def scores(images, texts, basis):
    """One row per query image and one column per catalog description."""
    return project(images, basis) @ project(texts, basis).T
