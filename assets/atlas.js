(() => {
  const root = document.getElementById('source-atlas');
  if (!root) return;
  const data = JSON.parse(document.getElementById('atlas-data').textContent);
  const kinds = new Map(data.kinds.map(kind => [kind.id, kind]));
  const topics = new Map(data.topics.map(topic => [topic.id, topic]));
  const rows = [...root.querySelectorAll('[data-atlas-row]')];
  const detail = document.getElementById('atlas-detail');
  const readout = document.getElementById('atlas-readout');
  const params = new URLSearchParams(location.search);
  let activeTopic = topics.has(params.get('topic')) ? params.get('topic') : 'agents';
  let activeKind = kinds.has(params.get('type')) ? params.get('type') : 'all';

  const escape = value => String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const matches = topic => topic.sources.filter(id => activeKind === 'all' || data.sources[id].source_type === activeKind);
  const selectionSummary = () => `${topics.get(activeTopic).title} · ${matches(topics.get(activeTopic)).length} ${activeKind === 'all' ? 'sources' : kinds.get(activeKind).label.toLowerCase()}`;

  function revealDetail() {
    if (!matchMedia('(max-width:900px)').matches) return;
    detail.scrollIntoView({ block: 'start', behavior: 'instant' });
    detail.focus({ preventScroll: true });
  }

  function renderDetail() {
    const topic = topics.get(activeTopic);
    const ids = matches(topic);
    const typeLabel = activeKind === 'all' ? 'sources' : kinds.get(activeKind).label.toLowerCase();
    const query = `topic=${encodeURIComponent(topic.id)}${activeKind === 'all' ? '' : `&type=${encodeURIComponent(activeKind)}`}`;
    detail.innerHTML = `<div class="atlas-detail-heading"><button type="button" class="atlas-back">← Back to topics</button><span class="atlas-detail-label">Explore a topic</span><h3>${escape(topic.title)}</h3><p>${escape(topic.description)}</p></div>
      <a href="${escape(topic.guide)}" class="atlas-guide-link">Open the field guide <span aria-hidden="true">↗</span></a>
      <div class="atlas-detail-sources"><h4>${ids.length ? 'A few ways in' : 'Keep exploring'}</h4>
      ${ids.length ? `<ul>${ids.slice(0, 3).map(id => {
        const source = data.sources[id];
        const kind = kinds.get(source.source_type);
        return `<li><span class="atlas-source-dot" style="background:var(--${kind.color})" aria-hidden="true"></span><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.name)}</a><small>${escape(kind.label)}</small></li>`;
      }).join('')}</ul>` : '<p class="atlas-none">This collection has no sources of that type for this topic yet. Try another type or view all sources.</p>'}</div>
      <a href="library.html?${escape(query)}" class="atlas-browse-link">Browse ${ids.length} ${escape(typeLabel)} <span aria-hidden="true">↗</span></a>
      ${topic.id === 'agents' ? '<div class="atlas-current"><span>Currently learning</span><a href="investigations/smolagents-and-langgraph.html">smolagents vs LangGraph <span aria-hidden="true">↗</span></a><p>How much control should an agent have?</p></div>' : ''}`;
    detail.querySelector('.atlas-back').addEventListener('click', () => {
      const label = root.querySelector(`[data-atlas-topic="${activeTopic}"]`);
      label.scrollIntoView({ block: 'center', behavior: 'instant' });
      label.focus({ preventScroll: true });
    });
  }

  function render(sync = true) {
    const maximumCount = Math.max(...data.topics.map(topic => matches(topic).length));
    const step = [1, 2, 5, 10, 20, 50, 100].find(value => value * 4 >= maximumCount) || Math.ceil(maximumCount / 4);
    const ceiling = step * 4;
    root.querySelectorAll('.atlas-ticks span').forEach((tick, i) => { tick.textContent = i * step; });
    root.querySelectorAll('[data-atlas-kind]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.atlasKind === activeKind));
    });
    for (const row of rows) {
      const id = row.dataset.atlasRow;
      const count = matches(topics.get(id)).length;
      row.classList.toggle('is-selected', id === activeTopic);
      row.classList.toggle('is-empty', count === 0);
      row.querySelector('[data-atlas-topic]').setAttribute('aria-pressed', String(id === activeTopic));
      row.querySelector('.atlas-total').textContent = count;
      row.querySelector('.atlas-bar').style.width = `${count / ceiling * 100}%`;
      row.querySelectorAll('[data-atlas-segment]').forEach(segment => {
        segment.hidden = activeKind !== 'all' && segment.dataset.kind !== activeKind;
      });
    }
    renderDetail();
    readout.textContent = selectionSummary();
    if (sync) {
      const url = new URL(location.href);
      url.searchParams.set('topic', activeTopic);
      if (activeKind === 'all') url.searchParams.delete('type'); else url.searchParams.set('type', activeKind);
      history.replaceState(null, '', url);
    }
  }

  root.querySelector('.atlas-legend').hidden = false;
  detail.hidden = false;
  detail.tabIndex = -1;
  root.classList.add('is-interactive');
  root.querySelectorAll('[data-atlas-kind]').forEach(button => {
    button.addEventListener('click', () => { activeKind = button.dataset.atlasKind; render(); });
  });
  root.querySelectorAll('[data-atlas-topic]').forEach(label => {
    label.setAttribute('role', 'button');
    label.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); activeTopic = label.dataset.atlasTopic; render(); revealDetail();
    });
    label.addEventListener('keydown', event => {
      if (event.key === ' ') { event.preventDefault(); activeTopic = label.dataset.atlasTopic; render(); revealDetail(); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const labels = [...root.querySelectorAll('[data-atlas-topic]')];
        const next = (labels.indexOf(label) + (event.key === 'ArrowDown' ? 1 : labels.length - 1)) % labels.length;
        labels[next].focus(); activeTopic = labels[next].dataset.atlasTopic; render();
      }
    });
  });
  root.querySelectorAll('[data-atlas-segment]').forEach(segment => {
    segment.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); activeTopic = segment.dataset.atlasSegment; activeKind = segment.dataset.kind; render(); revealDetail();
    });
    segment.addEventListener('mouseenter', () => { readout.textContent = segment.getAttribute('aria-label'); });
    segment.addEventListener('focus', () => { readout.textContent = segment.getAttribute('aria-label'); });
    segment.addEventListener('mouseleave', () => { readout.textContent = selectionSummary(); });
    segment.addEventListener('blur', () => { readout.textContent = selectionSummary(); });
  });
  addEventListener('popstate', () => {
    const current = new URLSearchParams(location.search);
    activeTopic = topics.has(current.get('topic')) ? current.get('topic') : 'agents';
    activeKind = kinds.has(current.get('type')) ? current.get('type') : 'all';
    render(false);
  });
  render(false);
})();
