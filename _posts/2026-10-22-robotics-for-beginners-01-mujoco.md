---
title: Learning to control a robot arm in simulation
description: Learn the parts of a robot arm, how joint angles determine its pose, and how a position target produces motion in MuJoCo.
date: 2026-10-22 10:00:00 +0800
permalink: /posts/robotics-for-beginners-01-mujoco/
categories: [Robotics]
tags: [robot-learning, mujoco]
series: Robotics for Beginners
chapter: 1
robotics: true
---

I have been wanting to create a robotics course that my friends can follow without owning a robot arm. **Robotics for Beginners** starts with an arm in simulation and works toward experiments in robot learning.

We will use [MuJoCo](https://mujoco.readthedocs.io/en/stable/overview.html) to simulate how a robot moves under forces and contact. The simulator needs a description of the robot's parts, joints, and actuators. These are specified in a [robot model](https://mujoco.readthedocs.io/en/stable/modeling.html). We will start with the [SO101 arm from MuJoCo Menagerie](https://github.com/google-deepmind/mujoco_menagerie/blob/main/robotstudio_so101/so101.xml).

The question for this chapter is whether changing a joint's target angle moves the joint before the simulation advances.

<div class="chapter-takeaway">
  <p class="eyebrow">Start here</p>
  <p>A command records what we ask the arm to do. The joint angle and velocity describe what it is doing. A physics step updates that state.</p>
</div>

MuJoCo keeps control inputs separate from the state used to compute motion. Its simulation procedure uses the control input when advancing the state. This distinction is the basis of the exercise below. [MuJoCo simulation documentation](https://mujoco.readthedocs.io/en/stable/programming/simulation.html).

## What to learn first

We will focus on the concepts needed to explain an arm's movement. By the end of the chapter you should be able to identify its joints, explain how a shoulder movement carries the gripper, and distinguish a requested angle from the arm's response.

The exercise is to hold a position target and record how the joint responds.

<nav class="chapter-nav" aria-label="In this chapter">
  <a href="#meet-the-arm">Parts of the arm</a>
  <a href="#local-and-world">Angles and pose</a>
  <a href="#model-state-control">Commands and motion</a>
  <a href="#one-target">The exercise</a>
  <a href="#next-experiment">Reading the response</a>
</nav>

## Parts of the arm {#meet-the-arm}

A **link** is a rigid part of the arm. A **joint** permits movement between links. A hinge joint allows rotation about an axis. The SO101 model uses hinge joints for its shoulder, elbow, wrist, and gripper jaw. The diagram follows the joints in the [model definition](https://github.com/google-deepmind/mujoco_menagerie/blob/main/robotstudio_so101/so101.xml).

An **actuator** produces force or torque. Torque is the turning effect of a force about an axis. In this arm the actuators drive joint rotation. The **end effector** is the tool at the end of the arm that interacts with an object. Here it is a gripper. These distinctions appear in MuJoCo's [actuation model](https://mujoco.readthedocs.io/en/stable/computation/index.html#actuation-model) and the *Modern Robotics* description of [robot links and joints](https://modernrobotics.northwestern.edu/nu-gm-book-resource/2-2-degrees-of-freedom-of-a-robot/).

{% include robotics/anatomy.html %}

The links and joints form a **kinematic chain**, a connected sequence from the base to the gripper. Each link's placement is defined relative to the link before it. Moving the shoulder carries the elbow, wrist, and gripper. Opening the jaw changes the gripper opening while the shoulder can stay in place. MuJoCo represents these dependencies through a [hierarchy of bodies](https://mujoco.readthedocs.io/en/stable/modeling.html#kinematic-tree).

## Joint angles and gripper pose {#local-and-world}

A **coordinate frame** has an origin and axes used to describe position and orientation. The **world frame** is fixed to the scene. A frame attached to the upper arm moves with that arm. The same point can have different coordinates depending on which frame describes it. *Modern Robotics* introduces these conventions in its treatment of [rigid-body motion](https://modernrobotics.northwestern.edu/nu-gm-book-resource/introduction-to-rigid-body-motions/).

In the diagram below the shoulder angle is measured from the world's horizontal axis. The elbow angle is measured from the extension of the upper link. Keep the elbow angle fixed and change the shoulder angle. The elbow keeps its bend while the tool tip moves through the world frame.

{% include robotics/chain.html %}

**Position** describes where the tool is. **Orientation** describes which way it points. **Pose** includes both. For example, a gripper above a package can point toward the package or away from it without changing its position. The frame representation records this difference. [Position and orientation in Modern Robotics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/introduction-to-rigid-body-motions/).

**Forward kinematics** computes the tool's pose from the joint configuration, meaning the set of joint positions. **Inverse kinematics** asks which joint configurations can reach a requested pose. Depending on the arm and the request there may be several solutions or none. These problems are introduced in the textbook's sections on [forward kinematics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/4-1-1-product-of-exponentials-formula-in-the-space-frame/) and [inverse kinematics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/inverse-kinematics-of-open-chains/).

For now, use the diagram to follow the chain. The pose changes because each joint changes the placement of the links after it.

## Commands and motion {#model-state-control}

The SO101 model uses **position servos**. A position servo produces force or torque in response to a requested position and the joint state. A **controller** chooses the commands sent to the actuators. For this arm the request is a joint angle. A request for an angle of zero remains a position command. It does not disable the actuator. [MuJoCo position servos](https://mujoco.readthedocs.io/en/stable/XMLreference.html#actuator-position).

We need to keep track of the following quantities.

| Quantity | Meaning |
| --- | --- |
| Target angle | The joint angle requested by the controller |
| Joint angle | The joint's current rotation relative to its reference configuration |
| Angular velocity | The rate of change of that angle |
| Simulation time | The elapsed time represented by the physics steps |

MuJoCo calculates acceleration from the forces acting on the arm and restrictions such as joint limits. It updates velocity and position as simulation time advances. This is the **dynamics** calculation, which describes how forces produce motion. [MuJoCo integration procedure](https://mujoco.readthedocs.io/en/stable/computation/index.html#numerical-integration).

<div class="concept-flow" role="group" aria-label="From request to movement">
  <div><strong>Target angle</strong><span>The controller requests a position</span></div>
  <span class="flow-arrow" aria-hidden="true">→</span>
  <div><strong>Actuator torque</strong><span>Torque acts alongside gravity and contact forces</span></div>
  <span class="flow-arrow" aria-hidden="true">→</span>
  <div><strong>Joint motion</strong><span>The physics step updates velocity and angle</span></div>
</div>

Set a target while the simulation is paused. The request changes while the joint state stays where it was. When physics steps resume the simulator can compute the response to that request. This follows from the separation between controls and state in MuJoCo's [simulation procedure](https://mujoco.readthedocs.io/en/stable/programming/simulation.html).

{% include robotics/command.html %}

The distinction matters when using the viewer. Editing the joint angle sets the state. Editing the target changes what the actuator is asked to do. MuJoCo exposes [state and control as separate quantities](https://mujoco.readthedocs.io/en/stable/programming/simulation.html#state-and-control).

## Hold a target and record the response {#one-target}

The exercise uses the shoulder pan joint, which turns the arm around its base. Set its target within the model's permitted control range. Keep that target fixed while the simulation advances. The model defines [control ranges for its position actuators](https://github.com/google-deepmind/mujoco_menagerie/blob/main/robotstudio_so101/so101.xml).

Record the target angle, joint angle, angular velocity, and simulation time throughout the movement. Use radians for angles and radians per second for angular velocity. MuJoCo uses radians in its [compiled models](https://mujoco.readthedocs.io/en/stable/modeling.html#coordinate-frames).

Plot the target and joint angle together against simulation time. Use another plot for angular velocity. The angle plot should show where the joint goes relative to the request. The velocity plot should show when it moves and when its direction changes.

## How to read the response {#next-experiment}

**Position error** is the target angle minus the joint angle. Its magnitude measures how far the joint is from the request. A smaller magnitude means a closer match. This is the error definition used in *Modern Robotics* to describe a [controller's response](https://modernrobotics.northwestern.edu/nu-gm-book-resource/11-2-1-error-response/). For a target held fixed, angular velocity near zero indicates little movement.

These quantities answer different questions. Consider a joint passing through its target. Its position error reaches zero even if it is still moving. Now consider a joint held against an obstacle away from the target. Its velocity can be zero while position error remains. The angle and velocity must be read together.

In the plots, **overshoot** means passing beyond the target. **Oscillation** means moving back and forth around it. These are features of the [error response](https://modernrobotics.northwestern.edu/nu-gm-book-resource/11-2-1-error-response/). For this exercise we will call the response **settled** when position error and velocity remain within chosen bounds. State those bounds and the observation period when reporting a settling result.

<details class="understanding-check">
  <summary>If the elbow angle stays fixed while the shoulder moves, does the tool stay in place?</summary>
  <p>The shoulder carries the links after it. The elbow keeps its bend relative to the upper arm while the tool moves in the world frame.</p>
</details>
