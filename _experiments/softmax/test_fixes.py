"""Checks against independent high-precision values and PyTorch derivatives."""
import importlib.util
from pathlib import Path

import pytest
import torch
import torch.nn.functional as F

spec = importlib.util.spec_from_file_location("measure", Path(__file__).with_name("measure.py"))
measure = importlib.util.module_from_spec(spec)
spec.loader.exec_module(measure)
fixes = measure.fixes


@pytest.mark.parametrize("logits,target", [([20., 0.], 0), ([0., 20.], 1),
    ([0., 20.], 0), ([0., 0., 0.], 1), ([5., 5., -4.], 2),
    ([80., -2., 0.], 0), ([-3., 2., 1.], 2)])
def test_hard_against_high_precision(logits, target):
    z = torch.tensor(logits, dtype=torch.float32, requires_grad=True)
    loss = fixes.hard_cross_entropy(z, torch.tensor(target))
    gradient, = torch.autograd.grad(loss, z)
    ref = measure.reference(logits, target=target)
    expected = torch.tensor([float(x) for x in ref["gradient"]])
    torch.testing.assert_close(gradient, expected, rtol=3e-6, atol=0)
    assert loss.item() == pytest.approx(float(ref["loss"]), rel=3e-6)


def test_hard_gradcheck_and_batch_mean():
    z = torch.tensor([[.3, -.7, 1.4], [2., 1., 0.]], dtype=torch.float64, requires_grad=True)
    target = torch.tensor([1, 0])
    assert torch.autograd.gradcheck(lambda x: fixes.hard_cross_entropy(x, target), (z,))
    actual = fixes.hard_cross_entropy(z, target).mean()
    expected = F.cross_entropy(z, target)
    torch.testing.assert_close(actual, expected)
    torch.testing.assert_close(torch.autograd.grad(actual, z)[0],
                               torch.autograd.grad(expected, z)[0])


@pytest.mark.parametrize("teacher,student", [([0., 1., 2.], [0., 1., 2.]),
    ([2., 1., 0.], [2.-1e-7, 1.+1e-7, 0.]),
    ([0., 0., 0.], [0., 0., 0.]), ([20., 0.], [20., 0.]),
    ([1., -1., 0.], [-2., 3., 1.]), ([100., -100.], [-100., 100.])])
def test_soft_against_high_precision(teacher, student):
    t = torch.tensor(teacher, dtype=torch.float32, requires_grad=True)
    z = torch.tensor(student, dtype=torch.float32, requires_grad=True)
    loss = fixes.soft_cross_entropy(z, t)
    gradient, teacher_gradient = torch.autograd.grad(loss, (z, t), allow_unused=True)
    ref = measure.reference(z.tolist(), t.tolist())
    expected = torch.tensor([float(x) for x in ref["gradient"]])
    torch.testing.assert_close(gradient, expected, rtol=3e-6, atol=1e-14)
    assert loss.item() == pytest.approx(float(ref["loss"]), rel=3e-6, abs=1e-35)
    assert teacher_gradient is None


def test_soft_gradcheck_and_batch_mean():
    teacher = torch.tensor([[2., 1., 0.], [.4, -.2, .1]], dtype=torch.float64)
    student = torch.tensor([[.4, .5, .6], [1., -1., 0.]], dtype=torch.float64, requires_grad=True)
    assert torch.autograd.gradcheck(lambda x: fixes.soft_cross_entropy(x, teacher), (student,))
    loss = fixes.soft_cross_entropy(student, teacher).mean()
    gradient, = torch.autograd.grad(loss, student)
    torch.testing.assert_close(gradient, (student.softmax(-1) - teacher.softmax(-1)) / 2)


def test_log_softmax_values_ties_and_derivatives():
    z = torch.tensor([[1., 1., 0.], [.4, -.7, 1.2]], dtype=torch.float64, requires_grad=True)
    torch.testing.assert_close(fixes.stable_log_softmax(z), z.log_softmax(-1))
    assert torch.autograd.gradcheck(fixes.stable_log_softmax, (z,))
    confident = torch.tensor([20., 0.], requires_grad=True)
    gradient, = torch.autograd.grad(fixes.stable_log_softmax(confident)[0].exp(), confident)
    assert gradient[0] > 0 and gradient[1] < 0
    torch.testing.assert_close(gradient.sum(), torch.tensor(0.))
