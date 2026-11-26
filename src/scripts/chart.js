const chart = document.getElementById('source-atlas');
const node = document.getElementById('chart-data');
if (chart && node) {
  const rows = JSON.parse(node.textContent);
  const readout = chart.querySelector('[data-chart-readout]');
  let kind = 'all';
  const params = new URLSearchParams(location.search);
  let selected = params.get('topic');
  function draw() {
    const count = (row) =>
      kind === 'all' ? Object.values(row.counts).reduce((sum, n) => sum + n, 0) : row.counts[kind];
    const maximum = Math.max(...rows.map(count));
    const step = [1, 2, 5, 10, 20, 50].find((n) => n * 4 >= maximum) || 50;
    chart.querySelectorAll('.chart-ticks span').forEach((tick, i) => (tick.textContent = i * step));
    chart
      .querySelectorAll('[data-chart-kind]')
      .forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.chartKind === kind)),
      );
    for (const row of rows) {
      const el = chart.querySelector(`[data-chart-row="${row.id}"]`);
      el.classList.toggle('selected', selected === row.id);
      el.querySelector('.chart-total').textContent = count(row);
      el.querySelector('.chart-bar').style.width = `${(count(row) / (step * 4)) * 100}%`;
      el.querySelectorAll('[data-chart-segment]').forEach(
        (segment) => (segment.hidden = kind !== 'all' && segment.dataset.kind !== kind),
      );
    }
  }
  function explore(topic, type) {
    selected = topic;
    draw();
    document.dispatchEvent(
      new CustomEvent('explore-sources', { detail: { topic, type, mode: 'all' } }),
    );
  }
  chart.querySelectorAll('[data-chart-kind]').forEach((button) =>
    button.addEventListener('click', () => {
      kind = button.dataset.chartKind;
      draw();
    }),
  );
  chart.querySelectorAll('[data-chart-topic]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      explore(link.dataset.chartTopic, kind);
    });
  });
  chart.querySelectorAll('[data-chart-segment]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      explore(link.dataset.chartSegment, link.dataset.kind);
    });
    link.addEventListener(
      'mouseenter',
      () => (readout.textContent = link.getAttribute('aria-label')),
    );
    link.addEventListener('focus', () => (readout.textContent = link.getAttribute('aria-label')));
    const reset = () => (readout.textContent = 'Choose an area to see the sources behind it.');
    link.addEventListener('mouseleave', reset);
    link.addEventListener('blur', reset);
  });
  if (rows.some((row) => row.counts[params.get('type')] !== undefined)) kind = params.get('type');
  addEventListener('popstate', () => {
    const current = new URLSearchParams(location.search);
    selected = current.get('topic');
    draw();
  });
  draw();
}
