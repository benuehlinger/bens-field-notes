#!/usr/bin/env python3
"""
Build the citation graph from post/paper/person frontmatter → map/graph.json.

Single source of truth: the `sources:` / `people:` / `authors:` / `key:` fields in
each .qmd's frontmatter. No external dependencies (CI-safe). Run manually or via the
Quarto pre-render hook so the graph stays in sync as pieces are added.

Nodes: posts, papers (Stacks), people (Cast) — only those that participate in an edge.
Edges: post --cites--> paper · paper --author--> person · post --mentions--> person
"""

import re
import os
import json
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_fm(path):
    txt = open(path, encoding="utf-8", errors="ignore").read()
    m = re.match(r"^---\n(.*?)\n---", txt, re.S)
    return m.group(1) if m else ""


def field(fm, key):
    """Extract a scalar or inline-list frontmatter field. No YAML dependency."""
    m = re.search(r"^" + re.escape(key) + r":\s*(.*)$", fm, re.M)
    if not m:
        return None
    v = m.group(1).strip()
    if v.startswith("[") and v.endswith("]"):
        inner = v[1:-1].strip()
        if not inner:
            return []
        return [x.strip().strip('"').strip("'") for x in inner.split(",") if x.strip()]
    return v.strip().strip('"').strip("'")


def main():
    nodes = {}
    edges = []

    # People (the Cast)
    for p in glob.glob(f"{ROOT}/people/*.qmd"):
        slug = os.path.splitext(os.path.basename(p))[0]
        if slug == "index":
            continue
        fm = read_fm(p)
        nodes[slug] = {"id": slug, "label": field(fm, "title") or slug,
                       "type": "person", "url": f"/people/{slug}.html"}

    # Papers (the Stacks) + author edges
    keymap = {}
    for p in glob.glob(f"{ROOT}/sources/*.qmd"):
        slug = os.path.splitext(os.path.basename(p))[0]
        if slug == "index":
            continue
        fm = read_fm(p)
        nodes[slug] = {"id": slug, "label": field(fm, "title") or slug,
                       "type": "paper", "url": f"/sources/{slug}.html"}
        key = field(fm, "key")
        if key:
            keymap[key] = slug
        for a in (field(fm, "by") or []):
            edges.append({"source": slug, "target": a, "rel": "author"})

    # Posts + cites / mentions edges
    for p in glob.glob(f"{ROOT}/posts/*/index.qmd"):
        folder = os.path.basename(os.path.dirname(p))
        fm = read_fm(p)
        srcs = field(fm, "sources") or []
        ppl = field(fm, "people") or []
        if not srcs and not ppl:
            continue  # not part of the citation web
        nodes[folder] = {"id": folder, "label": field(fm, "title") or folder,
                         "type": "post", "url": f"/posts/{folder}/"}
        for s in srcs:
            if s in keymap:
                edges.append({"source": folder, "target": keymap[s], "rel": "cites"})
        for person in ppl:
            edges.append({"source": folder, "target": person, "rel": "mentions"})

    # Keep only nodes that appear in an edge, and edges whose endpoints both exist
    used = {e["source"] for e in edges} | {e["target"] for e in edges}
    final_nodes = [n for k, n in nodes.items() if k in used]
    node_ids = {n["id"] for n in final_nodes}
    final_edges = [e for e in edges if e["source"] in node_ids and e["target"] in node_ids]

    os.makedirs(f"{ROOT}/map", exist_ok=True)
    with open(f"{ROOT}/map/graph.json", "w") as f:
        json.dump({"nodes": final_nodes, "edges": final_edges}, f, indent=2)

    print(f"graph: {len(final_nodes)} nodes, {len(final_edges)} edges -> map/graph.json")
    for n in sorted(final_nodes, key=lambda x: x["type"]):
        print(f"  [{n['type']:>6}] {n['label']}")


if __name__ == "__main__":
    main()
