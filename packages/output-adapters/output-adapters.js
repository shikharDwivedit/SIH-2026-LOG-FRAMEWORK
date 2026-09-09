const { formatCEF }   = require("../../src/services/output/cef.adapter");
const { formatJSONL, formatFlat } = require("../../src/services/output/jsonl.adapter");

class CefOutputAdapter {
  constructor(destination = "stdout") {
    this.name = "CEF-Adapter";
    this.format = "cef";
    this.delivered = 0;
    this.destination = destination;
  }

  async send(event) {
    const line = formatCEF(event);
    this.delivered++;
    return line;
  }

  async sendBatch(events) {
    const lines = [];
    for (const evt of events) {
      lines.push(await this.send(evt));
    }
    return lines;
  }

  async health() {
    return { status: 'UP', destination: this.destination, deliveredCount: this.delivered };
  }
}

class JsonlOutputAdapter {
  constructor(destination = "stdout") {
    this.name = "JSONL-Adapter";
    this.format = "jsonl";
    this.delivered = 0;
    this.destination = destination;
  }

  async send(event) {
    const line = formatJSONL(event);
    this.delivered++;
    return line;
  }

  async sendBatch(events) {
    const lines = [];
    for (const evt of events) {
      lines.push(await this.send(evt));
    }
    return lines;
  }

  async health() {
    return { status: 'UP', destination: this.destination, deliveredCount: this.delivered };
  }
}

class FlatOutputAdapter {
  constructor(destination = "stdout") {
    this.name = "Flat-Adapter";
    this.format = "flat";
    this.delivered = 0;
    this.destination = destination;
  }

  async send(event) {
    const line = formatFlat(event);
    this.delivered++;
    return line;
  }

  async sendBatch(events) {
    const lines = [];
    for (const evt of events) {
      lines.push(await this.send(evt));
    }
    return lines;
  }

  async health() {
    return { status: 'UP', destination: this.destination, deliveredCount: this.delivered };
  }
}

module.exports = { CefOutputAdapter, JsonlOutputAdapter, FlatOutputAdapter };
