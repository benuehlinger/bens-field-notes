---
title: 'smolagents vs LangGraph'
subtitle: 'Who’s running the agent—and where does T3 Code fit?'
description: 'Opening questions for a hands-on investigation of agent execution, control, and the tools we use to build.'
layout: ../../../layouts/Article.astro
active: learning
---

<div class="inquiry-status">Opening questions · No experiment run yet</div>

<div class="inquiry-question">
What changes when a model chooses its next action, when I explicitly define the workflow,
and when I work through a coding-agent interface such as T3 Code?
</div>

## The question before the code

I want to compare **smolagents and LangGraph** on a problem I can inspect, then understand
where **T3 Code** overlaps with that work. The first decision is what we want an agent to do
and which part of its behavior makes us curious.

This is not a race to produce a framework ranking. We will choose a small problem, form an
expectation, run one block and follow the question raised by its result. The story can change direction.

## A starting distinction to investigate

<div class="journal-table"><table><thead><tr><th>Tool</th><th>What its documentation emphasizes</th><th>A question to follow</th></tr></thead><tbody>
<tr><td><a href="https://huggingface.co/docs/smolagents/index" target="_blank" rel="noopener noreferrer">smolagents</a></td><td>A Python agent library with first-class support for expressing actions as code.</td><td>How does the agent select and execute an action, and what can I inspect?</td></tr>
<tr><td><a href="https://docs.langchain.com/oss/python/langgraph/overview" target="_blank" rel="noopener noreferrer">LangGraph</a></td><td>Stateful orchestration, with explicit state and control flow.</td><td>Which behavior do I specify, and where can the model still make decisions?</td></tr>
<tr><td><a href="https://github.com/pingdotgg/t3code" target="_blank" rel="noopener noreferrer">T3 Code</a></td><td>A control plane for working with coding agents.</td><td>Which execution responsibilities belong to T3, its underlying agent, or the system I’m building?</td></tr>
</tbody></table></div>

These are different entry points into agent work, with possible overlap in tools, state,
approvals, execution and recovery. We need to trace a concrete task before deciding which
similarities matter. “T3” here means T3 Code from the coding stack.

## How we will explore

Begin with the problem. Write one small block. Run it. Inspect the actual output and the
steps that produced it. Keep the observation and decide what to try next.

The notebook will be the working lab in VS Code. This page will become the explanation as
the investigation produces something worth showing. No notebook, benchmark or result has
been generated for this opening brief.

## Connections

- [Agents and workflows](../topics/agents-and-workflows.html): control loops, orchestration and execution state.
- [Tools and MCP](../topics/tools-and-mcp.html): what capabilities the agent can call.
- [Evaluation](../topics/evaluation.html): how to compare behavior on the same problem.
- [Software and data](../topics/software-and-data.html): understanding the code around the model.

## Primary sources

- [smolagents documentation](https://huggingface.co/docs/smolagents/index)
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [T3 Code repository](https://github.com/pingdotgg/t3code)

Documentation checked 25 November 2026. The next step is choosing the problem together.
