# /// script
# dependencies = ["torch==2.14.1", "numpy"]
# ///
"""Record the hand-chosen classifier and a two-bias loss slice.

This arithmetic example is not an image benchmark or a slingshot experiment.
"""
import csv
import hashlib
import json
from pathlib import Path

import torch
from torch import nn
import torch.nn.functional as F

ROOT = Path(__file__).resolve().parents[2]
DESTINATION = ROOT / "assets/data/softmax"


def make_classifier():
    model = nn.Sequential(nn.Linear(2, 2), nn.ReLU(), nn.Linear(2, 2)).double()
    with torch.no_grad():
        model[0].weight.copy_(torch.tensor([[1., 0.], [0., 2.]]))
        model[0].bias.zero_()
        model[2].weight.copy_(torch.tensor([[1., 1.], [0., 0.]]))
        model[2].bias.zero_()
    return model


def main():
    DESTINATION.mkdir(parents=True, exist_ok=True)
    model = make_classifier()
    x = torch.tensor([1., .5], dtype=torch.float64)
    target = torch.tensor(0)
    hidden = model[:2](x)
    logits = model(x)
    loss = F.cross_entropy(logits, target)
    gradient, = torch.autograd.grad(loss, logits)
    record = {
        "purpose": "Hand-chosen classification example and output-bias loss slice",
        "torch_version": torch.__version__, "dtype": "float64", "device": "cpu",
        "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "input": x.tolist(), "hidden": hidden.detach().tolist(),
        "hidden_weights": model[0].weight.detach().tolist(),
        "hidden_biases": model[0].bias.detach().tolist(),
        "output_weights": model[2].weight.detach().tolist(),
        "output_biases": model[2].bias.detach().tolist(),
        "target": "Product A", "logits": logits.detach().tolist(),
        "probabilities": logits.softmax(-1).detach().tolist(),
        "loss": loss.item(), "logit_gradient": gradient.tolist(),
        "bias_learning_rate": 1.0, "bias_updates": 12,
    }

    # Only output biases change. The input and all connection weights stay fixed.
    for parameter in model.parameters():
        parameter.requires_grad_(False)
    model[2].bias.requires_grad_(True)
    optimizer = torch.optim.SGD([model[2].bias], lr=record["bias_learning_rate"])
    trajectory = []
    for step in range(record["bias_updates"] + 1):
        optimizer.zero_grad()
        loss = F.cross_entropy(model(x), target)
        trajectory.append({"step": step, "bias_a": model[2].bias[0].item(),
                           "bias_b": model[2].bias[1].item(), "loss": loss.item()})
        if step < record["bias_updates"]:
            loss.backward()
            optimizer.step()
    record["trajectory"] = trajectory

    # Evaluate the classifier itself at each point, then verify the closed form.
    grid = []
    for bias_b in torch.linspace(-2., 2., 41, dtype=torch.float64):
        for bias_a in torch.linspace(-2., 2., 41, dtype=torch.float64):
            with torch.no_grad():
                model[2].bias.copy_(torch.stack([bias_a, bias_b]))
                actual = F.cross_entropy(model(x), target)
                expected = torch.logaddexp(torch.tensor(0.), bias_b - (2 + bias_a))
            torch.testing.assert_close(actual, expected)
            grid.append([bias_a.item(), bias_b.item(), actual.item()])
    record["grid"] = {"min": -2., "max": 2., "points_per_axis": 41,
                      "formula": "log(1 + exp(bias_b - (2 + bias_a)))"}
    assert all(later["loss"] < earlier["loss"] for earlier, later in
               zip(trajectory, trajectory[1:]))
    torch.testing.assert_close(gradient, logits.softmax(-1) - torch.tensor([1., 0.]))
    (DESTINATION / "classifier.json").write_text(json.dumps(record, indent=2) + "\n")
    with (DESTINATION / "loss-slice.csv").open("w", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(["bias_a", "bias_b", "cross_entropy"])
        writer.writerows(grid)
    print(json.dumps(record, indent=2))


if __name__ == "__main__":
    main()
