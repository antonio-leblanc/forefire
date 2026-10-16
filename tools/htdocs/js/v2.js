// Small layout helpers for v2.html. All simulation logic stays in forefireGUI.js;
// this file only adds behaviour that the new layout needs.
(() => {
  const $ = (id) => document.getElementById(id);
  const input = $('commandInput');

  $('hostLabel').textContent = location.host;

  // The map fills a grid cell, so Leaflet must re-measure when the console opens/closes.
  if (typeof map !== 'undefined') {
    new ResizeObserver(() => map.invalidateSize()).observe($('map'));

    // Dark basemap by default (OSM tiles inverted in CSS); plain OSM stays one click away.
    let osm = null;
    map.eachLayer((layer) => { if (layer instanceof L.TileLayer) osm = layer; });
    const dark = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      className: 'tiles-dark'
    });
    if (osm) map.removeLayer(osm);
    dark.addTo(map);
    const bases = { Dark: dark };
    if (osm) bases.OpenStreetMap = osm;
    L.control.layers(bases, null, { position: 'topright' }).addTo(map);
  }

  // RosaceWind only paints on first interaction; draw it up front.
  // The canvas is colour-inverted in CSS, so this lands on the accent orange.
  if (typeof rosace !== 'undefined') {
    rosace.arrowColor = '#a33f05';
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

  // ?include=real_case.ff runs a case on page load, then draws the front and lists layers.
  const startCase = new URLSearchParams(location.search).get('include');
  if (startCase) {
    (async () => {
      const out = await sendCommand(`include[${startCase}]`);
      if (out === null || out.includes('wrong input file')) {
        uiLog(`Could not open ${startCase}: include paths are relative to the folder forefire was started in`, 'error');
        return;
      }
      await refreshMap(true);
      await updateLayerList();
    })();
  }
})();
