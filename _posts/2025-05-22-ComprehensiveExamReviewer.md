---
title: "Artificial Intelligence Program Comprehensive Examination Reviewer (Part 1)"
description: "A reviewer in preparation for the comprehensive examination of the graduate students enrolled in the Artificial Intelligence Program, which they are required to pass as part of the Master's of Engineering in Artificial Intelligence degree completion requirements. This part covers the following courses: Fundamentals of Artificial Intelligence (AI 201), Probability and Statistics (AI 211), and Linear Algebra (AI 212)."
author: "egmaminta"
date: 2025-05-22 14:06:00 +0800
categories: [Study Materials]
tags: [comprehensive exam, review, study guide]
math: true
toc: true
---

# AI 201: Fundamentals of Artificial Intelligence
## What is Artificial Intelligence?

## Intelligent Agents
* **Agent**: A system that **perceives its environment through its sensors** and **acts on that environment through its effectors**. Examples of agents include humans, robots, and softbots.
* **Generic Intelligent Agent**: A **rational agent** is an agent that **acts rationally** so as to achieve one's goals given one's beliefs.
  * It is necessary to measure achievement of goals by evaluating: (1) **how** much successful the agent is in achieving its goals, and (2) **when** it was able to achieve its goals.
* **Performance Measure**: A measure that indicates how successful an agent is in achieving its goals.
  * Example: For a vacuum cleaner agent, the performance measure could be the amount of dirt cleaned up in a day, the electricity consumed, and the noise generated. Knowing when the agent was able to complete a task is also important. If the agent was able to perform the task correctly after 10 minutes, it is not as good as an agent that was able to do the same task in 5 minutes.

> Performance of a rational agent must be measured given what has been perceived.
{: .prompt-tip }

* What is rational at any given time depends on the following: (1) **performance measure**, (2) **perceptual history**, (3) **knowledge of the environment**, and (4) **actions available to the agent**.

> Agent's choice of action at a given instant depends on all these, but not on anything that has not yet been perceived.
{: .prompt-tip }

* Design performance measures according to what the agent would want to achieve in the environment rather than according to how the designer thinks the agent should behave.
  * Example: Maximize the amount of dirt collected vs. maintain a spotless floor by the end of the day. Beware of unintended consequences that might come up, a critical issue in Reinforcement Learning.
* **Rationality vs. Perfection**: Rationality maximizes the expected performance measure, while perfection means achieving the best possible performance measure. Rationality is a more practical goal than perfection.
* **Information Gathering**: Doing actions in order to modify future perceptions is part of rationality. **Exploration** is the process of probing unknown environment (e.g., a robot mapping the physical environment).
* **Ideal Rational Agent**: For each possible percept sequence, an ideal rational agent should do whatever action is expected to maximize its performance measure, on the basis of the evidence provided by the percept sequence and whatever built-in knowledge the agent has.
* **Autonomy**: The ability to make your own decisions without being controlled by anyone else. The ability to adapt to its environment; flexibility to change its behavior based on the environment.

> If an agent relies solely on its built-in knowledge and completely disregards the environment, the agent lacks autonomy. For example, a clock has no autonomy.
{: .prompt-tip }

* A good rational agent acts according to: (1) **built-in knowledge**, which is often imperfect or partial, and (2) **percept sequence** (own experience).

> A system is autonomous to the extent that its behavior is determined by its own experience.
{: .prompt-tip }

* **Structure of an Intelligent Agent**
  * **Agent Program**: The implementation of the mapping from percepts to actions.
  * **Architecture**: The computing device on which the agent program runs.
  * $\textbf{Agent} = \textbf{Architecture} + \textbf{Agent Program}$
  * **PEAS Description**: **P**erformance, **E**nvironment, **A**ctuators, and **S**ensors. A PEAS description is a concise way to specify the task environment of an agent. Example: For a vacuum cleaner agent, the PEAS description is as follows:
    * **Performance Measure**: Amount of dirt cleaned up in a day, electricity consumed, noise generated.
    * **Environment**: The room to be cleaned.
    * **Actuators**: Wheels, brushes, vacuum cleaner.
    * **Sensors**: Dirt sensor, distance sensor.
* **Types of Agents**
  * **Table-Driven Agent**: Store percept sequence in memory and use it as an index into a table which contains the appropriate action for all possible sequences.
    * Disadvantages: Memory-intensive (table is extremely large e.g., $10^{123}$ entries for chess), slow (table lookup is time-consuming), no autonomy (since table is built-in knowledge).
  * **Simple Reflex Agent**: Selects action on the basis of current percept, ignores percept history. It **maps percepts to actions using condition-action rules**. Example: if `car-in-front-is-braking`, then `initiate-braking`. A simple reflex agent looks for the rule whose condition matches the current situation as defined by the percept, and then does the action associated with that rule.
    * Disadvantages: Limited applicability since it only uses the current percept, not the percept history.
  * **Model-Based Reflex Agent**: A type of reflex agent but with an **internal state** that keeps track of the part of the world it cannot see now. This agent uses percept history as basis of its actions and maintains internal state information to distinguish between world states that generate the same perceptual input but requiring different actions.
    * Two types of information are needed to maintain the internal state: (1) **how the world evolves** (i.e., information about how the world changes independently of the agent; must be built-in knowledge), and (2) **how the agent's actions affect the world**.
  * **Goal-Based Agent**:
  * **Utility-Based Agent**:
  * **Learning Agent**:


## Problem Solving by Search
