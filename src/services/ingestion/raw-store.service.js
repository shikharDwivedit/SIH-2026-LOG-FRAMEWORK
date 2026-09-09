const { generateSha256, generateUuid } = require("../../utils/hash");

class RawStoreService {
  constructor() {
    this.rawStorage = new Map();
  }

  createRawEvent(rawContent, metadata = {}) {
    if (typeof rawContent !== "string") {
      rawContent = String(rawContent || "");
    }

    const rawEventId = generateUuid();
    const hash = generateSha256(rawContent);
    const ingestedAt = new Date().toISOString();

    const rawEvent = {
      raw_event_id: rawEventId,
      raw_content: rawContent,
      hash,
      ingested_at: ingestedAt,
      source_id: metadata.source_id || "unknown",
      transport: metadata.transport || "file",
      source_ip: metadata.source_ip || null
    };

    this.rawStorage.set(hash, rawEvent);
    this.rawStorage.set(rawEventId, rawEvent);

    return rawEvent;
  }

  getRawEventByHash(hash) {
    return this.rawStorage.get(hash) || null;
  }

  getRawEventById(id) {
    return this.rawStorage.get(id) || null;
  }

  getAllRawEvents() {
    return Array.from(new Set(this.rawStorage.values()));
  }
}

const rawStoreService = new RawStoreService();

module.exports = { rawStoreService, RawStoreService };
