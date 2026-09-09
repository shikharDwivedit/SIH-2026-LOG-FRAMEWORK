const { rawStoreService }       = require("../ingestion/raw-store.service");
const { deadLetterService }     = require("../ingestion/dead-letter.service");
const { eventProcessingService } = require("./event-processing.service");
const { logger }                = require("../../utils/logger");

class ReplayService {
  replayRawEvent(rawEventId, options = {}) {
    const rawEvent = rawStoreService.getRawEventById(rawEventId);
    if (!rawEvent) {
      throw new Error(`Raw event with ID '${rawEventId}' not found in raw event store`);
    }

    logger.info(`🔄 Replaying raw event '${rawEventId}' (Parser hint: ${options.parserName || 'auto'})...`);

    // Re-run raw event content through processing pipeline
    const normalizedEvent = eventProcessingService.processSingleRawLog(rawEvent.raw_content, {
      source_id: rawEvent.source_id,
      transport: "replay",
      parserName: options.parserName
    });

    // If replayed event parsed successfully, remove from dead-letter store if present
    if (normalizedEvent.processing.status === "PROCESSED" || normalizedEvent.processing.status === "PARTIALLY_PROCESSED") {
      const deadLetterItems = deadLetterService.getAll();
      const match = deadLetterItems.find(item => item.raw_event_id === rawEventId);
      if (match) {
        deadLetterService.store.delete(match.dead_letter_id);
        logger.info(`✅ Dead letter item '${match.dead_letter_id}' resolved and removed after successful replay!`);
      }
    }

    return normalizedEvent;
  }

  replayAllDeadLetter(options = {}) {
    const deadLetters = deadLetterService.getAll();
    logger.info(`🔄 Replaying ${deadLetters.length} dead-lettered events...`);

    const replayed = [];
    for (const dl of deadLetters) {
      try {
        const evt = this.replayRawEvent(dl.raw_event_id, options);
        replayed.push(evt);
      } catch (err) {
        logger.error(`Replay error for raw event ${dl.raw_event_id}: ${err.message}`);
      }
    }

    return { totalReplayed: replayed.length, events: replayed };
  }
}

const replayService = new ReplayService();

module.exports = { replayService, ReplayService };
