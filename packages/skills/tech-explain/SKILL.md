---
name: tech-explain
description: Explain unfamiliar technologies with a concise framework. Use when the user asks what a technology is, why it exists, how it works, where it fits, what usually goes with it, or what alternatives solve similar problems.
license: MIT
metadata:
  author: "alexpham"
  repository: "git@github.com:duyphaphach/agent-skills.git"
  version: "1.0.0"
  keywords: "ai, agent, skill, technology, explanation, framework, ecosystem, alternatives, real-life reference"
---

# Tech Explain

## When to use

Use this skill when the user asks about a technology, tool, protocol, platform, framework, language, database, architecture pattern, or infrastructure concept and wants a clean explanation instead of a tutorial.

Examples:

- "What is Kafka?"
- "Why does gRPC exist?"
- "How does WebRTC work?"
- "Where does Redis fit in a system?"
- "What usually goes with Kubernetes?"

## Response style

- Be concise by default.
- Do not over-explain unless the user asks for depth.
- Start with the clearest mental model, not jargon.
- Prefer short, direct wording over textbook definitions.
- If the term is ambiguous, use the most common meaning and state the assumption briefly.
- If the topic is genuinely complex, keep the main answer compact and add optional sections only when they add signal.

## Required framework

Always cover these sections.

### Why

Must include:

- Why it exists
- Brief history
- One interesting fact

### What it is

Must include:

- `TLDR`
- `Details`

### How it works

Must include:

- `TLDR`
- `Details`

### Where it fits

Must include:

- `TLDR`
- `Details`

### Related, complementary techs

Must include:

- The ecosystem that usually goes with this technology
- The nearby tools, protocols, platforms, or patterns it commonly pairs with

## Optional framework

Include these only when the topic is complex enough, the user asks for them, or they materially improve the answer.

### Benefits and trade-offs

Include:

- `Benefits`
- `Trade-offs`

### Alternatives

Include:

- Other technologies that solve similar problems
- A short note on when someone would choose them instead

## Extending thoughts

Use this as a short closing section when helpful. Good uses:

- common misunderstandings
- what people often learn next
- adoption caveats
- how the technology is evolving

Skip it if it would just repeat earlier points.

## Output shape

Use this structure as the default:

```markdown
## Why
- ...

## What it is
**TLDR:** ...

Details: ...

**Real Life Reference/Inspired By**:...

## How it works
**TLDR:** ...

Details: ...

## Where it fits
**TLDR:** ...

Details: ...

## Related tech
- ...
```

Add optional sections after the required ones when needed.
