"""Teaching implementation for the softmax article by Emmanuel G. Maminta.

Based on the equations and JAX examples in A Fix for Softmax and Cross-Entropy
by Jonathan T. Barron, Dan Gnanapragasam, and Michael Tschannen.
https://jonbarron.info/softmaxfix/

Inputs have shape (..., classes), with at least two classes and finite
float32 or float64 logits. Losses return one value per example. The soft-target
function freezes the teacher and supplies only first-order student gradients.
Class weights, ignored labels, label smoothing, and mixed precision are outside
this example's interface. This is not an API replacement for F.cross_entropy.
"""

import torch
import torch.nn.functional as F


def stable_log_softmax(z):
    index = z.argmax(dim=-1, keepdim=True)
    maximum = z.gather(-1, index)
    mask = torch.zeros_like(z, dtype=torch.bool).scatter(-1, index, True)
    shifted = torch.where(mask, 0.0, z - maximum)
    others = shifted.masked_fill(mask, -torch.inf)
    log_other_mass = torch.logsumexp(others, dim=-1, keepdim=True)
    return shifted - F.softplus(log_other_mass)


def hard_cross_entropy(z, target):
    index = target.unsqueeze(-1)
    target_score = z.gather(-1, index)
    mask = torch.zeros_like(z, dtype=torch.bool).scatter(-1, index, True)
    others = (z - target_score).masked_fill(mask, -torch.inf)
    return F.softplus(torch.logsumexp(others, dim=-1))


def soft_cross_entropy(student, teacher):
    # Calculate the prescribed first-order gradient with the teacher fixed.
    with torch.no_grad():
        log_q = stable_log_softmax(student)
        q = log_q.exp()
        p = stable_log_softmax(teacher).exp()
        delta = student - teacher
        d = delta - (p * delta).sum(dim=-1, keepdim=True)
        s = d - torch.log1p(
            (p * torch.expm1(d)).sum(dim=-1, keepdim=True)
        )
        near = s.abs() < 1
        # Avoid evaluating expm1 at large arguments in the unused branch.
        small_s = torch.where(near, s, 0.0)
        u = torch.where(near, p * torch.expm1(small_s), q - p)
        g = u - q * u.sum(dim=-1, keepdim=True)
        loss = -(p * log_q).sum(dim=-1)

    # This term is zero in the forward pass and supplies g in the backward pass.
    return loss + (g * (student - student.detach())).sum(dim=-1)


if __name__ == "__main__":
    torch.set_printoptions(precision=9)
    z = torch.tensor([[20.0, 0.0]], requires_grad=True)
    target = torch.tensor([0])
    for name, function in (("standard", F.cross_entropy),
                           ("reformulated", hard_cross_entropy)):
        loss = function(z, target).mean()
        gradient, = torch.autograd.grad(loss, z)
        print(name, "loss", loss.item(), "gradient", gradient)

    teacher = torch.tensor([[0.0, 1.0, 2.0]])
    student = teacher.clone().requires_grad_()
    standard = F.cross_entropy(student, teacher.softmax(-1))
    fixed = soft_cross_entropy(student, teacher).mean()
    for name, loss in (("standard", standard), ("reformulated", fixed)):
        gradient, = torch.autograd.grad(loss, student)
        print(name, "matching-teacher gradient", gradient)
