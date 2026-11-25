(() => {
  const controls = document.getElementById('source-controls');
  if (!controls) return;
  const search = document.getElementById('source-search');
  const mode = document.getElementById('source-mode');
  const type = document.getElementById('source-type');
  const topic = document.getElementById('source-topic');
  const rows = [...document.querySelectorAll('.source-entry')];
  const params = new URLSearchParams(location.search);
  const allowed = (select, value) => [...select.options].some(o => o.value === value);
  search.value = params.get('q') || '';
  if (allowed(mode, params.get('mode'))) mode.value = params.get('mode');
  if (allowed(type, params.get('type'))) type.value = params.get('type');
  if (allowed(topic, params.get('topic'))) topic.value = params.get('topic');
  let limit = 15;
  const more = document.getElementById('source-more');
  function update(sync = true) {
    const term = search.value.trim().toLowerCase();
    const matching = rows.filter(row => (!term || row.dataset.search.includes(term)) &&
      (mode.value === 'all' || row.dataset.purpose.split(' ').includes(mode.value)) &&
      (type.value === 'all' || row.dataset.kind === type.value) &&
      (topic.value === 'all' || row.dataset.area.split(' ').includes(topic.value)));
    const visible = new Set(matching.slice(0, limit));
    for (const row of rows) row.hidden = !visible.has(row);
    document.getElementById('source-count').textContent = `${matching.length} sources · showing ${Math.min(limit, matching.length)}`;
    document.getElementById('source-empty').hidden = matching.length > 0;
    more.hidden = matching.length <= limit;
    if (sync) {
      const next = new URL(location.href);
      for (const [key, value] of [['q', search.value.trim()], ['mode', mode.value], ['type', type.value], ['topic', topic.value]]) {
        if (!value || value === 'all') next.searchParams.delete(key); else next.searchParams.set(key, value);
      }
      history.replaceState(null, '', next);
    }
  }
  controls.hidden = false;
  search.addEventListener('input', () => { limit = 15; update(); });
  for (const filter of [mode, type, topic]) filter.addEventListener('change', () => { limit = 15; update(); });
  more.addEventListener('click', () => { limit += 25; update(); });
  document.getElementById('source-reset').addEventListener('click', () => {
    search.value = ''; mode.value = 'all'; type.value = 'all'; topic.value = 'all'; limit = 15; update(); search.focus();
  });
  addEventListener('popstate', () => location.reload());
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target?.classList.contains('source-entry')) {
      search.value = ''; mode.value = 'all'; type.value = 'all'; topic.value = 'all'; limit = rows.length;
      update(false); target.scrollIntoView();
    } else update(false);
  } else update(false);
})();
