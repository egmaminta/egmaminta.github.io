---
title: "Agent Carpentry: The Great AI Engineering Shift (2022–2026)"
date: 2026-04-08 13:13:13 +0800
categories: [Agents]
tags: ["prompt engineering", "context engineering", "harness engineering", "ai engineering", "agents"]
author: "egmaminta"
description: "Building reliable AI systems requires infrastructure, not just better prompts or context."
---

Ten years ago, I was just reading about discriminative ML. I remember being completely amazed by decision trees and gradient boosting. Now, I'm orchestrating production-grade multi-agent systems and wiring up VLMs. The work has shifted from pure theory to something that feels a lot more like manual labor.

It's funny because it suddenly reminds me of my Dad. On paper, he's an engineer and a technician. He reads the diagrams and designs the electronic circuits. But if you ask Mom about the sheer number of bespoke amplifiers taking up space in our house, she'll tell you his real art is in his hands. He is a craftsman. He builds.

I realized today that my current work has become exactly that. It's completely disjointed from the pure theory I've been focusing on for my PhD. Wiring up a `docker-compose` file for a microservice or building a retry loop isn't theoretical; it is digital carpentry.

An LLM isn't a finished product; it is simply the highest-grade raw material we have ever had access to. But no matter how good the timber is, a house doesn't build itself. The real craft is building the harness—the scaffolding, the error handling, the state management—that turns that raw potential into a reliable system.

The language of AI engineering has shifted three times in four years. In 2023, everyone talked about prompt engineering. By 2025, the conversation moved to context engineering. Today in 2026, the focus is on harness engineering.

Each shift reflects a deeper understanding of what it takes to make AI work in production. These changes point toward a practical conclusion: building reliable AI systems requires infrastructure, not just better prompts or context.

Agent carpentry is the work of building that infrastructure.

## Prompt Engineering (2022–2024)

OpenAI released ChatGPT to the public on November 30, 2022 [\[1\]](https://openai.com/index/chatgpt/). People discovered they could talk to machines, and the results varied widely. Some users got useful responses. Others got nonsense. The difference lay in how they framed their requests.

This observation sparked a new discipline. Within days of ChatGPT's release, users on Twitter were sharing prompt templates and tricks that reliably produced better outputs. Riley Goodside (@goodside) became one of the most prominent early voices: on December 1, he showed ChatGPT explaining bubble sort in the voice of a 1940s gangster [\[2\]](https://x.com/goodside/status/1598129631609380864), and on December 4, a single tweet framing ChatGPT as a workplace shortcut for a panicking Twitter engineer went viral with over 54,000 likes [\[3\]](https://x.com/goodside/status/1599082185402642432). Reddit threads and LinkedIn posts followed within days. LinkedIn job postings for "Prompt Engineer" appeared in January 2023, with some offering up to $335,000 per year. Udemy and Coursera courses on the topic reached number one bestseller status by February 2023. Google Trends data shows the term went from obscurity to mainstream in 60 days [\[4\]](https://trends.google.com/trends/explore?q=prompt+engineering).

Prompt engineering treated the model as a black box that could be guided with the right wording. For simple tasks, this approach worked. For complex workflows, it failed. By 2024, companies realized that prompt tweaking could not make a model access databases, execute code, or maintain memory across sessions. The industry needed a different approach.

The discipline did not vanish. It became a sub-module of what came next.

## Context Engineering (2025)

Prompt engineering focused on what you ask. Context engineering focuses on what the model knows when you ask.

The shift gained momentum in June 2025. On June 19, Shopify CEO Tobi Lütke posted on X: "I prefer 'context engineering' over 'prompt engineering'. Context engineering is the art of providing all the context for the task to be plausibly solvable by the LLM" [\[5\]](https://x.com/tobi_lutke/status/1935533422589399127). The next day, Andrej Karpathy responded: "Context engineering is the delicate art and science of filling the context window with exactly the right information, at exactly the right time" [\[6\]](https://x.com/karpathy/status/1937902205765607626). Google Trends data shows the spike beginning June 19, 2025 [\[7\]](https://trends.google.com/trends/explore?q=context+engineering).

The industry had moved from chatbots to agentic systems that run multi-step workflows, call tools, and execute tasks autonomously. In this environment, the prompt mattered less than the context: what data the model sees, what tools it can access, what conversation history is relevant, and what user preferences apply. Context engineering became the discipline of building systems to assemble the right information dynamically through RAG pipelines, memory systems, tool orchestration, and conversation state management.

By late 2025, context engineering reached its limits. Managing context proved necessary but not sufficient. A model could receive all the right context and still fail to run reliably in a loop, handle errors, verify its own work, or recover from failures. The industry needed a broader approach.

Again, the earlier layer did not disappear. It became part of a larger structure.

## Harness Engineering (2026–Present)

February 2026 marked the next pivot. On February 4, OpenAI published a blog post titled "Unlocking the Codex harness: how we built the App Server" [\[8\]](https://openai.com/index/unlocking-the-codex-harness/). On February 11, OpenAI's Ryan Lopopolo published "Harness engineering: leveraging Codex in an agent-first world" [\[9\]](https://openai.com/index/harness-engineering/). The term spread across Twitter and LinkedIn within 48 hours.

A harness is the complete software infrastructure wrapping an LLM. It includes the orchestration loop for multi-step reasoning, tools with function schemas and validation, memory systems for short-term and long-term persistence, context management with compaction and retrieval, prompt construction, output parsing, state management with checkpointing, error handling with retry logic, guardrails and safety controls, verification loops, and subagent orchestration.

Compare it to the shift toward microservices. Just as `docker-compose` transformed a messy web of disparate scripts into a reproducible architecture, the harness does the same for an agent. When an agentic VLM fails to parse visual input or crashes during a multi-step navigation task, the harness's state management and retry logic catches the failure and keeps the system alive.

The stakes grow higher with physical embodiment. A digital agent crashing throws a Python exception. An embodied agent failing means a robot drives full-speed into a wall. The true test of a modern harness is orchestrating the latency gap between a massive remote VLM calculating a trajectory and a lightweight edge device publishing navigation commands to motors. Hardware-in-the-loop orchestration and edge deployment turn the harness into the single point of failure in the real world, not the model itself.

LangChain's TerminalBench 2.0, released in March 2026, demonstrated the impact. Changing only the harness while keeping the same model moved an agent from outside the top 30 to rank 5 [\[10\]](https://benchlm.ai/benchmarks/terminalBench2). The model was no longer the differentiator. The harness was.

Companies now seek people who can build reliable orchestration loops, design robust error recovery, implement verification systems, create scalable memory architectures, and integrate tools safely. This is agent carpentry: the craft of building structures that make AI work in production.

## The Evolution Timeline

| Era          | Discipline          | Focus                                | Viral Period        | Key Catalyst                            |
| ------------ | ------------------- | ------------------------------------ | ------------------- | --------------------------------------- |
| 2022–2024    | Prompt Engineering  | Crafting instructions                | Dec 2022 – Mar 2023 | ChatGPT release + viral Twitter threads |
| 2025         | Context Engineering | Managing what the model sees         | Jun 2025            | Tobi Lütke + Andrej Karpathy            |
| 2026–Present | Harness Engineering | Building the complete infrastructure | Feb 2026            | OpenAI blog + LangChain                 |

## Why Each Shift Happened

### Prompt to Context (2022 to 2025)

Practitioners realized that prompt engineering could not compensate for missing capabilities. As AI moved from single-turn chats to multi-step workflows, what you asked mattered less than what information the model had access to.

### Context to Harness (2025 to 2026)

Practitioners realized that context management alone could not ensure reliability. As models crossed the capability threshold for autonomous agents, the focus shifted from managing context to building the entire infrastructure that makes agents reliable at scale. AutoGPT failed in 2023 because models were not ready. By 2026, the infrastructure caught up.

## Agent Carpentry: The Craft of Building AI

I use the term "agent carpentry" to describe this work, though the metaphor creates friction. A harness is dynamic. It straps around a beast of burden to direct its raw power and constrain it. Carpentry is static. It involves cutting dead wood to build rigid structures. They do not belong in the same workshop.

The resolution is straightforward. The harness is the product of the carpentry. Carpenters build scaffolding, joints, and load-bearing frames. Those static structures hold dynamic forces in place. In agent systems, the carpentry builds the scaffolding, joints, and framework that hold the dynamic model in place.

In 2026, we are not trying to coax models into brilliance with clever prompts. We are not just managing context windows. We are building the infrastructure that makes AI work in the real world. We are carpenters building the structures of intelligence.

## The Commoditization of Intelligence

If harness engineering is the present, the economics of AI dictate what happens next.

Jason Wei, co-creator of Chain-of-Thought reasoning and former OpenAI o1 model lead, noted in his 2025 Stanford AI Club talk that intelligence is becoming increasingly cheap and accessible [\[11\]](https://www.youtube.com/watch?v=l898fqkjdFc). The cost of AI performance on tasks is dropping dramatically each year.

The numbers show this trend:
- December 2023: GPT-4 cost $30 per million tokens [\[12\]](https://openai.com/api/pricing/)
- 2024: GPT-4o dropped to $2.50/mTok, a 92% reduction in one year [\[13\]](https://openai.com/api/pricing/)
- 2025: Gemini 1.5 Flash 8B hit $0.0375/mTok, 27x cheaper than GPT-3.5 Turbo [\[14\]](https://cloud.google.com/vertex-ai/generative-ai/pricing)
- 2026: DeepSeek and other open-source models are driving prices even lower [\[15\]](https://www.deepseek.com/)

This is classic commoditization. Knowledge retrieval that once took hours or days now happens instantly. When intelligence costs pennies, it becomes infrastructure rather than a competitive advantage.

Wei also articulated what he calls the Verifier's Law: the time to calculate an answer to a problem is directly proportional to how easily it can be verified [\[16\]](https://www.youtube.com/watch?v=b6Doq2fz81U). Tasks with clear, measurable outcomes like math, coding, and logic puzzles see rapid AI progress. Tasks that are hard to verify, such as creative works and subjective judgments, progress slower.

This matters for harness engineering because verification loops are now a core component of production harnesses. The best harnesses do not just run agents. They verify their work. LangChain's TerminalBench 2.0 showed that harness improvements alone could move an agent from outside the top 30 to rank 5 [\[10\]](https://benchlm.ai/benchmarks/terminalBench2). The difference was the verification infrastructure, not the model.

## The Endpoint: Invisible Intelligence

The ultimate goal of harness engineering is not to create better AI. It is to make AI invisible. When you use electricity, you do not think about where the power comes from, how the grid manages load, or what transformers step down voltage. You just use it. AI is heading in the same direction. By 2027–2028, the question will not be "what harness are you using?" It will be "what did you build?"

## What This Means for Engineers

If AI becomes a utility, the focus shifts from raw capability to reliability, design, and user experience. Models do not compete on raw capability because they are all good enough. Harnesses compete on reliability, integration, and user experience.

In a world of commoditized AI, value comes from domain expertise, workflow integration, data flywheels, user experience, and trust and safety. The companies that win will not be the ones with the best models. They will be the ones with the best harnesses, the ones that make AI feel like water from a tap.

Carpentry does not disappear when building materials become commoditized. It evolves. Nineteenth century carpentry involved hand-crafting every beam and joint. Twentieth century carpentry used standardized lumber and tools. Twenty-first century carpentry relies on prefab components, modular design, and rapid assembly. The craft remains. The materials change.

The next terminology shift will not be about a new engineering discipline. It will be about forgetting the discipline altogether. When AI is truly a utility, nobody will say "I'm a harness engineer." They will say "I build products." That is the point.

## Conclusion

Prompting taught us how to talk to these models, and context engineering taught us how to feed them. But building reliable systems—turning raw intelligence into a product that actually works when you deploy it—requires a harness. The craft remains while the materials change, and the goal is always the same: build something useful. That is agent carpentry.

*Thanks for reading. If you found this useful, share it with someone building AI agents.*

## References

[1] OpenAI. (November 30, 2022). "ChatGPT is now available to everyone". https://openai.com/index/chatgpt/

[2] Goodside, R. (December 1, 2022). "OpenAI's new ChatGPT explains the worst-case time complexity of the bubble sort algorithm... in the style of a fast-talkin' wise guy from a 1940's gangster movie". X (Twitter). https://x.com/goodside/status/1598129631609380864

[3] Goodside, R. (December 4, 2022). "POV: You're a Senior Data Engineer at Twitter. Elon asks what you've done this week. You've done nothing. Frantically, you open ChatGPT.". X (Twitter). https://x.com/goodside/status/1599082185402642432

[4] Google Trends. (2023). Search interest for "prompt engineering". https://trends.google.com/trends/explore?q=prompt+engineering

[5] Lütke, T. (June 19, 2025). "I prefer 'context engineering' over 'prompt engineering'...". X (Twitter). https://x.com/tobi_lutke/status/1935533422589399127

[6] Karpathy, A. (June 20, 2025). "Context engineering is the delicate art and science...". X (Twitter). https://x.com/karpathy/status/1937902205765607626

[7] Google Trends. (2025). Search interest for "context engineering". https://trends.google.com/trends/explore?q=context+engineering

[8] OpenAI. (February 4, 2026). "Unlocking the Codex harness: how we built the App Server". https://openai.com/index/unlocking-the-codex-harness/

[9] Lopopolo, R. (February 11, 2026). "Harness engineering: leveraging Codex in an agent-first world". https://openai.com/index/harness-engineering/

[10] LangChain. (March 2026). "TerminalBench 2.0 Results". https://benchlm.ai/benchmarks/terminalBench2

[11] Wei, J. (2025). "Some Intuitions About Large Language Models". Stanford AI Club Talk. https://www.youtube.com/watch?v=l898fqkjdFc

[12] OpenAI. (December 2023). GPT-4 Pricing. https://openai.com/api/pricing/

[13] OpenAI. (2024). GPT-4o Pricing Update. https://openai.com/api/pricing/

[14] Google DeepMind. (2025). Gemini 1.5 Flash Pricing. https://cloud.google.com/vertex-ai/generative-ai/pricing

[15] DeepSeek. (2026). DeepSeek Pricing and Open-Source Models. https://www.deepseek.com/

[16] Wei, J. (2025). "3 Key Ideas in AI". Stanford AI Club Talk. https://www.youtube.com/watch?v=b6Doq2fz81U

