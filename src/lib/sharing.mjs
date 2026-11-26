import { areas } from './knowledge.mjs';

export const siteName = 'Ben’s Field Notes';
export const siteOrigin = 'https://bensnotes.fyi';
const pages = {
  '/': {
    title: 'AI engineering field notes',
    description:
      'Ben’s working notes on AI engineering. A place to learn, keep up, and get involved.',
    image: 'atlas',
  },
  '/ai-engineering/': {
    description:
      'A visual map of AI engineering. Explore the sources, ideas, and tools behind what I’m learning.',
    image: 'atlas',
  },
  '/ai-engineering/keep-up.html': {
    description:
      'A reading desk for AI engineering: practitioner experiments, release changes, and research worth testing.',
    image: 'reading',
  },
  '/ai-engineering/get-involved.html': {
    description:
      'Find a concrete way into AI engineering: discuss a question, contribute a fix, collaborate, or share an experiment.',
    image: 'involved',
  },
  '/ai-engineering/library.html': {
    description:
      'Find useful AI engineering sources by topic, format, and purpose. Docs, courses, projects, communities, writing, and research.',
    image: 'atlas',
  },
  '/ai-engineering/investigations/smolagents-and-langgraph.html': {
    image: 'agents',
    type: 'article',
  },
};
const imageDescriptions = {
  atlas:
    'Ben’s Field Notes monogram beside the vivid stacked source chart from the AI engineering atlas.',
  reading: 'Ben’s Field Notes monogram beside three reading cards in pink, blue, and amber.',
  involved: 'Ben’s Field Notes monogram beside people connected to a shared code project.',
  agents:
    'Ben’s Field Notes monogram beside two illustrated agent execution paths in blue and green.',
};
export function shareInfo(pathname, title, description) {
  const page = pages[pathname] || {};
  const area = areas.find((item) => pathname === `/ai-engineering/topics/${item.slug}.html`);
  const image = page.image || 'atlas';
  return {
    title: page.title || title,
    description:
      description ||
      page.description ||
      area?.point ||
      'A personal field guide to AI engineering. Questions, sources, and experiments.',
    canonical: new URL(pathname, siteOrigin).href,
    type: page.type || (area ? 'article' : 'website'),
    image,
    imageAlt: imageDescriptions[image],
  };
}
