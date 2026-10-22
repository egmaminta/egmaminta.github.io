---
title: Learning to control a robot arm in simulation
description: Read the SO-101 MuJoCo model and examine a recorded shoulder-pan response, including overshoot and angle settling time.
date: 2026-10-22 10:00:00 +0800
permalink: /posts/robotics-for-beginners-01-mujoco/
categories: [Robotics]
tags: [robot-learning, mujoco]
series: Robotics for Beginners
chapter: 1
robotics: true
---

I have been wanting to create a robotics course that my friends can follow without owning a robot arm. **Robotics for Beginners** starts with an arm in simulation and works toward experiments in robot learning.

We use [MuJoCo](https://mujoco.readthedocs.io/en/stable/overview.html) to simulate how a robot moves under forces and contact. The simulator needs a description of the robot's parts, joints, and actuators. These are specified in a [robot model](https://mujoco.readthedocs.io/en/stable/modeling.html). This chapter uses the [SO101 arm from MuJoCo Menagerie](https://github.com/google-deepmind/mujoco_menagerie/blob/main/robotstudio_so101/so101.xml).

<figure class="robotics-figure robot-model-photo" id="so101-motion">
  <img id="so101-animation" src="{{ '/assets/img/robotics/so101-motion-poster.png' | relative_url }}" data-still-src="{{ '/assets/img/robotics/so101-motion-poster.png' | relative_url }}" data-motion-src="{{ '/assets/img/robotics/so101-motion.gif' | relative_url }}" width="720" height="450" alt="The SO-101 arm in MuJoCo with its gripper open." decoding="async">
  <div class="motion-controls">
    <button id="so101-motion-toggle" type="button" class="text-button" aria-controls="so101-animation" aria-pressed="false" data-interactive-only hidden>Play animation</button>
    <a href="{{ '/assets/img/robotics/so101-motion.gif' | relative_url }}">View GIF</a>
    <a href="{{ '/assets/img/robotics/so101.png' | relative_url }}">View still image</a>
  </div>
  <figcaption><strong>The SO-101 arm in motion.</strong> Programmed joint targets turn the arm and open and close its gripper in MuJoCo. Model from <a href="https://github.com/google-deepmind/mujoco_menagerie/tree/main/robotstudio_so101">MuJoCo Menagerie</a> under the <a href="{{ '/assets/img/robotics/SO101-LICENSE.txt' | relative_url }}">Apache 2.0 license</a>.</figcaption>
</figure>

We recorded the shoulder joint's response to a fixed target angle. The chapter explains the arm's structure, follows a joint through its XML model, and uses the recording to distinguish reaching a target from settling near it.

<nav class="chapter-nav" aria-label="In this chapter">
  <a href="#meet-the-arm">Parts of the arm</a>
  <a href="#local-and-world">Angles and pose</a>
  <a href="#read-the-xml">Reading the XML</a>
  <a href="#model-state-control">Commands and motion</a>
  <a href="#one-target">The experiment</a>
  <a href="#next-experiment">Reading the response</a>
  <a href="#angle-settling">Angle settling time</a>
  <a href="#other-robots">Other robots</a>
</nav>

## Parts of the arm {#meet-the-arm}

A **link** is a rigid part of the arm. A **joint** permits movement between links. A hinge joint allows rotation about an axis. The SO101 model uses hinge joints for its shoulder, elbow, wrist, and gripper jaw. The diagram follows the joints in the [model definition](https://github.com/google-deepmind/mujoco_menagerie/blob/main/robotstudio_so101/so101.xml).

An **actuator** produces force or torque. Torque is the turning effect of a force about an axis. In this arm the actuators drive joint rotation. The **end effector** is the tool at the end of the arm that interacts with an object. Here it is a gripper. These distinctions appear in MuJoCo's [actuation model](https://mujoco.readthedocs.io/en/stable/computation/index.html#actuation-model) and the *Modern Robotics* description of [robot links and joints](https://modernrobotics.northwestern.edu/nu-gm-book-resource/2-2-degrees-of-freedom-of-a-robot/).

{% include robotics/anatomy.html %}

The links and joints form a **kinematic chain**, a connected sequence from the base to the gripper. Each link's placement is defined relative to the link before it. Moving the shoulder carries the elbow, wrist, and gripper. Opening the jaw changes the gripper opening while the shoulder can stay in place. MuJoCo represents these dependencies through a [hierarchy of bodies](https://mujoco.readthedocs.io/en/stable/modeling.html#kinematic-tree).

## Joint angles and gripper pose {#local-and-world}

A **coordinate frame** has an origin and axes used to describe position and orientation. The **world frame** is fixed to the scene. A frame attached to the upper arm moves with that arm. The same point can have different coordinates depending on which frame describes it. *Modern Robotics* introduces these conventions in its treatment of [rigid-body motion](https://modernrobotics.northwestern.edu/nu-gm-book-resource/introduction-to-rigid-body-motions/).

In the diagram below the shoulder angle is measured from the world's horizontal axis. The elbow angle is measured from the extension of the upper link. Keep the elbow angle fixed and change the shoulder angle. The elbow keeps its bend while the gripper moves through the world frame.

{% include robotics/chain.html %}

**Position** describes where the tool is. **Orientation** describes which way it points. **Pose** includes both. For example, a gripper above a package can point toward the package or away from it without changing its position. The frame representation records this difference. [Position and orientation in Modern Robotics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/introduction-to-rigid-body-motions/).

**Forward kinematics** computes the tool's pose from the joint configuration, meaning the set of joint positions. **Inverse kinematics** asks which joint configurations can reach a requested pose. Depending on the arm and the request there may be several solutions or none. These problems are introduced in the textbook's sections on [forward kinematics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/4-1-1-product-of-exponentials-formula-in-the-space-frame/) and [inverse kinematics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/inverse-kinematics-of-open-chains/).

## Reading the SO-101 XML {#read-the-xml}

MuJoCo's native model format is **MJCF**, an XML format for describing a simulated system. XML uses elements such as `<body>` and attributes such as `name="shoulder"`. Nested elements describe containment. Start by following a named joint through the file. The [MuJoCo modeling guide](https://mujoco.readthedocs.io/en/stable/modeling.html) explains the format.

### Open the scene first

In the SO-101 folder, `scene.xml` adds the floor, lighting, and background around the robot. It loads the robot through this element.

```xml
<include file="so101.xml"/>
```

The robot's parts and actuators are in `so101.xml`. Its `<compiler>` element sets `angle="radian"` and `meshdir="assets"`. A **mesh** is a shape represented by vertices and faces. The mesh files in `assets` supply the shapes of the arm's parts. Keep this folder beside the XML files when opening the [SO-101 scene](https://github.com/google-deepmind/mujoco_menagerie/blob/main/robotstudio_so101/scene.xml).

| Section in `so101.xml` | What to look for |
| --- | --- |
| `<compiler>` | Angle units and the folder containing meshes |
| `<option>` | The physics timestep and simulation settings |
| `<asset>` | Meshes and materials referenced by the robot |
| `<worldbody>` | The nested bodies that make up the arm |
| `<actuator>` | The drives associated with named joints |
| `<default>` | Settings shared by elements that select a class |

These sections are present in the [model file](https://github.com/google-deepmind/mujoco_menagerie/blob/main/robotstudio_so101/so101.xml). The [XML reference](https://mujoco.readthedocs.io/en/stable/XMLreference.html) defines their attributes.

### Follow the body hierarchy

Search for `<worldbody>` and follow the nested `<body>` elements. Each body groups parts that move together. This is the SO-101 body hierarchy with geometry and numerical attributes omitted.

```text
worldbody
└── base
    └── shoulder
        └── upper_arm
            └── lower_arm
                └── wrist
                    └── gripper
                        ├── camera_mount
                        └── moving_jaw_so101_v1
```

Inside a body, `pos` gives its position relative to its parent. `quat` gives its orientation as a quaternion, a representation of rotation. A `<joint>` permits motion relative to the parent. A body with no joint stays fixed to its parent. These relationships are defined by MuJoCo's [kinematic tree](https://mujoco.readthedocs.io/en/stable/modeling.html#kinematic-tree) and [coordinate frames](https://mujoco.readthedocs.io/en/stable/modeling.html#coordinate-frames).

The other elements answer different questions about the same part. A `<geom>` specifies a shape used for rendering or contact. An `<inertial>` specifies mass and how that mass is distributed. A `<site>` marks a reference location and orientation. The SO-101 uses `gripperframe` as a site on the gripper. See the [body element definitions](https://mujoco.readthedocs.io/en/stable/XMLreference.html#body).

### Match shoulder pan to its actuator

Search for `name="shoulder_pan"`. The joint appears inside the shoulder body.

```xml
<joint axis="0 0 1" name="shoulder_pan" type="hinge"
       range="-1.91986 1.91986" class="sts3215"/>
```

`type="hinge"` permits rotation. `axis="0 0 1"` specifies the local z axis. `range` gives the joint limits in radians because of the compiler setting above. The [joint reference](https://mujoco.readthedocs.io/en/stable/XMLreference.html#body-joint) describes these attributes.

The matching entry in `<actuator>` is a position servo.

```xml
<position class="sts3215" name="shoulder_pan"
          joint="shoulder_pan" ctrlrange="-1.91986 1.91986"/>
```

The `joint` attribute identifies what it drives. `ctrlrange` bounds the requested angle when control limiting is enabled. This model enables automatic limit inference with `autolimits="true"`. Its joint limits and control limits happen to match. They still describe separate quantities. See [compiler limits](https://mujoco.readthedocs.io/en/stable/XMLreference.html#compiler) and [position actuators](https://mujoco.readthedocs.io/en/stable/XMLreference.html#actuator-position).

Both entries select `class="sts3215"`. Find `<default class="sts3215">` to see the settings they inherit. Its `<joint>` supplies damping, which resists motion, and its `<position>` supplies the position and velocity feedback gains. A gain sets the strength of a response to an error or velocity. The actuator's `forcerange` bounds its output. Reading this defaults class explains settings that are absent from the individual joint and actuator lines. MuJoCo documents [default inheritance](https://mujoco.readthedocs.io/en/stable/modeling.html#default-settings) and [servo parameters](https://mujoco.readthedocs.io/en/stable/XMLreference.html#actuator-position).

<details class="understanding-check">
  <summary>Where is the wrist camera attached?</summary>
  <p>Search for <code>wrist_cam</code>. It is inside <code>camera_mount</code>, which is a child of <code>gripper</code>. The camera mount has no joint. It moves with the gripper body. The moving jaw is a separate child body with its own joint, so opening the jaw does not change the camera's attachment.</p>
</details>

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

## Recording the shoulder response {#one-target}

We set the shoulder pan target to **−1.300 rad** and left it fixed. The initial joint angle and angular velocity were zero. The other actuators kept their initial position targets. The target was within the model's permitted range. The [recorded measurements]({{ '/assets/data/robotics/chapter-1/summary.json' | relative_url }}) contain the settings and results for this run.

At each physics step we recorded simulation time, target angle, joint angle, and angular velocity. In the Python interface these correspond to `data.time`, `data.ctrl`, `data.qpos`, and `data.qvel`. For this arm the angles are in radians and angular velocities are in radians per second. MuJoCo documents [state and control](https://mujoco.readthedocs.io/en/stable/programming/simulation.html#state-and-control) separately.

The initial state was recorded once. Each later sample was recorded after a physics step. This keeps every target, angle, and velocity aligned with the same simulation timestamp. The recording contains **402 samples** separated by **0.005 s**. It ends at **2.005 s**. The script requested 2.000 s but its time-based loop took an extra step because of floating-point accumulation. The plot uses the recorded time.

<figure class="robotics-figure response-figure" id="shoulder-response">
  <div class="figure-heading"><span class="figure-number">04</span><strong>Shoulder pan response to a fixed target</strong></div>
  <a href="{{ '/assets/img/robotics/shoulder-pan-response.svg' | relative_url }}"><img src="{{ '/assets/img/robotics/shoulder-pan-response.svg' | relative_url }}" width="900" height="650" loading="lazy" alt="The shoulder angle passes the target and oscillates before remaining within the tolerance band from 0.560 seconds. Angular velocity still oscillates after that time. An inset shows the angle error near settling."></a>
  <figcaption>The dotted line marks the angle-settling time. The inset enlarges the angle error around the tolerance band. The lower panel shows that meeting the angle criterion does not require zero velocity. <a href="{{ '/assets/data/robotics/chapter-1/shoulder-pan-trajectory.csv' | relative_url }}">Download the recorded trajectory</a>.</figcaption>
</figure>

## How to read the response {#next-experiment}

**Position error** is the target angle minus the joint angle. Its magnitude measures the distance from the requested angle. A smaller magnitude means a closer match. This is the error definition used in *Modern Robotics* to describe a [controller's response](https://modernrobotics.northwestern.edu/nu-gm-book-resource/11-2-1-error-response/).

The first target crossing falls between the samples at **0.340 s** and **0.345 s**. At the latter sample the joint still has negative angular velocity, so it continues past the target. The minimum recorded angle is about **−1.405 rad** at **0.395 s**. Relative to the −1.300 rad target, that is **0.105 rad of peak overshoot**, the greatest recorded excursion beyond the target in the direction of the initial motion. Less overshoot means a smaller excursion for the same request.

The joint then reverses direction. Angular velocity becomes positive as the angle returns toward the target. The repeated reversals shrink over time. This is a **damped oscillation**, meaning back-and-forth motion whose amplitude decreases. The [angle and velocity recording]({{ '/assets/data/robotics/chapter-1/shoulder-pan-trajectory.csv' | relative_url }}) shows why the first crossing cannot serve as the completion time. The joint reaches the requested angle while it is still moving through it.

## Measuring angle settling time {#angle-settling}

We chose an allowed angle error of **0.010 rad** before evaluating the response. This gives a band from **−1.310 rad** to **−1.290 rad** around the target. The script requires the absolute error to be strictly below the tolerance. A sample on either boundary is outside the accepted band.

For this experiment, **angle settling time** is the earliest recorded timestamp after which every remaining sample satisfies that angle criterion. A shorter time means the joint begins its final stay inside the band sooner under the same tolerance and observation period. It is an angle-only measurement.

An entry into the band is provisional. If the joint leaves, that entry no longer qualifies. A later entry becomes the next candidate. Samples that remain inside preserve the candidate timestamp. This checks the order of entries and exits. Adding up the time spent inside would answer a different question.

The measured angle-settling time is **0.560 s**. At that sample the angular velocity is about **0.576 rad/s**. The angle remains within tolerance through the end of the recording even though velocity continues to oscillate. Small angle error therefore does not establish that the joint has stopped.

| Measurement | Result |
| --- | --- |
| Peak overshoot beyond the target | 0.105 rad |
| Angle settling time | 0.560 s |
| Final joint angle | Approximately −1.300000 rad |
| Final angular velocity | Approximately −3.457 × 10⁻¹³ rad/s |

These values are computed from the [saved trajectory]({{ '/assets/data/robotics/chapter-1/shoulder-pan-trajectory.csv' | relative_url }}) and [measurement summary]({{ '/assets/data/robotics/chapter-1/summary.json' | relative_url }}). Settling here applies to the recorded samples through 2.005 s at a sampling interval of 0.005 s. It does not establish what happens between samples or after the recording ends. A stopping criterion would also need a chosen velocity bound.

<details class="understanding-check">
  <summary>If the elbow angle stays fixed while the shoulder moves, does the tool stay in place?</summary>
  <p>The shoulder carries the links after it. The elbow keeps its bend relative to the upper arm while the tool moves in the world frame.</p>
</details>

## Other robots to explore {#other-robots}

{% include robotics/menagerie.html %}

## Conclusion

The SO-101 model connects the arm's parts through nested bodies and drives named joints through position actuators. Following those connections explains which parts move when the shoulder turns and where the joint's settings come from.

In the recorded experiment the shoulder passes its target, reverses direction, and remains within the chosen angle tolerance from 0.560 s onward. Its velocity continues to oscillate after that timestamp. When evaluating a joint response, report the angle tolerance and observation interval alongside the velocity trace.
