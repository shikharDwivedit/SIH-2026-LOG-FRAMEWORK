// CEF Output Adapter — formats a UniversalEvent into ArcSight Common Event Format
// SRS FR-7: "Adapters for Syslog/CEF/LEEF/HEC"
// CEF:Version|Device Vendor|Device Product|Device Version|Signature ID|Name|Severity|Extension

function formatCEF(normalizedEvent) {
  const src  = normalizedEvent.source || {};
  const evt  = normalizedEvent.event  || {};
  const net  = normalizedEvent.network || {};
  const id   = normalizedEvent.identity || {};
  const thr  = normalizedEvent.threat  || {};
  const trace = normalizedEvent.trace  || {};

  const vendor    = _escapeCEF(src.vendor  || "Generic");
  const product   = _escapeCEF(src.product || "Unknown");
  const devVer    = _escapeCEF(src.transport || "1.0");
  const sigId     = _escapeCEF(thr.rule_id  || normalizedEvent.event_id || "0");
  const name      = _escapeCEF(evt.action   || "event");
  const severity  = _cefSeverity(evt.severity);

  // Build CEF extension (key=value pairs)
  const ext = [];
  if (net.source_ip)        ext.push(`src=${net.source_ip}`);
  if (net.source_port)      ext.push(`spt=${net.source_port}`);
  if (net.destination_ip)   ext.push(`dst=${net.destination_ip}`);
  if (net.destination_port) ext.push(`dpt=${net.destination_port}`);
  if (net.protocol)         ext.push(`proto=${net.protocol}`);
  if (evt.timestamp)        ext.push(`rt=${evt.timestamp}`);
  if (evt.outcome)          ext.push(`outcome=${_escapeCEFExt(evt.outcome)}`);
  if (evt.category)         ext.push(`cat=${_escapeCEFExt(evt.category)}`);
  if (id.username)          ext.push(`suser=${_escapeCEFExt(id.username)}`);
  if (thr.signature)        ext.push(`signature=${_escapeCEFExt(thr.signature)}`);
  if (thr.risk_score != null) ext.push(`risk=${thr.risk_score}`);
  ext.push(`rawHash=${normalizedEvent.raw_ref?.hash || ""}`);
  ext.push(`eventId=${normalizedEvent.event_id}`);
  ext.push(`parserName=${trace.parser_name || "unknown"}`);

  const cefLine = `CEF:0|${vendor}|${product}|${devVer}|${sigId}|${name}|${severity}|${ext.join(" ")}`;
  return cefLine;
}

function _cefSeverity(sev) {
  const s = (sev || "informational").toLowerCase();
  if (["critical", "emergency"].includes(s)) return "10";
  if (s === "high")    return "8";
  if (s === "medium")  return "5";
  if (s === "low")     return "3";
  return "1"; // informational, notice, debug
}

function _escapeCEF(val) {
  return String(val || "").replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

function _escapeCEFExt(val) {
  return String(val || "").replace(/=/g, "\\=").replace(/\n/g, "\\n");
}

module.exports = { formatCEF };
