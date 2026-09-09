const crypto = require("crypto");
const { LocalRawEventStore } = require("../storage/raw-event-store");
const { LocalEventQueue }    = require("../queue/event-queue");

class IngestionManager {
  constructor(rawStore, queue) {
    this.rawStore = rawStore || new LocalRawEventStore();
    this.queue = queue || new LocalEventQueue();
  }

  async ingest(payload) {
    const rawContent = typeof payload.rawContent === 'string' ? payload.rawContent : String(payload.rawContent || '');
    
    const eventId = crypto.randomUUID();
    const rawHash = crypto.createHash("sha256").update(rawContent, "utf8").digest("hex");
    const ingestedAt = new Date().toISOString();

    const rawEvent = {
      eventId,
      rawContent,
      rawHash,
      ingestedAt,
      sourceId: payload.sourceId || "unknown",
      transport: payload.transport || "http",
      metadata: {
        sourceIp: payload.sourceIp,
        ...(payload.metadata || {})
      }
    };

    await this.rawStore.save(rawEvent);

    const job = await this.queue.publish({
      rawEventId: eventId,
      rawContent,
      metadata: {
        sourceId: rawEvent.sourceId,
        transport: rawEvent.transport,
        sourceIp: payload.sourceIp,
        ...(payload.metadata || {})
      }
    });

    return { rawEvent, jobId: job.jobId };
  }
}

module.exports = { IngestionManager };
