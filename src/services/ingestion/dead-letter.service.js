// Dead-letter store — preserves every event that fails parsing/normalization
// SRS §12: "The system must record processing errors without deleting the original event."
// Pattern: raw event → PARSER_ERROR → dead-letter store (never dropped)

const { generateUuid } = require("../../utils/hash");
const fs = require("fs");
const path = require("path");

class DeadLetterService {
  constructor() {
    this.store = new Map(); // deadLetterId -> dead-letter record
    this.storagePath = path.join(process.cwd(), "storage", "dead_letters.json");
    try {
      const saved = JSON.parse(fs.readFileSync(this.storagePath, "utf8"));
      saved.forEach(record => this.store.set(record.dead_letter_id, record));
    } catch {
      // A first run starts with an empty dead-letter store.
    }
  }

  record(rawEvent, errorInfo = {}) {
    const id = generateUuid();

    const record = {
      dead_letter_id: id,
      raw_event_id: rawEvent.raw_event_id,
      raw_hash: rawEvent.hash,
      raw_content: rawEvent.raw_content,
      ingested_at: rawEvent.ingested_at,
      source_id: rawEvent.source_id || "unknown",
      transport: rawEvent.transport || "unknown",
      error_code: errorInfo.code || "UNKNOWN_ERROR",
      error_message: errorInfo.message || "Processing failed",
      errors: errorInfo.errors || [],
      detected_format: errorInfo.detectedFormat || "unknown",
      attempted_parser: errorInfo.attemptedParser || null,
      recorded_at: new Date().toISOString(),
      // Diagnostics to help onboard a new parser (SRS §13)
      diagnostics: {
        hint: "No matching parser found. Create a parser config in the parsers/ directory.",
        raw_length: rawEvent.raw_content?.length || 0,
        detected_format: errorInfo.detectedFormat || "unknown",
        sample_preview: (rawEvent.raw_content || "").substring(0, 200)
      }
    };

    this.store.set(id, record);
    fs.mkdirSync(path.dirname(this.storagePath), { recursive: true });
    fs.writeFileSync(this.storagePath, JSON.stringify(this.getAll(), null, 2));
    return record;
  }

  getAll() {
    return Array.from(this.store.values());
  }

  getById(id) {
    return this.store.get(id) || null;
  }

  getCount() {
    return this.store.size;
  }

  reset() {
    this.store.clear();
    fs.mkdirSync(path.dirname(this.storagePath), { recursive: true });
    fs.writeFileSync(this.storagePath, "[]", "utf8");
  }

  getPage({ page = 1, limit = 25, search = "" } = {}) {
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 25));
    const query = String(search || "").trim().toLowerCase();
    const allRecords = this.getAll().sort((left, right) => (right.recorded_at || "").localeCompare(left.recorded_at || ""));
    const filtered = query ? allRecords.filter(record => JSON.stringify(record).toLowerCase().includes(query)) : allRecords;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageNumber = Math.min(currentPage, totalPages);
    const start = (pageNumber - 1) * pageSize;
    return {
      events: filtered.slice(start, start + pageSize),
      pagination: { page: pageNumber, limit: pageSize, total, total_pages: totalPages, has_next: pageNumber < totalPages, has_previous: pageNumber > 1 }
    };
  }
}

const deadLetterService = new DeadLetterService();

module.exports = { deadLetterService, DeadLetterService };
