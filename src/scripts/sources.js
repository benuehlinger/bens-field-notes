const root = document.querySelector('[data-source-browser]');
const node = document.getElementById('source-data');
if (root && node) {
  const data = JSON.parse(node.textContent);
  const search = document.getElementById('source-search');
  const mode = document.getElementById('source-mode');
  const type = document.getElementById('source-type');
  const topic = document.getElementById('source-topic');
  const sort = document.getElementById('source-sort');
  const body = document.getElementById('source-results');
  const rows = [...root.querySelectorAll('[data-source-row]')];
  const modal = document.getElementById('source-dialog');
  const params = new URLSearchParams(location.search);
  let limit = 15;
  let selectedSource = null;
  let trigger = null;
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
    );
  const allowed = (control, value) => [...control.options].some((option) => option.value === value);
  function fromURL() {
    const query = new URLSearchParams(location.search);
    search.value = query.get('q') || '';
    for (const [key, control] of [
      ['mode', mode],
      ['type', type],
      ['topic', topic],
      ['sort', sort],
    ]) {
      const fallback =
        key === 'mode' ? root.dataset.initialMode : key === 'sort' ? 'recommended' : 'all';
      control.value = allowed(control, query.get(key)) ? query.get(key) : fallback;
    }
  }
  function update(sync = true) {
    const term = search.value.trim().toLowerCase();
    const matching = rows.filter(
      (row) =>
        (!term || row.dataset.search.includes(term)) &&
        (mode.value === 'all' || row.dataset.purpose.split(' ').includes(mode.value)) &&
        (type.value === 'all' || row.dataset.kind === type.value) &&
        (topic.value === 'all' || row.dataset.area.split(' ').includes(topic.value)),
    );
    const compare = new Intl.Collator(undefined, { sensitivity: 'base' });
    if (sort.value === 'name')
      matching.sort((a, b) =>
        compare.compare(
          a.querySelector('.source-title').textContent,
          b.querySelector('.source-title').textContent,
        ),
      );
    if (sort.value === 'type')
      matching.sort(
        (a, b) =>
          compare.compare(a.dataset.kind, b.dataset.kind) ||
          compare.compare(
            a.querySelector('.source-title').textContent,
            b.querySelector('.source-title').textContent,
          ),
      );
    const visible = new Set(matching.slice(0, limit));
    rows.forEach((row) => (row.hidden = !visible.has(row)));
    matching.forEach((row) => body.append(row));
    document.getElementById('source-count').textContent =
      `${matching.length} ${matching.length === 1 ? 'source' : 'sources'}`;
    root.querySelector('[data-shown-count]').textContent =
      `Showing ${Math.min(limit, matching.length)} of ${matching.length}`;
    document.getElementById('source-more').hidden = matching.length <= limit;
    document.getElementById('source-empty').hidden = matching.length > 0;
    root.querySelector('.source-table-wrap').hidden = matching.length === 0;
    const area = data.areas.find((area) => area.id === topic.value);
    const guide = root.querySelector('[data-guide-link]');
    guide.hidden = !area;
    if (area) guide.href = area.guide;
    if (root.classList.contains('source-browser-inline')) {
      root.querySelector('#sources-title').textContent = area ? area.name : 'Explore the sources';
      root.querySelector('[data-browser-description]').textContent = area
        ? area.point
        : 'Find something worth reading, trying or contributing to.';
    }
    if (sync) {
      const url = new URL(location.href);
      for (const [key, value] of [
        ['q', search.value.trim()],
        ['mode', mode.value],
        ['type', type.value],
        ['topic', topic.value],
        ['sort', sort.value],
      ]) {
        if (!value || value === 'all' || value === 'recommended') url.searchParams.delete(key);
        else url.searchParams.set(key, value);
      }
      history.replaceState(history.state, '', url);
    }
  }
  function showSource(id, push = true) {
    const source = data.sources.find((source) => source.id === id);
    if (!source) return;
    selectedSource = id;
    const kind = data.kinds.find((kind) => kind.id === source.source_type);
    const domain = new URL(source.url).hostname.replace(/^www\./, '');
    document.getElementById('source-dialog-content').innerHTML =
      `<span class="type-label"><i class="kind-dot kind-${kind.color}"></i>${escape(kind.label)}</span><h2 id="source-dialog-title">${escape(source.name)}</h2><p class="dialog-domain">${escape(domain)}</p><a class="button button-primary source-visit" href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">Visit source <span aria-hidden="true">↗</span></a><section><h3>What it helps with</h3><p>${escape(source.why)}</p></section><section><h3>A way to use it</h3><p>${escape(source.how_to_use)}</p></section>${source.first_contribution ? `<section><h3>A way to get involved</h3><p>${escape(source.first_contribution)}</p>${source.entry_url ? `<a class="text-link" href="${escape(source.entry_url)}" target="_blank" rel="noopener noreferrer">Read the entry guide ↗</a>` : ''}</section>` : ''}<section><h3>Topics</h3><div class="topic-chips">${source.topics.map((topic) => `<span>${escape(topic)}</span>`).join('')}</div></section><section class="source-provenance"><h3>Access & source notes</h3><p>${escape(source.access)} access</p>${source.note ? `<p>${escape(source.note)}</p>` : ''}<p>Checked 25 November 2026${source.verification === 'opened' ? '' : ' through an official index'}. Check current availability before acting.</p></section>`;
    if (!modal.open) modal.showModal();
    if (push && location.hash !== `#${id}`) {
      const url = new URL(location.href);
      url.hash = id;
      history.pushState({ source: id }, '', url);
    }
  }
  root.querySelectorAll('[data-source-details]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => {
      trigger = button;
      showSource(button.dataset.sourceDetails);
    });
  });
  root.querySelector('[data-source-close]').addEventListener('click', () => modal.close());
  modal.addEventListener('click', (event) => {
    const box = modal.getBoundingClientRect();
    if (
      event.target === modal &&
      (event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom)
    )
      modal.close();
  });
  modal.addEventListener('close', () => {
    if (location.hash === `#${selectedSource}`) {
      const url = new URL(location.href);
      url.hash = '';
      history.replaceState(null, '', url);
    }
    trigger?.focus({ preventScroll: true });
  });
  root.querySelector('[data-source-controls]').hidden = false;
  fromURL();
  if (root.dataset.collapsed === 'true')
    root.hidden = !params.has('topic') && !params.has('type') && !params.has('q') && !location.hash;
  update(false);
  search.addEventListener('input', () => {
    limit = 15;
    update();
  });
  for (const control of [mode, type, topic, sort])
    control.addEventListener('change', () => {
      limit = 15;
      update();
    });
  document.getElementById('source-reset').addEventListener('click', () => {
    search.value = '';
    mode.value = 'all';
    type.value = 'all';
    topic.value = 'all';
    sort.value = 'recommended';
    limit = 15;
    update();
    search.focus();
  });
  document.getElementById('source-more').addEventListener('click', () => {
    limit += 15;
    update(false);
  });
  root.querySelector('[data-browser-close]')?.addEventListener('click', () => {
    root.hidden = true;
    const url = new URL(location.href);
    for (const key of ['topic', 'type', 'q', 'mode', 'sort']) url.searchParams.delete(key);
    url.hash = '';
    history.replaceState(null, '', url);
    const label = document.querySelector('[data-chart-topic]');
    label?.focus();
    document.getElementById('source-atlas')?.scrollIntoView({ block: 'start' });
  });
  document.addEventListener('explore-sources', (event) => {
    root.hidden = false;
    search.value = '';
    mode.value = event.detail.mode;
    topic.value = event.detail.topic;
    type.value = event.detail.type;
    limit = 15;
    const url = new URL(location.href);
    url.searchParams.set('topic', topic.value);
    if (type.value === 'all') url.searchParams.delete('type');
    else url.searchParams.set('type', type.value);
    url.hash = 'sources';
    history.pushState(null, '', url);
    update();
    root.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    });
    const title = root.querySelector('#sources-title');
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
  });
  addEventListener('popstate', () => {
    fromURL();
    limit = 15;
    update(false);
    if (root.dataset.collapsed === 'true') {
      const query = new URLSearchParams(location.search);
      root.hidden = !query.has('topic') && !query.has('type') && !query.has('q') && !location.hash;
    }
    if (data.sources.some((source) => `#${source.id}` === location.hash))
      showSource(location.hash.slice(1), false);
    else if (modal.open) modal.close();
  });
  if (data.sources.some((source) => `#${source.id}` === location.hash))
    showSource(location.hash.slice(1), false);
}
