const fs = require("fs");
const path = require("path");

class MetricsService {
  constructor() {
    this.reset();
    this.load();
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

  get storagePath() {
    return path.join(process.cwd(), "storage", "metrics.json");
  }

  load() {
    try {
      const saved = JSON.parse(fs.readFileSync(this.storagePath, "utf8"));
      this.counters = { ...this.counters, ...(saved.counters || {}) };
      this.parserHits = saved.parserHits || {};
      this.formatCounts = saved.formatCounts || {};
      this.sourceCounts = saved.sourceCounts || {};
      this._processingTimes = saved.processingTimes || [];
      this._startTime = Date.now();
    } catch {
      // A first run starts with an empty metrics snapshot.
    }
  }

  persist() {
    fs.mkdirSync(path.dirname(this.storagePath), { recursive: true });
    fs.writeFileSync(this.storagePath, JSON.stringify({
      counters: this.counters,
      parserHits: this.parserHits,
      formatCounts: this.formatCounts,
      sourceCounts: this.sourceCounts,
      processingTimes: this._processingTimes
    }, null, 2));
  }

  recordReceived() {
    this.counters.eventsReceived++;
    this.persist();
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
    this.persist();
  }

  recordDeadLettered() {
    this.counters.deadLettered++;
    this.counters.eventsFailed++;
    this.persist();
  }

  recordFormat(format) {
    this.formatCounts[format] = (this.formatCounts[format] || 0) + 1;
    this.persist();
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
