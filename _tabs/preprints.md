---
layout: page
title: Preprints
order: 5
description: Ongoing research shared before peer review or formal publication.
permalink: /preprints/
---

<article class="preprint-entry">
  <p class="eyebrow">2025 · Preprint · Machine learning</p>
  <h2><a href="{{ '/assets/preprints/maminta2025scalableearlydetection.pdf' | relative_url }}">Scalable Early Detection of Mental Health Signals in Social Media Text</a></h2>
  <p class="muted">This manuscript has not been peer reviewed.</p>
  <p>A study of BERT-based encoder adaptation for identifying mental health signals in social media text. The work compares frozen encoders, full fine-tuning, and parameter-efficient approaches, including LoRA, across seven categories.</p>
  <details>
    <summary>Read abstract <span aria-hidden="true">+</span></summary>
    <p>Early detection of mental health signals in social media text can enable timely interventions and reduce the risk of crises. This paper presents a systematic study of encoder adaptation strategies for automated screening of mental-health indicators in social media posts, with a primary focus on BERT-based encoders. Using a curated dataset labeled across seven clinically informed categories, we compare frozen-encoder classifiers, full encoder fine-tuning, and parameter-efficient approaches including low-rank adaptation (LoRA). Through extensive hyperparameter sweeps and controlled ablations we evaluate layer-wise unfreezing schedules, encoder/classifier head learning-rate splits, and regularization schemes. We show that full encoder fine-tuning achieves the highest classification performance with a peak F1-score of 0.83, substantially outperforming frozen and low-rank alternatives while maintaining strong generalization and balanced class sensitivity. Partial fine-tuning and LoRA offer notable compute and memory savings but require careful parameterization to avoid instability at large LoRA ranks. Overall, the findings demonstrate that a fine-tuned BERT encoder can serve as a reliable foundation for early diagnostic support, provided its deployment remains grounded in ethical design and clinical responsibility.</p>
  </details>
  <p><a class="resource-link" href="{{ '/assets/preprints/maminta2025scalableearlydetection.pdf' | relative_url }}">Read PDF <span aria-hidden="true">↗</span></a></p>
</article>

<p><a href="{{ '/#publications' | relative_url }}">← Back to publications</a></p>
