import './styles.css';

const API = '/api/v1';
const state = { events: [], eventPagination: null, eventQuery: { page: 1, limit: 25, search: '' }, metrics: null, parsers: [], sources: [], deadLetters: [], deadPagination: null, deadQuery: { page: 1, limit: 25, search: '' }, systemLogJob: null };

const sampleLog = '<185>date=2026-09-09 time=14:02:11 devname="fw01" type=traffic level=notice srcip=10.0.0.5 srcport=54321 dstip=8.8.8.8 dstport=443 proto=6 action="deny" status=blocked msg="Access denied"';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`);
  return body.data;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function statusClass(status) {
  return ({ PROCESSED: 'good', PARTIALLY_PROCESSED: 'warn', UNSUPPORTED: 'muted', PARSER_ERROR: 'bad', VALIDATION_ERROR: 'bad' })[status] || 'muted';
}

function render() {
  const root = document.querySelector('#root');
    root.innerHTML = `
      <div class="shell">
        <aside class="sidebar">
          <div class="brand"><span class="brand-mark">LN</span><div><strong>LogNorm</strong><small>security event console</small></div></div>
          <div class="connection"><span class="pulse"></span><span id="connection-label">Checking API...</span></div>
          <nav>
            <span class="nav-label">Monitor</span>
            <a href="#overview" data-route="overview">Overview</a>
            <a href="#pipeline" data-route="pipeline">Pipeline view</a>
            <a href="#events" data-route="events">Event history <b id="nav-count">0</b></a>
            <a href="#dead-letter" data-route="dead-letter">Dead letter <b id="dead-count">0</b></a>
            <span class="nav-label">Plug and play</span>
            <a href="#parsers" data-route="parsers">Parser registry <b id="parser-count">0</b></a>
            <a href="#sources" data-route="sources">Source registry <b id="source-count">0</b></a>
            <a href="#test" data-route="test">Test bench</a>
            <a href="#output" data-route="output">Output center</a>
          </nav>
          <div class="sidebar-foot">Vite client<br><span>Durable local history enabled</span></div>
        </aside>
        <main class="main">
          <header class="topbar"><div><p class="eyebrow">Universal normalization framework</p><h1 id="page-title">Overview</h1></div><button class="button secondary" id="refresh">Refresh data</button></header>
          <div id="content"></div>
        </main>
      </div>
      <div id="toast" role="status"></div>`;
  document.querySelectorAll('[data-route]').forEach(link => link.addEventListener('click', () => route(link.dataset.route)));
  document.querySelector('#refresh').addEventListener('click', () => refresh(true));
  window.addEventListener('hashchange', () => route(location.hash.slice(1) || 'overview'));
  route(location.hash.slice(1) || 'overview');
}

async function refresh(showToast = false) {
  try {
    const [metrics, eventPage, health, parsers, sources, deadLetters] = await Promise.all([
      request('/healthcheck/metrics'), request('/events?limit=25'), request('/healthcheck'),
      request('/parsers'), request('/sources'), request('/healthcheck/dead-letter?limit=25')
    ]);
    state.metrics = metrics;
    state.events = eventPage.events;
    state.eventPagination = eventPage.pagination;
    state.parsers = parsers;
    state.sources = sources;
    state.deadLetters = deadLetters.events;
    state.deadPagination = deadLetters.pagination;
    document.querySelector('#connection-label').textContent = `${health.status} - API connected`;
    document.querySelector('#nav-count').textContent = state.events.length;
    document.querySelector('#dead-count').textContent = state.deadPagination?.total || 0;
    document.querySelector('#parser-count').textContent = state.parsers.length;
    document.querySelector('#source-count').textContent = state.sources.length;
    renderRoute();
    if (showToast) toast('Data refreshed from backend', 'good');
  } catch (error) {
    document.querySelector('#connection-label').textContent = 'API unavailable';
    toast(error.message, 'bad');
  }
}

function route(name) {
  const eventRoute = name.startsWith('event/');
  const allowed = ['overview', 'pipeline', 'events', 'dead-letter', 'parsers', 'sources', 'test', 'output'];
  const page = eventRoute || allowed.includes(name) ? name : 'overview';
  history.replaceState({}, '', `#${page}`);
  document.querySelectorAll('[data-route]').forEach(link => link.classList.toggle('active', link.dataset.route === page));
  const titles = { overview: 'Overview', pipeline: 'Pipeline view', events: 'Event history', 'dead-letter': 'Dead letter store', parsers: 'Parser registry', sources: 'Source registry', test: 'Local test bench', output: 'Output center' };
  document.querySelector('#page-title').textContent = eventRoute ? 'Event detail' : titles[page];
  renderRoute();
}

function renderRoute() {
  const page = location.hash.slice(1) || 'overview';
  const pages = { overview: overviewPage, pipeline: pipelinePage, events: eventsPage, 'dead-letter': deadLetterPage, parsers: parsersPage, sources: sourcesPage, test: testPage, output: outputPage };
  if (page.startsWith('event/')) {
    document.querySelector('#content').innerHTML = eventDetailPage(page.slice(6));
    bindEventDetailPage(page.slice(6));
    return;
  }
  document.querySelector('#content').innerHTML = (pages[page] || overviewPage)();
  if (page === 'events') bindEventsPage();
  if (page === 'dead-letter') bindDeadLetterPage();
  if (page === 'parsers') bindParsersPage();
  if (page === 'sources') bindSourcesPage();
  if (page === 'test') bindTestPage();
  if (page === 'output') bindOutputPage();
}

function overviewPage() {
  const counters = state.metrics?.counters || {};
  const parserHits = Object.entries(state.metrics?.parser_hits || {}).sort((a, b) => b[1] - a[1]);
  const latest = state.events.slice(0, 6);
  return `<section class="intro"><div><p class="eyebrow">Operational view</p><h2>Pipeline at a glance</h2><p class="muted">Counts are read-only projections of persisted backend state. Refreshing this page never creates events.</p></div><a class="button primary" href="#test">Open test bench</a></section>
    <section class="stats">
      ${stat('Events received', counters.eventsReceived, 'all ingested logs')}${stat('Processed', counters.eventsProcessed, 'normalized successfully', 'good')}${stat('Failed', counters.eventsFailed, 'parse or validation', 'bad')}${stat('Dead lettered', counters.deadLettered, 'preserved for review', 'warn')}${stat('Avg latency', `${state.metrics?.avg_processing_latency_ms || 0} ms`, 'processing average')}
    </section>
    <div class="grid two"><section class="panel"><div class="panel-head"><div><p class="eyebrow">Recent output</p><h3>Latest events</h3></div><a href="#events">View all</a></div>${eventRows(latest)}</section><section class="panel"><div class="panel-head"><div><p class="eyebrow">Routing</p><h3>Parser activity</h3></div></div><div class="bars">${parserHits.length ? parserHits.map(([name, count]) => `<div class="bar-row"><span>${escapeHtml(name)}</span><strong>${count}</strong><i style="width:${Math.min(100, count / Math.max(parserHits[0][1], 1) * 100)}%"></i></div>`).join('') : '<p class="empty">No parser activity yet.</p>'}</div></section></div>`;
}

function stat(label, value, note, tone = '') { return `<article class="stat ${tone}"><p>${label}</p><strong>${value ?? 0}</strong><small>${note}</small></article>`; }

function pipelinePage() {
  const counters = state.metrics?.counters || {};
  const stages = [
    ['Ingested', counters.eventsReceived, 'raw input received'],
    ['Preserved', counters.eventsReceived, 'lossless raw store'],
    ['Parsed', Math.max(0, counters.eventsReceived - (counters.eventsUnsupported || 0)), 'parser matched'],
    ['Normalized', (counters.eventsProcessed || 0) + (counters.eventsPartial || 0), 'universal event'],
    ['Output', counters.eventsProcessed, 'ready for export']
  ];
  return `<section class="page-copy"><div><p class="eyebrow">Processing path</p><h2>From raw log to usable signal</h2><p class="muted">Every stage is backed by the same persisted event record. No stage is simulated by the frontend.</p></div><span class="status good">${state.metrics?.events_per_second || 0} events/sec</span></section>
    <section class="pipeline">${stages.map((stage, index) => `<div class="pipeline-stage"><span class="stage-number">0${index + 1}</span><strong>${stage[0]}</strong><b>${stage[1] || 0}</b><small>${stage[2]}</small></div>`).join('<i class="pipeline-arrow">&#8594;</i>')}</section>
    <div class="grid two"><section class="panel"><div class="panel-head"><div><p class="eyebrow">Vendors</p><h3>Source distribution</h3></div></div><div class="bars">${distributionRows(state.metrics?.source_counts)}</div></section><section class="panel"><div class="panel-head"><div><p class="eyebrow">Formats</p><h3>Detected formats</h3></div></div><div class="bars">${distributionRows(state.metrics?.format_counts)}</div></section></div>`;
}

function distributionRows(values = {}) {
  const entries = Object.entries(values).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return '<p class="empty">No data yet.</p>';
  const max = Math.max(entries[0][1], 1);
  return entries.map(([name, count]) => `<div class="bar-row"><span>${escapeHtml(name)}</span><strong>${count}</strong><i style="width:${Math.min(100, count / max * 100)}%"></i></div>`).join('');
}

function eventsPage() {
  const pagination = state.eventPagination || { page: 1, total: 0, total_pages: 1, has_previous: false, has_next: false };
  return `<section class="page-copy"><p class="eyebrow">Durable event store</p><h2>Every normalized event, in order</h2><p class="muted">The list survives backend restarts. Only the current page is loaded into the browser.</p></section><section class="panel"><div class="toolbar"><div class="event-search"><input id="event-search" value="${escapeHtml(state.eventQuery.search)}" placeholder="Search vendor, parser, action, IP, or event ID" /><button class="button secondary" id="event-search-button">Search</button></div><span class="muted" id="event-total">${pagination.total} events</span></div><div class="table-wrap"><table><thead><tr><th>Event</th><th>Vendor</th><th>Parser</th><th>Action</th><th>Status</th><th>Ingested</th></tr></thead><tbody id="event-list">${eventRows(state.events)}</tbody></table></div><div class="pagination"><button class="button secondary" id="events-previous" ${pagination.has_previous ? '' : 'disabled'}>Previous</button><span class="muted">Page ${pagination.page} of ${pagination.total_pages}</span><button class="button secondary" id="events-next" ${pagination.has_next ? '' : 'disabled'}>Next</button></div></section>`;
}

function eventRows(events) {
  if (!events.length) return '<tr><td colspan="6" class="empty">No events stored yet.</td></tr>';
  return events.map(event => `<tr><td><a href="#event/${encodeURIComponent(event.event_id)}"><code>${escapeHtml((event.event_id || '').slice(0, 12))}</code></a></td><td>${escapeHtml(event.source?.vendor || 'Unknown')}</td><td><span class="tag">${escapeHtml(event.trace?.parser_name || 'none')}</span></td><td>${escapeHtml(event.event?.action || 'unclassified')}</td><td><span class="status ${statusClass(event.processing?.status)}">${escapeHtml(event.processing?.status || 'unknown')}</span></td><td class="muted">${escapeHtml(event.raw_ref?.ingested_at ? new Date(event.raw_ref.ingested_at).toLocaleString() : '-')}</td></tr>`).join('');
}

function bindEventsPage() {
  document.querySelector('#event-search-button')?.addEventListener('click', () => loadEventPage(1));
  document.querySelector('#event-search')?.addEventListener('keydown', event => { if (event.key === 'Enter') loadEventPage(1); });
  document.querySelector('#events-previous')?.addEventListener('click', () => loadEventPage((state.eventPagination?.page || 1) - 1));
  document.querySelector('#events-next')?.addEventListener('click', () => loadEventPage((state.eventPagination?.page || 1) + 1));
}

async function loadEventPage(page) {
  const search = document.querySelector('#event-search')?.value.trim() ?? state.eventQuery.search;
  const query = new URLSearchParams({ page: String(page), limit: String(state.eventQuery.limit) });
  if (search) query.set('search', search);
  try {
    const eventPage = await request(`/events?${query.toString()}`);
    state.events = eventPage.events;
    state.eventPagination = eventPage.pagination;
    state.eventQuery = { page: eventPage.pagination.page, limit: eventPage.pagination.limit, search };
    renderRoute();
  } catch (error) { toast(error.message, 'bad'); }
}

function eventDetailPage(id) {
  const event = state.events.find(item => item.event_id === decodeURIComponent(id));
  if (!event) return '<section class="page-copy"><h2>Event not found</h2><a href="#events">Back to history</a></section>';
  return `<section class="page-copy"><div><p class="eyebrow">Lossless event record</p><h2>${escapeHtml(event.event?.action || 'Event detail')}</h2><p class="muted">${escapeHtml(event.event_id)}</p></div><a class="button secondary" href="#events">Back to history</a></section><div class="detail-grid"><section class="panel detail-card"><div class="panel-head"><div><p class="eyebrow">Universal event</p><h3>Normalized output</h3></div><span class="status ${statusClass(event.processing?.status)}">${escapeHtml(event.processing?.status)}</span></div><pre>${escapeHtml(JSON.stringify(event, null, 2))}</pre></section><section class="panel detail-card"><div class="panel-head"><div><p class="eyebrow">Source of truth</p><h3>Original raw event</h3></div></div><pre id="raw-content">Loading raw content...</pre><div class="lineage" id="lineage"><p class="empty">Loading traceability...</p></div></section></div>`;
}

async function bindEventDetailPage(id) {
  const event = state.events.find(item => item.event_id === decodeURIComponent(id));
  if (!event) return;
  try {
    const trace = await request(`/events/${encodeURIComponent(event.event_id)}/trace`);
    document.querySelector('#raw-content').textContent = trace.raw_content || '(raw content unavailable)';
    document.querySelector('#lineage').innerHTML = `<div class="lineage-meta"><span>Raw ID <code>${escapeHtml(trace.raw_event_id)}</code></span><span>Parser <strong>${escapeHtml(trace.parser_name)}</strong></span><span>Hash <code>${escapeHtml(trace.raw_hash)}</code></span></div><pre>${escapeHtml(JSON.stringify(trace.field_lineage || {}, null, 2))}</pre>`;
  } catch (error) { document.querySelector('#raw-content').textContent = error.message; }
}

function deadLetterPage() {
  const pagination = state.deadPagination || { page: 1, total: 0, total_pages: 1, has_previous: false, has_next: false };
  return `<section class="page-copy"><div><p class="eyebrow">Never dropped</p><h2>Dead letter store</h2><p class="muted">Unsupported and unparseable input remains available for parser onboarding and investigation. Only the current page is loaded.</p></div><span class="status ${pagination.total ? 'warn' : 'good'}">${pagination.total} retained</span></section><section class="panel"><div class="toolbar"><div class="event-search"><input id="dead-search" value="${escapeHtml(state.deadQuery.search)}" placeholder="Search error, format, source, or raw content" /><button class="button secondary" id="dead-search-button">Search</button></div><span class="muted">${pagination.total} events</span></div><div class="table-wrap"><table><thead><tr><th>Raw event</th><th>Format</th><th>Error</th><th>Message</th><th>Preview</th><th>Recorded</th></tr></thead><tbody>${state.deadLetters.length ? state.deadLetters.map(item => `<tr><td><code>${escapeHtml((item.raw_event_id || '').slice(0, 12))}</code></td><td><span class="tag">${escapeHtml(item.detected_format || 'unknown')}</span></td><td><span class="status bad">${escapeHtml(item.error_code || 'ERROR')}</span></td><td>${escapeHtml(item.error_message)}</td><td class="truncate-cell">${escapeHtml(item.diagnostics?.sample_preview || item.raw_content)}</td><td class="muted">${escapeHtml(item.ingested_at)}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">No dead-lettered events. All received logs have a route.</td></tr>'}</tbody></table></div><div class="pagination"><button class="button secondary" id="dead-previous" ${pagination.has_previous ? '' : 'disabled'}>Previous</button><span class="muted">Page ${pagination.page} of ${pagination.total_pages}</span><button class="button secondary" id="dead-next" ${pagination.has_next ? '' : 'disabled'}>Next</button></div></section>`;
}

function bindDeadLetterPage() {
  document.querySelector('#dead-search-button')?.addEventListener('click', () => loadDeadLetterPage(1));
  document.querySelector('#dead-search')?.addEventListener('keydown', event => { if (event.key === 'Enter') loadDeadLetterPage(1); });
  document.querySelector('#dead-previous')?.addEventListener('click', () => loadDeadLetterPage((state.deadPagination?.page || 1) - 1));
  document.querySelector('#dead-next')?.addEventListener('click', () => loadDeadLetterPage((state.deadPagination?.page || 1) + 1));
}

async function loadDeadLetterPage(page) {
  const search = document.querySelector('#dead-search')?.value.trim() ?? state.deadQuery.search;
  const query = new URLSearchParams({ page: String(page), limit: String(state.deadQuery.limit) });
  if (search) query.set('search', search);
  try {
    const result = await request(`/healthcheck/dead-letter?${query.toString()}`);
    state.deadLetters = result.events;
    state.deadPagination = result.pagination;
    state.deadQuery = { page: result.pagination.page, limit: result.pagination.limit, search };
    renderRoute();
  } catch (error) { toast(error.message, 'bad'); }
}

function parsersPage() {
  return `<section class="page-copy"><div><p class="eyebrow">Plug and play</p><h2>Parser registry</h2><p class="muted">Define how a vendor log is identified, extracted, and mapped to the universal event. The onboarding guide has a complete example.</p></div><div class="form-actions"><a class="button secondary" href="/PARSER_ONBOARDING.md" target="_blank">Open onboarding guide</a><button class="button primary" id="reload-parsers">Reload from disk</button></div></section><div class="grid two"><section class="panel"><div class="panel-head"><div><p class="eyebrow">Installed</p><h3>${state.parsers.length} active definitions</h3></div></div><div class="parser-list">${state.parsers.map(parser => `<article class="parser-card"><div><strong>${escapeHtml(parser.name)}</strong><span>${escapeHtml(parser.vendor || 'Generic')} / ${escapeHtml(parser.format || 'auto')}</span></div><small>${Object.keys(parser.field_mappings || {}).length} mapped fields</small></article>`).join('')}</div></section><section class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">Register</p><h3>New parser definition</h3></div></div><form id="parser-form"><label>Name<input name="name" required placeholder="vendor-firewall"></label><label>Vendor<input name="vendor" required placeholder="Acme Security"></label><label>Product<input name="product" placeholder="Acme Firewall"></label><label>Device type<input name="device_type" value="firewall"></label><label>Format<select name="format"><option>key-value</option><option>json</option><option>regex</option></select></label><label>Extraction type<select name="extraction_type"><option>key-value</option><option>json</option><option>regex</option></select></label><label>Match text<input name="match" placeholder="optional fingerprint text"></label><label>Regex extraction pattern<textarea name="extraction_pattern" placeholder="Only for regex extraction"></textarea></label><label>Field mappings (JSON)<textarea name="field_mappings">{
  "src_ip": "network.source_ip",
  "action": "event.action"
}</textarea></label><button class="button primary" type="submit">Register parser</button></form></section></div>`;
}

function bindParsersPage() {
  document.querySelector('#reload-parsers')?.addEventListener('click', async () => {
    try { await request('/parsers/reload', { method: 'POST' }); await refresh(); toast('Parser registry reloaded', 'good'); } catch (error) { toast(error.message, 'bad'); }
  });
  document.querySelector('#parser-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const match = form.get('match').trim();
    let fieldMappings;
    try { fieldMappings = JSON.parse(form.get('field_mappings')); } catch (error) { return toast('Field mappings must be valid JSON', 'bad'); }
    const extractionType = form.get('extraction_type');
    const extraction = { type: extractionType };
    if (extractionType === 'regex') extraction.pattern = form.get('extraction_pattern').trim();
    const parser = { name: form.get('name').trim(), vendor: form.get('vendor').trim(), product: form.get('product').trim(), device_type: form.get('device_type').trim(), format: form.get('format'), version: '1.0', extraction, match_criteria: match ? { contains: [match] } : {}, field_mappings: fieldMappings };
    try { await request('/parsers', { method: 'POST', body: JSON.stringify(parser) }); await refresh(); route('parsers'); toast('Parser registered and ready', 'good'); } catch (error) { toast(error.message, 'bad'); }
  });
}

function sourcesPage() {
  return `<section class="page-copy"><div><p class="eyebrow">Plug and play</p><h2>Source registry</h2><p class="muted">Register devices once so vendor, product, transport, and parser context are ready for ingestion.</p></div></section><div class="grid two"><section class="panel"><div class="panel-head"><div><p class="eyebrow">Connected inventory</p><h3>${state.sources.length} registered sources</h3></div></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Vendor</th><th>Type</th><th>Address</th><th>Status</th></tr></thead><tbody>${state.sources.length ? state.sources.map(source => `<tr><td><strong>${escapeHtml(source.name)}</strong></td><td>${escapeHtml(source.vendor)}</td><td><span class="tag">${escapeHtml(source.device_type)}</span></td><td><code>${escapeHtml(source.device_ip || source.hostname || '-')}</code></td><td><span class="status ${source.active ? 'good' : 'muted'}">${source.active ? 'ACTIVE' : 'INACTIVE'}</span></td></tr>`).join('') : '<tr><td colspan="5" class="empty">No sources registered.</td></tr>'}</tbody></table></div></section><section class="panel form-panel"><div class="panel-head"><div><p class="eyebrow">Register</p><h3>Add a source</h3></div></div><form id="source-form"><label>Name<input name="name" required placeholder="Firewall core 01"></label><label>Vendor<input name="vendor" required placeholder="Fortinet"></label><label>Product<input name="product" placeholder="FortiGate 60E"></label><label>IP or hostname<input name="device_ip" placeholder="10.0.0.1"></label><label>Device type<select name="device_type"><option>firewall</option><option>ids</option><option>vpn</option><option>proxy</option><option>server</option></select></label><button class="button primary" type="submit">Register source</button></form></section></div>`;
}

function bindSourcesPage() {
  document.querySelector('#source-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const source = Object.fromEntries(form.entries());
    try { await request('/sources', { method: 'POST', body: JSON.stringify(source) }); await refresh(); route('sources'); toast('Source registered', 'good'); } catch (error) { toast(error.message, 'bad'); }
  });
}

function outputPage() {
  const latest = state.events[0];
  return `<section class="page-copy"><div><p class="eyebrow">SIEM handoff</p><h2>Output center</h2><p class="muted">Download the persisted normalized history in the format your next system expects.</p></div></section><div class="grid output-grid"><section class="panel output-card"><span class="output-icon">CEF</span><div><h3>Common Event Format</h3><p class="muted">ArcSight-compatible lines for SIEM ingestion.</p></div><a class="button primary" href="${API}/output/cef" download>Download CEF</a></section><section class="panel output-card"><span class="output-icon">JSON</span><div><h3>JSON Lines</h3><p class="muted">Complete universal events with traceability.</p></div><a class="button primary" href="${API}/output/jsonl" download>Download JSONL</a></section><section class="panel output-card"><span class="output-icon">ML</span><div><h3>Flat ML format</h3><p class="muted">One compact record per line for data pipelines.</p></div><a class="button primary" href="${API}/output/flat" download>Download flat JSONL</a></section></div><section class="panel preview-panel"><div class="panel-head"><div><p class="eyebrow">Output preview</p><h3>${latest ? 'Most recent event' : 'No events available'}</h3></div>${latest ? `<button class="button secondary" id="preview-cef">Preview CEF</button>` : ''}</div><pre id="output-preview">${latest ? 'Select Preview CEF to inspect the exact exported line.' : 'Ingest an event to preview output.'}</pre></section>`;
}

function bindOutputPage() {
  document.querySelector('#preview-cef')?.addEventListener('click', async () => {
    const preview = document.querySelector('#output-preview');
    try { const result = await request(`/output/cef/${encodeURIComponent(state.events[0].event_id)}`); preview.textContent = result.cef || 'No CEF output returned.'; } catch (error) { preview.textContent = error.message; }
  });
}

function testPage() {
  return `<section class="page-copy"><div><p class="eyebrow">Local verification</p><h2>Test before you ingest</h2><p class="muted">Run a parser-only check or send one log through ingestion. Results stay readable and the ingest response is saved to history.</p></div></section><div class="grid test-grid"><section class="panel form-panel"><label for="log-input">Raw log line</label><textarea id="log-input">${sampleLog}</textarea><div class="form-actions"><button class="button primary" id="ingest">Ingest and normalize</button><button class="button secondary" id="parser-test">Test parser only</button><button class="button secondary" id="load-sample">Restore sample</button></div><p class="hint">Parser-only checks never create history. Ingest creates exactly one durable event.</p></section><section class="panel result-panel"><div class="panel-head"><div><p class="eyebrow">Structured response</p><h3 id="result-title">Waiting for a test</h3></div></div><pre id="result">Submit a log to inspect the normalized response.</pre></section></div>
    <section class="panel system-log-panel"><div class="panel-head"><div><p class="eyebrow">Ubuntu system logs</p><h3>Process a real local log file</h3><p class="muted">The backend reads this path in small batches, yields between batches, preserves each raw line, and lets you stop safely.</p></div><span class="tag">batch size: 25</span></div><div class="system-log-body"><label for="system-log-path">Log file path<input id="system-log-path" value="/var/log/syslog" placeholder="/var/log/syslog"></label><div class="form-actions"><button class="button primary" id="ingest-system-log">Process system log</button><button class="button secondary" id="stop-system-log" disabled>Stop ingestion</button><button class="button secondary" id="load-journal-command">Show journal command</button></div><p class="hint">If Ubuntu does not have <code>/var/log/syslog</code>, export readable journald lines with <code>journalctl -o short-iso --no-pager -n 100 &gt; /tmp/ubuntu-system.log</code>, then process <code>/tmp/ubuntu-system.log</code>.</p><div id="system-log-result" class="system-log-result" aria-live="polite">No system log run yet.</div></div></section>`;
}

function bindTestPage() {
  document.querySelector('#load-sample')?.addEventListener('click', () => { document.querySelector('#log-input').value = sampleLog; });
  document.querySelector('#load-journal-command')?.addEventListener('click', () => {
    const result = document.querySelector('#system-log-result');
    result.innerHTML = '<strong>Run in a terminal:</strong><pre>journalctl -o short-iso --no-pager -n 100 &gt; /tmp/ubuntu-system.log</pre><span>Then set the path above to <code>/tmp/ubuntu-system.log</code> and process it.</span>';
  });
  document.querySelector('#ingest-system-log')?.addEventListener('click', async () => {
    const filePath = document.querySelector('#system-log-path').value.trim();
    const result = document.querySelector('#system-log-result');
    const button = document.querySelector('#ingest-system-log');
    const stopButton = document.querySelector('#stop-system-log');
    if (!filePath) return toast('Enter a system log file path', 'bad');
    button.disabled = true;
    stopButton.disabled = false;
    result.textContent = 'Starting a cancellable batch job...';
    try {
      const job = await request('/events/ingest-file/start', { method: 'POST', body: JSON.stringify({ filePath, batchSize: 25, source_vendor: 'Canonical', source_product: 'Ubuntu Linux', source_device_type: 'operating-system', source_name: 'This laptop' }) });
      state.systemLogJob = job;
      await pollSystemLogJob(job.jobId);
    } catch (error) { result.textContent = error.message; button.disabled = false; stopButton.disabled = true; toast(error.message, 'bad'); }
  });
  document.querySelector('#stop-system-log')?.addEventListener('click', async () => {
    if (!state.systemLogJob?.jobId) return;
    try { await request(`/events/ingest-file/${state.systemLogJob.jobId}/stop`, { method: 'POST' }); toast('Stop requested; finishing the current batch', 'warn'); } catch (error) { toast(error.message, 'bad'); }
  });
  document.querySelector('#parser-test')?.addEventListener('click', async () => {
    const log = document.querySelector('#log-input').value.trim();
    if (!log) return toast('Enter a raw log first', 'bad');
    try { const result = await request('/parsers/test', { method: 'POST', body: JSON.stringify({ log }) }); document.querySelector('#result-title').textContent = 'Parser-only result'; document.querySelector('#result').textContent = JSON.stringify(result, null, 2); toast('Parser test completed without ingesting', 'good'); } catch (error) { toast(error.message, 'bad'); }
  });
  document.querySelector('#ingest')?.addEventListener('click', async () => {
    const log = document.querySelector('#log-input').value.trim();
    if (!log) return toast('Enter a raw log first', 'bad');
    const button = document.querySelector('#ingest');
    button.disabled = true;
    try {
      const event = await request('/events/ingest', { method: 'POST', body: JSON.stringify({ log, transport: 'local-test' }) });
      document.querySelector('#result-title').textContent = 'Accepted and normalized';
      document.querySelector('#result').textContent = JSON.stringify(event, null, 2);
      toast('Event persisted and written to backend output', 'good');
      await refresh();
    } catch (error) { toast(error.message, 'bad'); } finally { button.disabled = false; }
  });
}

async function pollSystemLogJob(jobId) {
  const result = document.querySelector('#system-log-result');
  const startButton = document.querySelector('#ingest-system-log');
  const stopButton = document.querySelector('#stop-system-log');
  try {
    const job = await request(`/events/ingest-file/${jobId}`);
    state.systemLogJob = job;
    result.innerHTML = `<strong>${escapeHtml(job.status)}</strong><p>Processed ${job.processed} lines in batches of ${job.batchSize}. Source: Canonical / Ubuntu Linux / This laptop.</p>`;
    if (['QUEUED', 'RUNNING'].includes(job.status)) return setTimeout(() => pollSystemLogJob(jobId), 300);
    startButton.disabled = false;
    stopButton.disabled = true;
    if (job.status === 'COMPLETED' || job.status === 'STOPPED') {
      await refresh();
      toast(job.status === 'STOPPED' ? `Stopped after ${job.processed} lines` : `Processed ${job.processed} system log lines`, job.status === 'STOPPED' ? 'warn' : 'good');
    } else {
      result.textContent = job.error || 'System log job failed';
      toast(result.textContent, 'bad');
    }
  } catch (error) {
    startButton.disabled = false;
    stopButton.disabled = true;
    result.textContent = error.message;
    toast(error.message, 'bad');
  }
}

function toast(message, tone) { const node = document.createElement('div'); node.className = `toast ${tone}`; node.textContent = message; document.querySelector('#toast').append(node); setTimeout(() => node.remove(), 3500); }

render();
refresh();
setInterval(() => refresh(), 10000);
