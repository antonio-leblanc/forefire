// Small layout helpers for v2.html. All simulation logic stays in forefireGUI.js;
// this file only adds behaviour that the new layout needs.
(() => {
  const $ = (id) => document.getElementById(id);
  const input = $('commandInput');

  $('hostLabel').textContent = location.host;

  // The map fills a grid cell, so Leaflet must re-measure when the console opens/closes.
  if (typeof map !== 'undefined') {
    new ResizeObserver(() => map.invalidateSize()).observe($('map'));
  }

  // RosaceWind only paints on first interaction; draw it up front.
  if (typeof rosace !== 'undefined') {
    rosace.arrowColor = '#c2410c';
    rosace.draw();
  }

  $('toggleLogs').addEventListener('change', (e) => {
    document.body.classList.toggle('logs-hidden', !e.target.checked);
  });

  // Mark the layer that is currently plotted.
  $('layerList').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    for (const item of li.parentNode.children) {
      item.classList.toggle('is-active', item === li);
    }
  });

  // Click a history entry to put it back in the input.
  $('commandHistory').addEventListener('click', (e) => {
    const entry = e.target.closest('.commandText');
    if (!entry) return;
    input.value = entry.textContent;
    input.focus();
  });

  // Up/Down walks through previously sent commands, like a shell.
  let cursor = -1;
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    const sent = [...$('commandHistory').querySelectorAll('.commandText')].map((n) => n.textContent);
    if (!sent.length) return;
    e.preventDefault();
    if (cursor === -1) cursor = sent.length;
    cursor += e.key === 'ArrowUp' ? -1 : 1;
    cursor = Math.max(0, Math.min(cursor, sent.length));
    input.value = cursor === sent.length ? '' : sent[cursor];
  });
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') cursor = -1;
  });

  // Snippet buttons fill the input; move focus there so Enter sends it.
  $('commandButtons').addEventListener('click', () => input.focus());
})();
