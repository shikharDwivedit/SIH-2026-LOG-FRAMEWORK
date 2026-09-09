// Dead-letter store — preserves every event that fails parsing/normalization
// SRS §12: "The system must record processing errors without deleting the original event."
// Pattern: raw event → PARSER_ERROR → dead-letter store (never dropped)

const { generateUuid } = require("../../utils/hash");

class DeadLetterService {
  constructor() {
    this.store = new Map(); // deadLetterId -> dead-letter record
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
}

const deadLetterService = new DeadLetterService();

module.exports = { deadLetterService, DeadLetterService };
