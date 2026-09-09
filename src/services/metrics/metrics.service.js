// Metrics service — tracks events received, processed, failed, EPS, parser hit counts
// This is a simple in-memory singleton; pluggable into a real metrics store later

class MetricsService {
  constructor() {
    this.reset();
    this._startTime = Date.now();
  }

  reset() {
    this.counters = {
      eventsReceived: 0,
      eventsProcessed: 0,
      eventsFailed: 0,
      eventsPartial: 0,
      eventsUnsupported: 0,
      validationErrors: 0,
      parserErrors: 0,
      deadLettered: 0
    };
    this.parserHits = {};        // parser_name -> count
    this.formatCounts = {};      // detected format -> count
    this.sourceCounts = {};      // vendor -> count
    this._processingTimes = [];  // last N processing durations in ms
    this._startTime = Date.now();
  }

  recordReceived() {
    this.counters.eventsReceived++;
  }

  recordProcessed(normalizedEvent, durationMs) {
    const status = normalizedEvent?.processing?.status;
    if (status === "PROCESSED") this.counters.eventsProcessed++;
    else if (status === "PARTIALLY_PROCESSED") this.counters.eventsPartial++;
    else if (status === "PARSER_ERROR") { this.counters.eventsFailed++; this.counters.parserErrors++; }
    else if (status === "VALIDATION_ERROR") { this.counters.eventsFailed++; this.counters.validationErrors++; }
    else if (status === "UNSUPPORTED") this.counters.eventsUnsupported++;

    const parserName = normalizedEvent?.trace?.parser_name || "unknown";
    this.parserHits[parserName] = (this.parserHits[parserName] || 0) + 1;

    const vendor = normalizedEvent?.source?.vendor || "unknown";
    this.sourceCounts[vendor] = (this.sourceCounts[vendor] || 0) + 1;

    if (durationMs !== undefined) {
      this._processingTimes.push(durationMs);
      if (this._processingTimes.length > 1000) this._processingTimes.shift();
    }
  }

  recordDeadLettered() {
    this.counters.deadLettered++;
    this.counters.eventsFailed++;
  }

  recordFormat(format) {
    this.formatCounts[format] = (this.formatCounts[format] || 0) + 1;
  }

  getEPS() {
    const uptimeSec = (Date.now() - this._startTime) / 1000;
    return uptimeSec > 0 ? (this.counters.eventsReceived / uptimeSec).toFixed(2) : "0.00";
  }

  getAvgLatencyMs() {
    if (this._processingTimes.length === 0) return 0;
    const sum = this._processingTimes.reduce((a, b) => a + b, 0);
    return (sum / this._processingTimes.length).toFixed(2);
  }

  getSummary() {
    return {
      uptime_seconds: Math.floor((Date.now() - this._startTime) / 1000),
      events_per_second: parseFloat(this.getEPS()),
      avg_processing_latency_ms: parseFloat(this.getAvgLatencyMs()),
      counters: { ...this.counters },
      parser_hits: { ...this.parserHits },
      format_counts: { ...this.formatCounts },
      source_counts: { ...this.sourceCounts }
    };
  }
}

const metricsService = new MetricsService();

module.exports = { metricsService, MetricsService };
