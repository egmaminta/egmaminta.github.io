---
layout: page
icon: fas fa-file-alt
order: 5
---

<div class="mb-4">
  <p class="text-muted">These are papers that are currently in preprint form and have not yet been peer-reviewed or published in a conference or journal. Some of them are for a class requirement, while others are for sharing ongoing research work.</p>
</div>

<div class="row g-4">
  <div class="col-12">
    <div class="card shadow-sm">
      <div class="card-body p-4">
        <h4 class="card-title mb-3">
          <a href="{{ "/assets/preprints/maminta2025scalableearlydetection.pdf" | relative_url }}" class="text-decoration-none">
            Scalable Early Detection of Mental Health Signals in Social Media Text
          </a>
        </h4>
        <div class="mb-3">
          <span class="badge bg-secondary">Preprint</span>
          <span class="badge bg-info">2025</span>
          <span class="badge bg-primary">Machine Learning</span>
        </div>
        <p class="card-text text-muted">
          <strong>Abstract.</strong> Early detection of mental health signals in social media text can enable timely interventions and reduce the risk of crises. This paper presents a systematic study of encoder adaptation strategies for automated screening of mental-health indicators in social media posts, with a primary focus on BERT-based encoders. Using a curated dataset labeled across seven clinically informed categories, we compare frozen-encoder classifiers, full encoder fine-tuning, and parameterefficient approaches including low-rank adaptation (LoRA). Through extensive hyperparameter sweeps and controlled ablations we evaluate layer-wise unfreezing schedules, encoder/classifier head learning-rate splits, and regularization schemes. We show that full encoder fine-tuning achieves the highest classification performance with a peak F1-score of 0.83, substantially outperforming frozen and low-rank alternatives while maintaining strong generalization and balanced class sensitivity. Partial fine-tuning and LoRA offer notable compute and memory savings but require careful parameterization to avoid instability at large LoRA ranks. Overall, the findings demonstrate that a fine-tuned BERT encoder can serve as a reliable foundation for early diagnostic support, provided its deployment remains grounded in ethical design and clinical responsibility.
        </p>
        <a href="{{ "/assets/preprints/maminta2025scalableearlydetection.pdf" | relative_url }}" class="btn btn-outline-primary btn-sm">
          <i class="fas fa-file-pdf me-1"></i> View PDF
        </a>
      </div>
    </div>
  </div>
</div>
