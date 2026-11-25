#!/usr/bin/env python3
"""Generate the field guide from portable, reviewed content records."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'content/sources.json').read_text())
AREAS = json.loads((ROOT / 'content/areas.json').read_text())
QUESTIONS = json.loads((ROOT / 'content/questions.json').read_text())
SOURCES = DATA['sources']
BY_ID = {}
for source in SOURCES:
    for key in [source['id'], *source.get('aliases', [])]:
        BY_ID[key] = source
BY_TAG = {a['tag']: a for a in AREAS}

ALIASES = {
    'openai-python': 'oai-python', 'openai-quickstart': 'oai-quickstart',
    'openai-responses': 'oai-responses', 'openai-prompting': 'oai-prompting',
    'openai-structured': 'oai-structured', 'openai-agents-sdk-python': 'oai-agents-python',
    'openai-agents-guide': 'oai-agents', 'openai-deprecations': 'oai-deprecations',
    'openai-retrieval': 'oai-retrieval', 'openai-eval-best-practices': 'oai-eval-practice',
    'openai-realtime': 'oai-realtime', 'openai-vision': 'oai-vision',
    'openai-production': 'oai-production', 'openai-latency': 'oai-latency',
    'openai-safety': 'oai-safety', 'mcp-inspector': 'project-mcp-inspector',
    'peft': 'project-peft', 'trl': 'project-trl', 'vllm': 'project-vllm',
    'haystack': 'project-haystack', 'promptfoo': 'project-promptfoo',
    'inspect-ai': 'project-inspect'
}


def esc(value):
    return html.escape(str(value), quote=True)


def source(key):
    return BY_ID[ALIASES.get(key, key)]


def anchor(label, url, cls=''):
    external = ' target="_blank" rel="noopener noreferrer"' if url.startswith('https://') else ''
    return f'<a href="{esc(url)}" class="{cls}"{external}>{esc(label)}</a>'


def raw(value):
    return '\n```{=html}\n' + value.strip() + '\n```\n'


def write(path, title, subtitle, body, toc=False):
    file = ROOT / path
    file.parent.mkdir(parents=True, exist_ok=True)
    front = f'---\ntitle: {json.dumps(title)}\nsubtitle: {json.dumps(subtitle)}\ntoc: {str(toc).lower()}\n'
    if not toc:
        front += 'page-layout: full\n'
    content = front + '---\n\n' + body.strip() + '\n'
    if not file.exists() or file.read_text() != content:
        file.write_text(content)


def modes(active):
    items = [('learn', 'index', 'Learn', 'Understand and practice'),
             ('keep-up', 'keep-up', 'Keep up', 'Follow what matters'),
             ('get-involved', 'get-involved', 'Get involved', 'Bring work to people')]
    return '<nav class="mode-nav" aria-label="Explore AI engineering">' + ''.join(
        f'<a href="/ai-engineering/{file}.html" data-mode-link="{key}"'
        + (' aria-current="page"' if key == active else '')
        + f'><span>{label}</span><small>{desc}</small></a>' for key, file, label, desc in items
    ) + '</nav>'


def matches_area(area, record):
    selected = {source(key)['id'] for key in area['sources']}
    text = ' '.join([record['name'], *record['topics']]).lower()
    return record['id'] in selected or any(term in text for term in area['source_terms'])


def source_atlas():
    kinds = [('official', 'Docs', 'docs'), ('course', 'Courses', 'courses'),
             ('project', 'Projects', 'projects'), ('community', 'Communities', 'people'),
             ('publication', 'Publications', 'publications'), ('research', 'Research', 'research')]
    topics = []
    for a in AREAS:
        records = [s for s in SOURCES if matches_area(a, s)]
        curated = [source(key)['id'] for key in a['sources']]
        records.sort(key=lambda s: (s['id'] not in curated,
                                  curated.index(s['id']) if s['id'] in curated else 0))
        topics.append(dict(id=a['tag'], title=a['name'], description=a['point'],
                           question=a['checkpoint'], connection=a['connection'],
                           guide=f'topics/{a["slug"]}.html',
                           sources=[s['id'] for s in records]))
    dataset = dict(topics=topics,
                   kinds=[dict(id=key, label=label, color=color) for key, label, color in kinds],
                   sources={s['id']: {key: s[key] for key in ['name', 'url', 'why', 'source_type']}
                            for s in SOURCES})
    maximum = ((max(len(t['sources']) for t in topics) + 9) // 10) * 10
    view = '<section class="atlas atlas-explorer" id="source-atlas" aria-labelledby="atlas-title">'
    view += '<div class="atlas-heading"><div><h2 id="atlas-title">Follow your curiosity.</h2><p>Explore twelve areas of AI engineering. Select a topic or a source type.</p></div>'
    view += f'<a href="library.html" class="atlas-library">All {len(SOURCES)} sources <span aria-hidden="true">↗</span></a></div>'
    view += '<div class="atlas-legend" aria-label="Filter the chart by source type" hidden><button type="button" data-atlas-kind="all" aria-pressed="true">All sources</button>'
    for kind, label, color in kinds:
        view += f'<button type="button" data-atlas-kind="{kind}" aria-pressed="false"><i style="background:var(--{color})" aria-hidden="true"></i>{label}</button>'
    view += '</div><div class="atlas-layout"><div class="atlas-plot">'
    view += '<div class="atlas-axis" aria-hidden="true"><span>Topic</span><div class="atlas-ticks">'
    view += ''.join(f'<span style="left:{i * 25}%">{maximum * i // 4}</span>' for i in range(5))
    view += '</div><span>Refs</span></div>'
    for a, topic in zip(AREAS, topics):
        records = [BY_ID[key] for key in topic['sources']]
        total = len(records)
        view += f'<div class="atlas-row" data-atlas-row="{a["tag"]}">'
        view += f'<a href="{topic["guide"]}" class="atlas-label" data-atlas-topic="{a["tag"]}">{esc(a["name"])}</a>'
        view += '<div class="atlas-track"><div class="atlas-grid" aria-hidden="true">' + ''.join(f'<i style="left:{i * 25}%"></i>' for i in range(5)) + '</div>'
        view += f'<div class="atlas-bar" style="width:{total / maximum * 100:.3f}%">'
        for kind, label, color in kinds:
            count = sum(s['source_type'] == kind for s in records)
            if count:
                desc = f'{a["name"]}: {count} {label.lower()}'
                view += f'<a class="atlas-segment" href="library.html?topic={a["tag"]}&amp;type={kind}" data-atlas-segment="{a["tag"]}" data-kind="{kind}" style="flex:{count};background:var(--{color})" aria-label="{esc(desc)}" title="{esc(desc)}"></a>'
        view += f'</div></div><span class="atlas-total">{total}</span></div>'
    view += '<div class="atlas-readout" id="atlas-readout" role="status" aria-live="polite">Select a topic, or a color within it.</div></div>'
    view += '<div class="atlas-detail" id="atlas-detail" role="region" aria-label="Selected topic" hidden></div></div>'
    view += f'<div class="atlas-caption"><span>{len(SOURCES)} sources · Checked 25 Nov 2026</span><span>A source can belong to several topics. Counts describe this collection, not progress or quality.</span></div>'
    view += '<script type="application/json" id="atlas-data">' + json.dumps(dataset, ensure_ascii=False).replace('</', '<\\/') + '</script></section>'
    return view


def source_list(ids, context=None):
    rows = []
    for key in ids:
        s = source(key)
        note = context.get(key) if context else s['why']
        rows.append(f'<li><div>{anchor(s["name"], s["url"])}<small>{esc(s["kind"])}</small></div><p>{esc(note)}</p></li>')
    return '<ul class="annotated-sources">' + ''.join(rows) + '</ul>'


def generate_learn():
    groups = [
        ('Build a mental model', 'What does the model do, and what surrounds it?', ['foundations', 'context', 'openai']),
        ('Connect it to the world', 'Where do evidence, tools and control come from?', ['retrieval', 'mcp', 'agents']),
        ('Measure and improve', 'What failed, and which change would help?', ['evals', 'adaptation']),
        ('Make it useful', 'How does it become a dependable part of someone’s work?', ['multimodal', 'production', 'security', 'product'])
    ]
    fieldmap = '<details class="guide-index"><summary><span>Browse the field guides</span><small>Twelve subjects, with ideas and experiments to explore</small></summary><div class="field-map">'
    for label, question, tags in groups:
        fieldmap += f'<section class="field-column"><h3>{label}</h3><p>{question}</p><ul>'
        for tag in tags:
            a = BY_TAG[tag]
            fieldmap += f'<li>{anchor(a["name"], "topics/" + a["slug"] + ".html")}<span>{esc(a["point"])}</span></li>'
        fieldmap += '</ul></section>'
    fieldmap += '</div></details>'
    questions = '<div class="question-grid">'
    for q in QUESTIONS:
        url = q.get('investigation', 'questions.qmd#' + q['id']).replace('.qmd', '.html')
        questions += f'<article><h3>{anchor(q["title"], url)}</h3><p>{esc(q["description"])}</p></article>'
    questions += '</div>'
    body = raw(modes('learn')) + raw(source_atlas()) + '''
## Questions worth following
''' + raw(questions) + '''
''' + raw(fieldmap) + '''
## Find a way into the material

- **Build with OpenAI:** start with the [official quickstart](https://developers.openai.com/api/docs/quickstart), then one structured output and one tool.
- **Learn through a project:** [LLM Zoomcamp](https://github.com/DataTalksClub/llm-zoomcamp) connects retrieval, evaluation and deployment.
- **Understand agent context:** the [Hugging Face Context Course](https://huggingface.co/learn/context-course/unit0/introduction) covers skills, MCP, plugins and execution hooks.
- **Understand models:** [Karpathy’s Zero to Hero](https://karpathy.ai/zero-to-hero.html) and the [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/chapter1/1) offer deeper paths.

[Browse courses and lessons](library.html?type=course) or [explore all sources](library.qmd).
'''
    write('ai-engineering/index.qmd', 'AI engineering', 'A working understanding, one question at a time.', body)


def generate_topics():
    for a in AREAS:
        related = []
        byname = {x['name']: x for x in AREAS}
        for name in a['related']:
            if name in byname:
                related.append(f'[{name}]({byname[name]["slug"]}.qmd)')
        lines = ['[AI engineering](../index.qmd) / ' + a['name'], a['point'], '## What to understand']
        lines += ['\n'.join('- ' + t for t in a['topics'])]
        lines += ['## How the pieces connect', a['connection'], '## A question to test', a['checkpoint']]
        if a['tag'] == 'evals':
            lines += ['**Platform note, 25 November 2026:** evaluation is a practice, separate from a hosted product. OpenAI’s hosted Evals surfaces are retiring; consult [the current notice](https://developers.openai.com/api/docs/deprecations) and use a maintained evaluation workflow.']
        if a['tag'] == 'adaptation':
            lines += ['**Platform note, 25 November 2026:** OpenAI’s self-serve fine-tuning has restricted access and a retirement timeline. Learn the concepts with current tooling, and check [the official availability notice](https://developers.openai.com/api/docs/deprecations) before planning a training run.']
        lines += ['## Sources to work with', raw(source_list(a['sources']))]
        if related:
            lines += ['## Follow the connection', ' · '.join(related)]
        lines += ['[Return to the map](../index.qmd) · [Search the source library](../library.qmd)']
        write('ai-engineering/topics/' + a['slug'] + '.qmd', a['name'], '', '\n\n'.join(lines), toc=True)


def generate_questions():
    body = '''These are starting questions for the field guide. Follow one as far as it remains interesting;
the experiment and the explanation can change together.
'''
    for q in QUESTIONS:
        body += f'\n## {q["title"]} {{#{q["id"]}}}\n\n{q["description"]}\n\n'
        body += '**A small way to investigate:** ' + q['experiment'] + '\n\n'
        body += '**Related areas:** ' + ' · '.join(f'[{BY_TAG[t]["name"]}](topics/{BY_TAG[t]["slug"]}.qmd)' for t in q['areas']) + '\n\n'
        body += raw(source_list(q['sources']))
        if q.get('investigation'):
            body += f'\n[What I’m learning]({q["investigation"]}).\n'
    write('ai-engineering/questions.qmd', 'Questions worth following', 'Let the question shape the experiment.', body, toc=True)


def generate_keep_up():
    body = raw(modes('keep-up')) + '''
Keep a small watchlist. Expand it when a question calls for a new perspective.
The useful outcome is knowing what to try, update or reconsider.

## Follow people who show their work
''' + raw(source_list(['simon-willison', 'hamel-husain', 'latent-space', 'eugene-yan', 'chip-huyen'])) + '''
## Know when the ground changes
''' + raw(source_list(['oai-changelog', 'oai-deprecations', 'hf-blog', 'anthropic-engineering'])) + '''
## Find ideas before they become tutorials
''' + raw(source_list(['hf-papers', 'openreview', 'hn', 'show-hn', 'ai-engineer-youtube', 'interconnects'])) + '''
## Give an update somewhere to land

For a development worth keeping, record four things:

- **What changed?** Link to the original announcement, paper or repository.
- **Why does it matter here?** Connect it to a question or something you are building.
- **What is the evidence?** Separate the source’s claim from a result you have reproduced.
- **What would you try?** Choose one bounded experiment, or record why no action is needed.

::: {.connection-note}
This is a curated watchlist. New releases and event dates need a fresh check; it is not an automated news feed.
:::

[Browse the wider signal collection](library.html?mode=keep-up).
'''
    write('ai-engineering/keep-up.qmd', 'AI engineering', 'Follow the work that can change your thinking.', body)


def generate_involvement():
    routes = [
        ('Ask and help', 'A precise question, a reproduction or an explanation.', 'Forums, Discord, Slack and office hours.'),
        ('Reproduce and compare', 'A small test of a paper, demo or technical claim.', 'Paper clubs, GitHub discussions and research groups.'),
        ('Contribute', 'A test, documentation fix, example or bounded code change.', 'Open-source projects and their contribution channels.'),
        ('Build together', 'A specific part of a shared problem.', 'Project groups, hackathons, research jams and meetups.'),
        ('Explain and demonstrate', 'A useful account of something you actually tried.', 'A repo, Substack, LinkedIn, YouTube or a live demo.'),
        ('Maintain and convene', 'Continued care for a useful tool or exchange.', 'A repository, study group or recurring community session.')
    ]
    routehtml = '<div class="participation-grid">' + ''.join(f'<article><h3>{title}</h3><p>{bring}</p><small>{where}</small></article>' for title, bring, where in routes) + '</div>'
    projects = ['project-mcp-inspector', 'project-datasets', 'project-promptfoo', 'project-haystack', 'project-phoenix']
    projecthtml = '<div class="project-routes">'
    for key in projects:
        s = source(key)
        projecthtml += f'<article><div><h3>{anchor(s["name"], s["url"])}</h3><p>{esc(s["why"])}</p></div><div><p>{esc(s["first_contribution"])}</p>{anchor("Read the contribution guide", s["entry_url"])}</div></article>'
    projecthtml += '</div>'
    communities = [s['id'] for s in SOURCES if s['source_type'] == 'community']
    body = raw(modes('get-involved')) + '''
Bring a question or a piece of work into a conversation. A small reproduction,
an honest failure or a useful explanation gives someone else something to engage with.

## Choose how to participate
''' + raw(routehtml) + '''
## Find a useful first contribution

Start with a problem you can reproduce. These are project entry points, rather than a list of issues claimed to be open.
''' + raw(projecthtml) + '''
## Find people working on related questions
''' + raw(source_list(communities)) + '''
## Let the work lead to the conversation

**Question → small experiment → inspectable artifact → useful exchange → a better question.**

A short demonstration can show what you expected, what happened and what you are still trying to understand.
Teaching from that evidence is one way to develop a public voice. It does not require a large audience.

An involvement scout can eventually connect current questions and experiments to specific projects,
discussions or collaboration calls. A useful recommendation should explain the fit, what you could bring,
the smallest first action and whether the opportunity is currently open. That scouting process has not been automated here.

[Explore all projects and communities](library.html?mode=get-involved).
'''
    write('ai-engineering/get-involved.qmd', 'AI engineering', 'Become part of the work.', body)


def generate_library():
    controls = '''<div class="source-controls" id="source-controls" hidden>
<label class="source-search"><span>Search the library</span><input type="search" id="source-search" placeholder="People, topics, tools or a question"></label>
<label><span>Purpose</span><select id="source-mode"><option value="all">All purposes</option><option value="learn">Learn</option><option value="keep-up">Keep up</option><option value="get-involved">Get involved</option></select></label>
<label><span>Source type</span><select id="source-type"><option value="all">All types</option><option value="course">Courses and lessons</option><option value="official">Official docs and standards</option><option value="publication">Writing, video and conversations</option><option value="project">Open-source projects</option><option value="community">Communities</option><option value="research">Research and discovery</option></select></label>
<label><span>Topic</span><select id="source-topic"><option value="all">All topics</option>__TOPICS__</select></label>
<button type="button" id="source-reset">Reset filters</button></div>
<p class="source-count" id="source-count" role="status" aria-live="polite"></p>'''
    controls = controls.replace('__TOPICS__', ''.join(f'<option value="{a["tag"]}">{esc(a["name"])}</option>' for a in AREAS))
    rows = '<div id="source-results" class="source-results">'
    for s in SOURCES:
        searchtext = ' '.join([s['name'], s['why'], *s['topics'], s.get('first_contribution', '')]).lower()
        areas = ' '.join(a['tag'] for a in AREAS if matches_area(a, s))
        rows += f'<article class="source-entry" id="{esc(s["id"])}" data-purpose="{esc(" ".join(s["modes"]))}" data-kind="{esc(s["source_type"])}" data-area="{areas}" data-search="{esc(searchtext)}">'
        rows += f'<div class="source-identity"><h2>{anchor(s["name"], s["url"])}</h2><span>{esc(s["kind"])}</span></div>'
        rows += f'<div><p>{esc(s["why"])}</p><p class="source-action">{esc(s["how_to_use"])}</p>'
        if s.get('first_contribution'):
            rows += f'<details><summary>A way to participate</summary><p>{esc(s["first_contribution"])}</p>{anchor("Check the entry route", s["entry_url"])}</details>'
        if s.get('note'):
            rows += f'<details><summary>Access and source notes</summary><p>{esc(s["note"])}</p></details>'
        rows += f'<div class="source-meta">{esc(", ".join(s["topics"]))}<span>{esc(s["access"])} access</span></div></div></article>'
    rows += '</div><p id="source-empty" hidden>No sources match. Broaden the search or reset the filters.</p><button type="button" id="source-more" class="plain-button" hidden>Show more sources</button>'
    body = f'''A reference collection of **{len(SOURCES)} sources**, organized by what you can use them for.
A source can help you learn, keep up and get involved at the same time.

Source pages were checked on **25 November 2026**. Most were opened directly; two were checked through first-party indexes.
Reading access, compute, API usage and paid memberships are different things. The notes retain those distinctions.
''' + raw(controls + rows)
    write('ai-engineering/library.qmd', 'Source library', 'Find the source that helps with the question in front of you.', body)


def validate():
    assert len({s['id'] for s in SOURCES}) == len(SOURCES)
    assert len({s['url'].rstrip('/') for s in SOURCES}) == len(SOURCES)
    for q in QUESTIONS:
        for key in q['sources']:
            source(key)
    for a in AREAS:
        for key in a['sources']:
            source(key)


if __name__ == '__main__':
    validate()
    generate_learn()
    generate_topics()
    generate_questions()
    generate_keep_up()
    generate_involvement()
    generate_library()
    print(f'Knowledge pages ready: {len(AREAS)} areas, {len(SOURCES)} sources. No notebooks executed.')
