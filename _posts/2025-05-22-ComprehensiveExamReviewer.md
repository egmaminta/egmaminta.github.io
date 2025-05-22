---
title: "Artificial Intelligence Program Comprehensive Examination Reviewer (Part 1)"
description: "A reviewer in preparation for the comprehensive examination of the graduate students enrolled in the Artificial Intelligence Program, which they are required to pass as part of the Master's of Engineering in Artificial Intelligence degree completion requirements. This part covers the following courses: Fundamentals of Artificial Intelligence (AI 201), Computational Linear Algebra for AI (AI 211), and Probability and Statistics for AI (AI 212)."
author: "egmaminta"
date: 2025-05-22 14:06:00 +0800
categories: [Study Materials]
tags: [comprehensive exam, review, study guide]
math: true
toc: true
---

## Intelligent Agents
### Agent and Environment
* What is an agent?
  * An agent is a system that **perceives its environment through its sensors and acts on that environment through its effectors**.
* What are "percepts"?
  * Percepts are the **sensory inputs** that an agent receives from its environment.
* What are "effectors"?
  * Effectors are the components an agent uses **to perform actions** in its environment.
* Can you give examples of agents, their sensors, and effectors?
  * Human agent
    * Sensors: Eyes, ears, skin, etc.
    * Effectors: Hands, legs, vocal cords, etc.
  * Robot agent
    * Sensors: Cameras, LIDAR, ultrasonic sensors, etc.
    * Effectors: Motors, wheels, arms, etc.
  * Software agent
    * Sensors: Network interfaces, APIs, etc.
    * Effectors: API calls, database updates, etc.
* What defines a rational agent?
  * A rational agent is one that **acts to achieve its goals, given its beliefs**.
* What is a "performance measure"?
  * A performance measure is a **criterion that indicates how successful an agent has been**. For example, for a vacuum cleaner agent, it could be the amout of dirt cleaned up in a day, also considering electricity consumed, noise generated, and time taken.
* What factors influence what is rational for an agent at any given time?
  * Rationality depends on (1) **the performance measuring defining success**, (2) **the agent's perceptual history** (i.e., the sequence of all percepts it has experienced so far), (3) **the agent's knowledge of the environment**, and (4) **the actions that the agent can perform**.
* What is the difference between rationality and perfection?
  * **Rationality aims to maximize the *expected* performance**, while **perfection aims to maximize the *actual* performance** (which is only achievable in an ideal, fully known environment).
* What is "information gathering" in the context of rational agents?
  * It refers to actions taken by an agent to modify its future percepts, like **exploration** to learn about an unknown environment. This is a part of rationality.
* How is an "Ideal Rational Agent" defined?
  * For **every possible percept sequence**, an ideal rational agent should **perform the action that is expected to maximize its performance measure**, based on the **evidence from the percept sequence and its built-in knowledge**.
* What is "autonomy" in AI?
  * In AI, autonomy is the **ability of an agent to adapt to its environment and be flexible**. A system is autonomous to the extent that **its behavior is determined by its own experience, rather than relying solely on built-in knowledge**. An agent that completely disregards its environment lacks autonomy (e.g., a simple clock).
* What is the basic structure of an intelligent agent?
  * An agent consists of an **architecture** (i.e., the computing device) and an **agent program** (i.e., the implementation of the mapping from percepts to actions). So, $\text{Agent} = \text{Architecture} + \text{Agent Program}$.
* What does PEAS stand for, and can you give an example?
  * PEAS stands for **Performance measure, Environment, Actuators, and Sensors**. For example, for a vacuum cleaner agent:
    * Performance measure: Amount of dirt cleaned, electricity consumed, noise generated, time taken
    * Environment: The room to be cleaned
    * Actuators: Motors, wheels, arms
    * Sensors: Cameras, ultrasonic sensors
  
### Types of Agents
* What is a Table-Driven Agent?
  * This agent stores the entire percept sequence in memory and uses it to look up the appropriate action in a table that contains all possible sequences and their corresponding actions.
* What are the drawbacks of Table-Driven Agents?
  * The table can be extremely large (e.g., chess has an estimated $10^{120}$ possible entries).
  * It is very time-consuming, if not impossible, for the designer to create the table.
  * It lacks autonomy as the knowledge is entirely built-in.
  * It cannot act rationally if the environment changes in an unforeseen way.
  * Learning all table entries would take an extremely long time.
* What is a Simple Reflex Agent?
  * This agent selects actions based only on the ***current*** percept, ignoring the rest of the percept history. It uses **condition-action rules** (e.g., "if `<condition>` then `<action>`") to determine its actions. It works efficiently but has limited applicability as it only reacts to the current percept.
* What is a Model-Based Reflex Agent?
  * This agent maintains an **internal state** to keep track of the parts of the world it cannot currently see. This internal state helps distinguish world states that might appear the same from current percepts but require different actions. It uses its perceptual history. It needs the following components:
    * An **action model** (information about how the agent's actions affect the world).
    * A **sensor model** (information about how the world's state is reflected in the percepts).
    * A **transition model** (information about how the world changes independently of the agent).
* What is a Model-Based Goal-Based Agent?
  * This agent incorporates goal information to decide its actions, considering the future. Achieving a goal often requires considering long sequences of actions, which involves **planning** (finding action sequences to reach the goal).
* How do Reflex Agents differ from Goal-Based Agents in achieving goals and flexibility?
  * Reflex agents achieve goals because **the designer precomputed the correct actions**. They are **very efficient but lack flexibility**. In contrast, goal-based agents **consider the future outcomes of actions to select one that achieves the goal**. They are **more flexible but less efficient**.
* What is a Model-Based Utility-Based Agent?
  * This agent uses a **utility function** that maps a state to a real number, representing a degree of "happiness" or desirability. This is useful when there are multiple, possibly conflicting, goals (e.g., speed vs. safety in a taxi). The agent chooses the **action sequence that yields the maximum utility**.
* What is a Learning Agent?
  * Any type of agent (model-based, goal-based, utility-based, etc.) can incorporate learning capabilities. Components of a learning agent include:
    * **Learning element**: Improves the performance element.
    * **Performance element**: Selects actions based on the current percept and built-in knowledge.
    * **Critic**: Provides feedback to the learning element about how well the agent is performing.
    * **Problem generator**: Suggests actions that will lead to new and informative experiences.
* What are the different types of agents?
  * There are 6 (six) main types of agents: table-driven agents, simple reflex agents, model-based reflex agents, model-based goal-based agents, model-based utility-based agents, and learning agents.

### Properties of Environments
* What is the role of the environment?
  * The environment provides percepts to the agent and receives actions from the agent.
* Describe the "Fully vs. Partially Observable" property of environments.
  * In a **fully observable environment**, an agent's sensors give it access to the complete state of the environment at each point in time. The agent doesn't need to maintain an internal state to track the world. In contrast, in a **partially observable environment**, part of the state is not measured by sensors, or sensors are noisy/inaccurate. The agent needs to maintain an internal state.
* Describe the "Single-Agent vs. Multi-Agent" property of environments.
  * In a **single-agent environment**, there is only one agent operating by itself in an environment. On the other hand, in a **multi-agent environment**, multiple agents are operating in the same environment, which can be cooperative or competitive (adversarial).
* Describe the "Deterministic vs. Stochastic" property of environments.
  * In a **deterministic environment**, the next state of the environment is completely determined by the current state and the agent's action. Chess is an example. In contrast, in a **stochastic environment**, there's uncertainty. A partially observable environment might appear stochastic even if it's technically deterministic. Poker is stochastic from the agent's view due to hidden cards. It's best to consider this from the agent's perspective.
* Describe the "Episodic vs. Sequential" property of environments.
  * In an **episodic environment**, the agent's experience is divided into atomic **episodes**. Each episode consists of the agent perceiving and then performing a single action. The choice of action in one episode only depends on that episode itself, as subsequent episodes don't depend on previous actions. These are easier to deal with as planning is limited to one episode. Example: A chest x-ray analyzer. While in a **sequential environment**, the current decision can affect all future decisions. Example: Chess.
* Describe the "Static vs. Dynamic" property of environments.
  * In a **static environment**, the environment does not change while the agent is deliberating. Example: Chess. In contrast, in a **dynamic environment**, the environment can change while the agent is deliberating. The agent needs to keep sensing. Example: Taxi driving. In a **semi-dynamic environment**, the environment itself doesn't change with time, but the agent's performance measure does. Example: Chess with a clock.
* Describe the "Discrete vs. Continuous" property of environments.
  * In a **discrete environment**, there is a limited, finite number of distinct, clearly defined percepts and actions. On the other hand, in a **continuous environment**, percepts and actions can take values from a continuous range (e.g., temperature, speed).
* What is an "environment class"?
  * An **agent should ideally be designed to work for a whole set of different environments**, referred to as an environment class. For instance, a chess program should be suited for a tournament, not just a single, specific opponent.
* What are the properties of environments?
  * The properties of environments include **fully vs. partially observable**, **single-agent vs. multi-agent**, **deterministic vs. stochastic**, **episodic vs. sequential**, **static vs. dynamic**, and **discrete vs. continuous**.

## Problem Solving by Search
