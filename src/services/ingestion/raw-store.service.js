const { generateSha256, generateUuid } = require("../../utils/hash");
const { LocalRawEventStore }          = require("../../../packages/storage/raw-event-store");

class RawStoreService {
  constructor() {
    this.store = new LocalRawEventStore();
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
      source_ip: metadata.source_ip || null,
      source_vendor: metadata.source_vendor || null,
      source_product: metadata.source_product || null,
      source_device_type: metadata.source_device_type || null,
      source_name: metadata.source_name || null
    };

    // Persist before parsing so a process failure cannot create a normalized
    // event without its source record.
    this.store.saveSync({
      eventId: rawEventId,
      rawContent,
      rawHash: hash,
      ingestedAt,
      sourceId: rawEvent.source_id,
      transport: rawEvent.transport,
      metadata
    });

    return rawEvent;
  }

  getRawEventByHash(hash) {
    const item = this.store.getByHashSync(hash);
    if (!item) return null;
    return {
      raw_event_id: item.eventId,
      raw_content: item.rawContent,
      hash: item.rawHash,
      ingested_at: item.ingestedAt,
      source_id: item.sourceId || "unknown",
      transport: item.transport || "file"
    };
  }

  getRawEventById(id) {
    const item = this.store.getSync(id);
    if (!item) return null;
    return {
      raw_event_id: item.eventId,
      raw_content: item.rawContent,
      hash: item.rawHash,
      ingested_at: item.ingestedAt,
      source_id: item.sourceId || "unknown",
      transport: item.transport || "file"
    };
  }

  getAllRawEvents() {
    const items = this.store.listSync();
    return items.map(item => ({
      raw_event_id: item.eventId,
      raw_content: item.rawContent,
      hash: item.rawHash,
      ingested_at: item.ingestedAt,
      source_id: item.sourceId || "unknown",
      transport: item.transport || "file"
    }));
  }
}

const rawStoreService = new RawStoreService();

module.exports = { rawStoreService, RawStoreService };
