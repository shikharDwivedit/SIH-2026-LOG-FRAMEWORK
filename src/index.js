const { app } = require("./app");
const { config } = require("./config/env");
const { logger } = require("./utils/logger");
const { IngestionManager } = require("../packages/ingestion/ingestion-manager");
const { SyslogUdpListener } = require("../packages/ingestion/syslog-udp-listener");
const { LocalEventQueue } = require("../packages/queue/event-queue");
const { EventWorker } = require("../apps/worker/event-worker");

const PORT = config.port;
const queue = new LocalEventQueue();
const ingestionManager = new IngestionManager(undefined, queue);
const worker = new EventWorker(queue);
const syslogListener = new SyslogUdpListener(ingestionManager, config.syslogPort, config.syslogHost);

const server = app.listen(PORT, async () => {
  logger.info(`⚙️  Server is running at port : ${PORT}`);
  logger.info(`🚀 Universal Log Normalization Framework v${config.schemaVersion} ready`);
  worker.start();
  try {
    await syslogListener.start();
  } catch (error) {
    logger.error(`Syslog UDP listener failed to start: ${error.message}`);
  }
});

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down ingestion services...`);
  worker.stop();
  await syslogListener.stop();
  server.close(() => process.exit(0));
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

