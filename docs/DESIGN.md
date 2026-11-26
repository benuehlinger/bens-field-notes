Design: a personal field guide to AI engineering

A full-width spectral source atlas is the signature. The surrounding site is restrained: Geist type, near-black / white, vivid colors with one consistent meaning per source type. Real sources and questions lead the interface. No progress scores or decorative metrics.

Tokens: page #080808; panel #111113; text #f5f5f7; muted #a1a1aa; line #28282d; link #91b4ff. The six graph colors are blue, cyan, green, violet, pink and amber, with darker accessible variants on white. Geist for reading and display, Geist Mono only for aligned counts. Self-host fonts.

Composition:
[Ben's Field Notes | AI engineering | Currently learning | Sources | search/theme]
[AI engineering                                  currently learning link]
[Learn             Keep up               Get involved]
[Source atlas | source type legend]
[topic labels | vivid stacked horizontal bars, fixed quantitative axis | count]
[caption: actual collection, overlap, checked date]
[Select a topic => filtered compact source browser, anchored below chart]
[Question / first story, compact subject guide index]

The chart has all available width; no permanent detail sidebar squeezes it. Selection opens a reusable source table below, preserving topic/type context. The standalone library uses the identical table: clear name, domain, type, one-sentence relevance and an explicit detail action. Details open in a native dialog styled as a side panel. Source links open the original page, separately from Details. Filters update counts and shareable URLs. Keyboard and browser Back work. No-JavaScript retains sources and navigation.

Review: this is not a generic SaaS landing page. Avoid giant marketing hero whitespace, ornamental gradients, floating stats, 3D stock art and a grid of identical cards. The subject-specific visual is the real source collection, not a decorative network. Metadata belongs in the inspector, not many stacked lines. The compact table and full-width chart solve the concrete density problems in the screenshots.

Architecture: Astro static pages from existing JSON, no React runtime or backend. Astro bundles content-hashed assets. Keep current .html URLs with build.format=preserve. Quarto reserved for future notebook output, with site typography/navigation. No notebook created in this migration.


The three exploration modes share a single identity and a continuous learning thread.
The AI engineering header and mode navigation stay in the same position. Source colors
always mean the same six source types; initials identify sources without invented logos.
The chart remains the signature graphic. No decorative charts, fake activity or progress.

Keep up is a reading desk: a narrow Read / Check / Discover selector, one focused roster,
short relevance lines, and optional reading notes. The roster changes with the selection.
No second full catalog underneath. The catalog link retains the keep-up purpose filter.

Get involved is an action desk: Discuss / Contribute / Collaborate / Share. Each action
pairs a concrete artifact with a few suitable destinations and an explicit first move.
Suggested routes do not claim live vacancies, active calls or confirmed event dates.
The initial contribution view relates directly to smolagents and LangGraph.

A shared current-interest strip connects all three modes: learn the execution models,
read practitioner work, then take a reproducible question or failure to a project.
This is navigation and curation, not a claim that an experiment or contribution happened.

Composition: [shared header] [three compact mode links] [desk title + catalog link]
[200px purpose selector | selected sources with aligned identity / purpose / action]
[current interest: question -> reading -> participation]. On phones, the purpose selector
becomes a wrapping control row and sources use one readable column. No horizontal carousel.

Critique before implementation: a repeated grid of colorful cards would still be a link
dump. Use one calm work surface, a meaningful selector and aligned source rows instead.
Remove duplicate metadata and put qualifications in expandable notes. Color belongs to
source identity, not arbitrary page branding. Shared components own these decisions.
