import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sources,
  areas,
  kinds,
  memberships,
  areaSources,
  getSource,
  validateKnowledge,
} from '../src/lib/knowledge.mjs';

test('the existing 127-source collection and its references remain intact', () => {
  validateKnowledge();
  assert.equal(sources.length, 127);
  assert.equal(areas.length, 12);
  assert.equal(kinds.length, 6);
  assert.equal(getSource('project-smolagents').id, 'project-smolagents');
});

test('chart counts and the source-browser topic filters describe the same records', () => {
  for (const area of areas) {
    const chart = areaSources(area)
      .map((source) => source.id)
      .sort();
    const browser = sources
      .filter((source) => memberships.get(source.id).includes(area.tag))
      .map((source) => source.id)
      .sort();
    assert.deepEqual(chart, browser, area.name);
    assert.equal(
      kinds.reduce(
        (sum, kind) =>
          sum + areaSources(area).filter((source) => source.source_type === kind.id).length,
        0,
      ),
      chart.length,
    );
  }
  assert.equal(areaSources(areas.find((area) => area.tag === 'agents')).length, 27);
});
