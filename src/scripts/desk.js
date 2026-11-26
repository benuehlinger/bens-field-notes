for (const desk of document.querySelectorAll('[data-explore-desk]')) {
  const choices = [...desk.querySelectorAll('[data-desk-choice]')];
  const panels = [...desk.querySelectorAll('[data-desk-panel]')];
  function render() {
    const requested = new URL(location.href).searchParams.get('view');
    const selected = choices.some((item) => item.dataset.deskChoice === requested)
      ? requested
      : desk.dataset.initialView;
    for (const item of choices) {
      if (item.dataset.deskChoice === selected) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    }
    for (const panel of panels) panel.hidden = panel.dataset.deskPanel !== selected;
    desk.classList.add('desk-enhanced');
  }
  for (const choice of choices)
    choice.addEventListener('click', (event) => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const url = new URL(location.href);
      url.searchParams.set('view', choice.dataset.deskChoice);
      history.pushState(null, '', url);
      render();
    });
  addEventListener('popstate', render);
  render();
}
