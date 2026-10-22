---
title: "A target is a request: getting to know a robot arm"
description: "Chapter 1 of Robotics for Beginners: the SO101 arm, joint coordinates, and why a target angle is different from the actual state."
date: 2026-10-22 10:00:00 +0800
permalink: /posts/robotics-for-beginners-01-mujoco/
categories: [Robotics]
tags: [robot-learning, mujoco]
series: Robotics for Beginners
chapter: 1
robotics: true
reading_time: 10
---

My research in RetailVision and Physical Retail AI has made me increasingly interested in how perception connects to action. Recognizing a product is one part of the problem. Reaching for it, approaching it with a gripper, and interacting with it introduce a different set of questions.

I am putting together **Robotics for Beginners** as a record of my own learning. I started with the SO101 arm in MuJoCo. This first chapter draws on my experiments from October 17–18, 2026: loading the scene, exploring its joints, and holding a single position target.

The most useful observation was simple: **changing the target did not instantly change the joint angle.**

<div class="chapter-takeaway">
  <p class="eyebrow">The idea to keep</p>
  <p>A command describes what you ask the robot to do. State describes what it is doing. Physics connects the two over time.</p>
</div>

## What to learn first

I use the Pareto principle as a way to choose what to study first: a small set of foundations can make many later ideas easier to grasp. The “80/20” split is a useful heuristic, rather than a measured fraction of robotics knowledge.

By the end of this chapter, you should be able to:

- Identify the arm's main joints and explain what moves downstream of each one.
- Distinguish a joint angle from a gripper's position and orientation in the world.
- Read the difference between a position target, an actual angle, and an angular velocity.
- Explain why checking both position error and velocity matters when judging settling.

<nav class="chapter-nav" aria-label="In this chapter">
  <a href="#meet-the-arm">1. Meet the arm</a>
  <a href="#local-and-world">2. Local and world</a>
  <a href="#model-state-control">3. Model, state, control</a>
  <a href="#one-target">4. One target</a>
  <a href="#next-experiment">5. Next experiment</a>
</nav>

## 1. Meet the arm {#meet-the-arm}

**MuJoCo** simulates physics. **MuJoCo Menagerie** supplies robot models, including the [SO101 model](https://github.com/google-deepmind/mujoco_menagerie/tree/main/robotstudio_so101) I used. Loading a model gives us a description of a robot and its physical properties; it does not supply a learned policy.

Think of an arm as rigid **links** connected by **joints**. A joint permits relative movement between bodies. An **actuator** produces the force or torque that drives movement. The **end effector** is the part that interacts with the task; here, it is the gripper.

{% include robotics/anatomy.html %}

This model has five arm joints and one gripper joint, all hinges. The gripper's moving jaw therefore has an **angle**, even though we often describe its effect as an opening width. Six joint coordinates do not mean six independent ways to position and orient the gripper: one coordinate controls the jaw.

The robot's XML arranges bodies in a parent–child hierarchy. Moving the shoulder carries the elbow, wrist, and gripper with it. Moving the wrist does not carry the shoulder along. That dependency is the first useful intuition behind a **kinematic chain**.

## 2. A local angle is not a world position {#local-and-world}

An elbow can hold the same bend while the shoulder moves it to a different place in the scene. Likewise, the gripper can keep the same opening while its location and direction change.

Try changing only the shoulder angle below. Watch the elbow and tool tip move, even though the elbow's relative angle stays fixed.

{% include robotics/chain.html %}

Three words help keep these ideas separate:

- **Position:** where the gripper is.
- **Orientation:** which way it points.
- **Pose:** position and orientation together.

**Forward kinematics** maps a joint configuration to the end-effector pose. **Inverse kinematics** asks which configurations could reach a desired position or pose. There may be several solutions, or none within the arm's constraints.

In the viewer, I explored configurations that appeared to reach approximately the same point. That was a useful visual check, but it did not establish that the gripper had the same orientation. For a retail manipulation task, arriving above a product and arriving beside it are different approaches, even if the final contact point is similar.

## 3. Separate the model, state, and control {#model-state-control}

The MuJoCo names become easier to remember when grouped by the question they answer. These meanings apply to the fixed-base SO101 scene used here.

| Question | MuJoCo name | Meaning in this experiment |
| --- | --- | --- |
| What robot and scene exist? | `MjModel` | Structure, joints, actuator definitions, and physical parameters |
| What is happening now? | `MjData` | Runtime state, controls, and computed quantities |
| Where are the joints? | `data.qpos` | Actual hinge angles, in radians |
| How fast are they moving? | `data.qvel` | Angular velocities, in radians per second |
| What am I requesting? | `data.ctrl` | Position-servo target angles, in radians |
| How much time has been simulated? | `data.time` | Simulation time, in seconds |

`mujoco.mj_step` advances one physics step. Loading a model in Python alone does not open a viewer or advance time. The [MuJoCo Python documentation](https://mujoco.readthedocs.io/en/stable/python.html) describes the model, runtime data, and viewer interfaces.

In my scene, `qpos`, `qvel`, and `ctrl` each had six entries. **Do not assume those array lengths always match.** A floating-base robot, a different joint type, or a different actuator arrangement changes what must be represented.

### Check what a control input means

The [SO101 actuator definitions](https://github.com/google-deepmind/mujoco_menagerie/blob/main/robotstudio_so101/so101.xml) use position servos. For these hinge-joint transmissions, `ctrl` requests joint angles. In another model, a control value could request torque or something else. Read the actuator definition before interpreting an action.

Joint `range` describes movement limits. Actuator `ctrlrange` describes control-input limits when control limiting is enabled. Those are different roles, even when the numerical bounds happen to match. See the [MuJoCo position-actuator reference](https://mujoco.readthedocs.io/en/stable/XMLreference.html#actuator-position).

<div class="concept-flow" role="group" aria-label="From request to movement">
  <div><span class="flow-index">01</span><strong>Target angle</strong><span>The request in <code>ctrl</code></span></div>
  <span class="flow-arrow" aria-hidden="true">→</span>
  <div><span class="flow-index">02</span><strong>Actuator torque</strong><span>Acts with gravity, contact, and other dynamics</span></div>
  <span class="flow-arrow" aria-hidden="true">→</span>
  <div><span class="flow-index">03</span><strong>Changing state</strong><span>Velocity and angle evolve as time advances</span></div>
</div>

While the viewer is paused, changing an actuator target leaves the joint where it is until physics steps resume. Editing the joint state directly is a different operation. This distinction explains why a command can change before any motion is visible.

## 4. One target, three snapshots {#one-target}

I set the first actuator, `shoulder_pan`, to **−1.3 radians** (about −74.5°). Then I compared the state before stepping, after one step, and after about one simulated second.

{% include robotics/snapshots.html %}

| Recorded quantity | Before stepping | After one step | After about 1 s |
| --- | --- | --- | --- |
| Simulation time (s) | 0 | 0.005 | ≈ 1 |
| Target angle (rad) | −1.3 | −1.3 | −1.3 |
| Actual angle (rad) | 0 | ≈ −0.00152 | ≈ −1.3 |
| Angular velocity (rad/s) | 0 | ≈ −0.304 | ≈ −9.04 × 10⁻⁸ |

These are the approximate values recorded in my lesson notes, not a new simulation run. The first snapshot was taken **after setting the target and before stepping**, which is why the target is already −1.3 at time zero.

The request stayed fixed because I did not change it. The actual angle changed as the simulator advanced. The actuator's torque can vary while its target remains constant.

### What does “settled” mean?

At the final snapshot, the angle was close to the target and the angular velocity was close to zero. Both observations matter:

- **Small position error:** the joint is close to where it was asked to go.
- **Small velocity:** it is no longer moving appreciably.

A joint can pass through its target at speed. It can also stop against an obstacle before reaching its target. Either example shows why checking only one number is insufficient. A full trajectory is needed to establish how long the joint stays near the target.

### Three zeros with different meanings

In my initial state, the arrays were zero. Zero joint angles refer to the model's reference configuration; they do not place the gripper at the world origin. Zero angular velocity means stationary at that moment. **Zero position control still requests a target angle of zero**; it does not turn a position servo off or rigidly lock a joint.

## 5. The next experiment: record the motion {#next-experiment}

I have compared snapshots. Recording and plotting the full trajectory is my next exercise, and **it is still pending**. The snapshots alone cannot show whether the joint overshot or oscillated between observations.

I will keep the same target and model settings, then record simulation time, actual angle, target angle, and angular velocity throughout the one-second experiment. Two plots should answer different questions:

1. **Actual and target angle versus simulation time:** how does the joint approach the request?
2. **Angular velocity versus simulation time:** when does movement speed up, slow down, or reverse?

I will look for **overshoot** (passing beyond the target), **oscillation** (moving repeatedly around it), and **settling** (remaining close with velocity near zero). I will use simulation time rather than the computer's wall-clock time.

<details class="understanding-check">
  <summary>Check your intuition: if the shoulder moves but the elbow angle stays fixed, what changes?</summary>
  <p>The elbow keeps its bend relative to the upper arm. Its world position changes because the shoulder carries the downstream chain. The gripper can change both position and orientation without changing its jaw opening.</p>
</details>

The foundation I want to carry into later chapters is the habit of asking: **what was commanded, what actually happened, and what evidence connects them?** That question will still matter when the commands come from a learned policy.

<div class="article-notes" markdown="1">
### Resources and figure design

The technical references for this chapter are the [MuJoCo documentation](https://mujoco.readthedocs.io/en/stable/), its [Python interface](https://mujoco.readthedocs.io/en/stable/python.html), and the [Menagerie SO101 model](https://github.com/google-deepmind/mujoco_menagerie/tree/main/robotstudio_so101). Model settings and observations refer to my October 2026 learning notes.

The figures follow ideas from [Sophie Wang's essay on paper writing and visualization](https://www.sophielwang.com/blog/paper-writing): one point per figure, consistent visual meaning, and readable labels. The diagrams are scalable vectors. Sans-serif labels use Graphik when installed, with self-hosted Inter as the fallback; code and literal values use self-hosted B612 Mono.
</div>
