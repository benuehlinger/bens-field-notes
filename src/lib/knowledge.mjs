import catalog from '../../content/sources.json' with { type: 'json' };
import areas from '../../content/areas.json' with { type: 'json' };
import questions from '../../content/questions.json' with { type: 'json' };

export { areas, questions };
export const sources = catalog.sources;
export const checked = catalog.checked;
export const kinds = [
  { id: 'official', label: 'Docs', color: 'docs' },
  { id: 'course', label: 'Courses', color: 'courses' },
  { id: 'project', label: 'Projects', color: 'projects' },
  { id: 'community', label: 'Communities', color: 'communities' },
  { id: 'publication', label: 'Writing & video', color: 'publications' },
  { id: 'research', label: 'Research', color: 'research' },
];
export const modes = [
  { id: 'learn', name: 'Learn', note: 'Understand and practice', href: '/ai-engineering/' },
  { id: 'keep-up', name: 'Keep up', note: 'Follow the work', href: '/ai-engineering/keep-up.html' },
  {
    id: 'get-involved',
    name: 'Get involved',
    note: 'Bring something to the conversation',
    href: '/ai-engineering/get-involved.html',
  },
];
const names = {
  foundations: 'Software & data',
  context: 'Model behavior & context',
  openai: 'OpenAI APIs & SDKs',
  retrieval: 'Retrieval & grounding',
  mcp: 'Tools & MCP',
  agents: 'Agents & workflows',
  evals: 'Evaluation & error analysis',
  adaptation: 'Adaptation & distillation',
  multimodal: 'Multimodal & realtime',
  production: 'Production & inference',
  security: 'Security & trust',
  product: 'Product & field engineering',
};
export const shortName = (area) => names[area.tag] || area.name;
const byId = new Map();
for (const source of sources) {
  for (const key of [source.id, ...source.aliases]) byId.set(key, source);
}
export function getSource(id) {
  const source = byId.get(id);
  if (!source) throw new Error(`Unknown source: ${id}`);
  return source;
}
export function kindFor(id) {
  const kind = kinds.find((kind) => kind.id === id);
  if (!kind) throw new Error(`Unknown source type: ${id}`);
  return kind;
}
export function areaSources(area) {
  const curated = area.sources.map((id) => getSource(id).id);
  return sources
    .filter((source) => {
      const text = [source.name, ...source.topics].join(' ').toLowerCase();
      return curated.includes(source.id) || area.source_terms.some((term) => text.includes(term));
    })
    .sort((a, b) => {
      const rank = (source) =>
        curated.includes(source.id) ? curated.indexOf(source.id) : curated.length;
      return rank(a) - rank(b);
    });
}
export const memberships = new Map(
  sources.map((source) => [
    source.id,
    areas
      .filter((area) => areaSources(area).some((item) => item.id === source.id))
      .map((area) => area.tag),
  ]),
);
export const domain = (url) => new URL(url).hostname.replace(/^www\./, '');
export const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
export const storyUrl = '/ai-engineering/investigations/smolagents-and-langgraph.html';

export function validateKnowledge() {
  if (new Set(sources.map((s) => s.id)).size !== sources.length)
    throw new Error('Duplicate source IDs');
  if (new Set(sources.map((s) => s.url.replace(/\/$/, ''))).size !== sources.length)
    throw new Error('Duplicate source URLs');
  for (const source of sources) {
    kindFor(source.source_type);
    if (!['http:', 'https:'].includes(new URL(source.url).protocol))
      throw new Error(`Invalid URL: ${source.id}`);
  }
  for (const record of [...areas, ...questions]) record.sources.forEach(getSource);
}
validateKnowledge();
