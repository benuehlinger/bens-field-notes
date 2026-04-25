# Post Frontmatter Contract

Every `.qmd` file under `posts/` MUST include the following YAML frontmatter.

---

## Required Fields

```yaml
---
title: "Your Post Title"
date: 2026-04-25
description: "One or two sentences. Appears in the listing index and link previews."
---
```

## Optional Fields

```yaml
---
title: "Your Post Title"
date: 2026-04-25
description: "One or two sentences."

# Topic tags — use lowercase kebab-case
# Valid values: consumer-credit, credit-risk, macro, banking,
#               auto-loans, structured-finance, methodology, sloos, fred
categories:
  - consumer-credit
  - auto-loans

# Post type — informal, not enforced by the site build
# Valid values: deep-dive, signal-watch, explainer, credit-risk, notebook
type: deep-dive

# Set to true to exclude from listing while working
draft: false

# Optional thumbnail for listing card (relative path from post dir)
image: thumbnail.png
---
```

## Directory Convention

Posts live at `posts/YYYY-MM-DD-slug/index.qmd`.

```text
posts/
└── 2026-04-25-autoloan-delinquency-q1/
    ├── index.qmd       ← the post
    └── thumbnail.png   ← optional
```

The directory date prefix is the canonical publication date.
The slug should be descriptive but concise: `autoloan-delinquency-q1` not
`a-deep-dive-into-the-state-of-the-autoloan-market-in-q1-2026`.
