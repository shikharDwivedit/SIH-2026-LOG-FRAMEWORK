const { eventProcessingService } = require("../../src/services/event/event-processing.service");
const { logger }                = require("../../src/utils/logger");

class EventWorker {
  constructor(queue) {
    this.queue = queue;
    this.isRunning = false;
    this.timer = null;
  }

  start(intervalMs = 100) {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info("⚡ Event Processing Worker started — listening for queue jobs...");

    this.timer = setInterval(async () => {
      await this.processQueue();
    }, intervalMs);
  }

  async processQueue() {
    await this.queue.consume(async (job) => {
      logger.debug(`Worker processing job ${job.jobId} (rawEventId: ${job.rawEventId})`);
      const metadata = job.metadata || {};
      eventProcessingService.processSingleRawLog(job.rawContent, {
        ...metadata,
        source_id: metadata.source_id || metadata.sourceId,
        source_ip: metadata.source_ip || metadata.sourceIp
      });
    });
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.isRunning = false;
    logger.info("Worker stopped.");
  }
}

module.exports = { EventWorker };
