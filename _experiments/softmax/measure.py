# /// script
# dependencies = ["torch==2.14.1", "mpmath==1.3.0", "numpy"]
# ///
"""Record CPU examples, high-precision references, and the interactive sweep."""
import csv
import hashlib
import importlib.util
import json
from pathlib import Path
import platform

import mpmath as mp
import torch
import torch.nn.functional as F

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "assets/code/softmax_fixes.py"
spec = importlib.util.spec_from_file_location("softmax_fixes", SOURCE)
fixes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixes)
mp.mp.dps = 80


def reference(logits, teacher=None, target=None):
    """Use exact binary inputs converted to 80-decimal-digit arithmetic."""
    def probabilities(values):
        values = [mp.mpf(float(x)) for x in values]
        exps = [mp.exp(x - max(values)) for x in values]
        return [x / sum(exps) for x in exps]
    q = probabilities(logits)
    p = probabilities(teacher) if teacher is not None else [
        mp.mpf(int(i == target)) for i in range(len(logits))
    ]
    return {"loss": str(-sum(a * mp.log(b) for a, b in zip(p, q))),
            "gradient": [str(b - a) for a, b in zip(p, q)]}


def evaluate(logits, teacher=None, target=None):
    z = torch.tensor(logits, dtype=torch.float32).requires_grad_()
    record = {"student_logits": z.detach().tolist()}
    if teacher is None:
        t = torch.tensor(target, dtype=torch.long)
        standard = F.cross_entropy(z, t)
        fixed = fixes.hard_cross_entropy(z, t)
        record["target"] = target
    else:
        t = torch.tensor(teacher, dtype=torch.float32)
        standard = F.cross_entropy(z, t.softmax(-1))
        fixed = fixes.soft_cross_entropy(z, t)
        record["teacher_logits"] = t.tolist()
    for name, loss in (("standard", standard), ("reformulated", fixed)):
        gradient, = torch.autograd.grad(loss, z)
        record[name] = {"loss": loss.item(), "gradient": gradient.tolist(),
                        "gradient_sum": gradient.double().sum().item()}
    record["reference"] = reference(record["student_logits"],
                                    record.get("teacher_logits"), target)
    return record


def main():
    destination = ROOT / "assets/data/softmax"
    destination.mkdir(parents=True, exist_ok=True)
    teacher = torch.tensor([2., 1., 0.], dtype=torch.float32)
    near = teacher + torch.tensor([-1e-7, 1e-7, 0.], dtype=torch.float32)
    epsilon = torch.tensor(-20., dtype=torch.float32).exp()
    examples = {
        "torch_version": torch.__version__, "device": "cpu",
        "dtype": "float32", "architecture": platform.machine(),
        "reference_decimal_digits": mp.mp.dps,
        "implementation_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "collapse": evaluate([20., 0.], target=0),
        "equal": evaluate([0., 1., 2.], teacher=[0., 1., 2.]),
        "near": evaluate(near.tolist(), teacher=teacher.tolist()),
        "hand_calculation": {
            "exp_negative_20": str(mp.exp(-20)),
            "float32_exp_negative_20": epsilon.item(),
            "float32_one_plus_epsilon": (1 + epsilon).item(),
            "float32_spacing_above_one": torch.finfo(torch.float32).eps,
            "float32_log_one_plus_epsilon": (1 + epsilon).log().item(),
            "float32_log1p_epsilon": epsilon.log1p().item(),
        },
    }
    sweep = []
    for step in range(121):
        margin = step / 4
        result = evaluate([margin, 0.], target=0)
        sweep.append({
            "margin": margin,
            "standard_loss": result["standard"]["loss"],
            "reformulated_loss": result["reformulated"]["loss"],
            "standard_gradient": result["standard"]["gradient"],
            "reformulated_gradient": result["reformulated"]["gradient"],
            "reference_target_gradient": float(result["reference"]["gradient"][0]),
        })
    examples["sweep"] = {"min": 0, "max": 30, "step": .25,
                          "first_zero_target_gradient": next(
                              x["margin"] for x in sweep if x["standard_gradient"][0] == 0)}
    (destination / "examples.json").write_text(json.dumps(examples, indent=2) + "\n")
    (destination / "margin-sweep.json").write_text(json.dumps(sweep, indent=2) + "\n")
    with (destination / "margin-sweep.csv").open("w", newline="") as file:
        writer = csv.writer(file, lineterminator="\n")
        writer.writerow(["margin", "standard_target_gradient", "standard_other_gradient",
                         "reformulated_target_gradient", "reformulated_other_gradient",
                         "reference_target_gradient"])
        for row in sweep:
            writer.writerow([row["margin"], *row["standard_gradient"],
                             *row["reformulated_gradient"], row["reference_target_gradient"]])
    print(json.dumps(examples, indent=2))


if __name__ == "__main__":
    main()
