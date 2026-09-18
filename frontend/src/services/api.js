const API_BASE = '/api/v1';

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
  return payload.data;
}

export const api = {
  health: () => apiRequest('/healthcheck'),
  metrics: () => apiRequest('/healthcheck/metrics'),
  events: query => apiRequest(`/events?${new URLSearchParams(query).toString()}`),
  event: id => apiRequest(`/events/${encodeURIComponent(id)}`),
  trace: id => apiRequest(`/events/${encodeURIComponent(id)}/trace`),
  replay: (id, parser_name) => apiRequest(`/events/${encodeURIComponent(id)}/replay`, { method: 'POST', body: JSON.stringify({ parser_name }) }),
  deadLetters: query => apiRequest(`/healthcheck/dead-letter?${new URLSearchParams(query).toString()}`),
  parsers: () => apiRequest('/parsers'),
  sources: () => apiRequest('/sources'),
  source: id => apiRequest(`/sources/${encodeURIComponent(id)}`),
  registerParser: value => apiRequest('/parsers', { method: 'POST', body: JSON.stringify(value) }),
  testParser: value => apiRequest('/parsers/test', { method: 'POST', body: JSON.stringify(value) }),
  reloadParsers: () => apiRequest('/parsers/reload', { method: 'POST' }),
  registerSource: value => apiRequest('/sources', { method: 'POST', body: JSON.stringify(value) }),
  ingest: value => apiRequest('/events/ingest', { method: 'POST', body: JSON.stringify(value) }),
  reset: () => apiRequest('/healthcheck/reset', { method: 'POST' }),
  outputPreview: id => apiRequest(`/output/cef/${encodeURIComponent(id)}`)
};
