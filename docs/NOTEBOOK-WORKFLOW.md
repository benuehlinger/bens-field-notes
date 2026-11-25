# From a question to a notebook story

Ben wants an exploratory conversation, with code added one block at a time in VS Code. The website is where the explanation develops. A complete prewritten notebook would skip the learning experience.

## Before creating a notebook

Choose the problem together: what Ben wants to understand, a small task that exposes it, and behavior we can inspect. The first inquiry compares smolagents and LangGraph and asks where T3 Code overlaps. The opening page contains questions, not a chosen benchmark or a claimed result.

The first block can be Markdown when the question needs sharpening. Create the notebook and environment when Ben asks to begin, rather than scaffolding a whole lesson in advance.

## One step of the investigation

1. State the immediate question and current expectation.
2. Add the smallest useful cell or block.
3. Run it in the selected VS Code notebook kernel when execution is authorized.
4. Inspect the real intermediate output and any failure. Explain the mechanics Ben wants to understand.
5. Keep a short observation, then let Ben's curiosity determine the next block.

A failed approach can become the most useful part of the story. Preserve what changed in the explanation and the evidence for it.

## Keep the code and story close

Quarto can render a saved Jupyter `.ipynb`, including Markdown and outputs. Once the first notebook exists, choose authoring and render settings around the actual experiment. Prefer one canonical notebook to manually copying cells into a second article. A short `.qmd` introduction can link to it when useful.

Saved output establishes a previous run. Publishing a saved notebook and re-executing it are separate operations; keep versions and run conditions with the result. Build-time execution should be explicit when it uses paid APIs or external state.

See [Quarto's Jupyter guide](https://quarto.org/docs/tools/jupyter-lab.html) and [VS Code notebook guide](https://quarto.org/docs/tools/vscode-notebook.html) when configuring the first actual notebook. No notebook or kernel is created by this guide.

## Shape the explanation as it emerges

- Start a section with the question it answers.
- Keep code that explains the result visible or easy to expand; keep setup out of the reading path.
- Show intermediate tables, execution traces and small diagrams when they expose the mechanism.
- Compare the same task, inputs, tools and scoring conditions when the question requires it.
- Label toy examples and single runs honestly. Separate documented capabilities from observed behavior.
- Keep the remaining uncertainty and next question visible.

## Make it worth reading

Use the site's sans typography, generous spacing, bounded code blocks, clear figure titles and consistent captions. Give a figure full width when it helps. Keep installation logs and huge object dumps out of the main narrative.

Choose a workflow diagram, trace, aligned comparison or quantitative chart according to the relationship it should reveal. Vercel is a reference for technical clarity and restraint; the content remains a personal investigation.

Keep unfinished or private scratch outside public render targets. Review notebook source and saved outputs before publishing: hiding a cell in HTML is a presentation choice, not a privacy boundary.

## Completion for a notebook session

Ben has a real file open in VS Code, knows the selected kernel, understands the block just added and can inspect the actual result. He chooses the next question. A polished final article is not required after every session.
