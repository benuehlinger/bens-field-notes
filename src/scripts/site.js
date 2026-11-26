const themeButton = document.querySelector('[data-theme-toggle]');
function themeLabel() {
  themeButton?.setAttribute(
    'aria-label',
    `Switch to ${document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'} theme`,
  );
}
themeLabel();
themeButton?.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem('field-notes-theme', next);
  } catch {}
  themeLabel();
});
const menu = document.querySelector('[data-menu-toggle]');
const nav = document.getElementById('mobile-nav');
menu?.addEventListener('click', () => {
  if (!nav) return;
  nav.hidden = !nav.hidden;
  menu.setAttribute('aria-expanded', String(!nav.hidden));
});
const search = document.querySelector('[data-search-dialog]');
const input = document.getElementById('site-search');
const results = document.querySelector('[data-search-results]');
const indexNode = document.getElementById('search-index');
if (
  search instanceof HTMLDialogElement &&
  input instanceof HTMLInputElement &&
  results &&
  indexNode
) {
  const index = JSON.parse(indexNode.textContent);
  const render = () => {
    const term = input.value.trim().toLowerCase();
    const matches = index
      .filter((item) => !term || `${item.title} ${item.note}`.toLowerCase().includes(term))
      .slice(0, 9);
    results.replaceChildren(
      ...matches.map((item) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = item.href;
        const title = document.createElement('span');
        title.textContent = item.title;
        const note = document.createElement('small');
        note.textContent = item.note;
        link.append(title, note);
        li.append(link);
        return li;
      }),
    );
    if (!matches.length) {
      const li = document.createElement('li');
      li.className = 'search-empty';
      li.textContent = 'No matches. Try a topic or a source name.';
      results.append(li);
    }
  };
  const open = () => {
    render();
    search.showModal();
    input.focus();
  };
  document.querySelector('[data-search-open]')?.addEventListener('click', open);
  document.querySelector('[data-search-close]')?.addEventListener('click', () => search.close());
  search.addEventListener('click', (e) => {
    if (e.target === search) search.close();
  });
  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      results.querySelector('a')?.focus();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (
      e.key === '/' &&
      !(
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target?.isContentEditable
      )
    ) {
      e.preventDefault();
      if (!search.open) open();
    }
  });
}
