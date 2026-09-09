const dgram = require("dgram");
const { logger } = require("../../src/utils/logger");

class SyslogUdpListener {
  constructor(ingestionManager, port = 5140, host = "0.0.0.0") {
    this.ingestionManager = ingestionManager;
    this.port = port;
    this.host = host;
    this.server = null;
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = dgram.createSocket("udp4");

      this.server.on("message", (msg, rinfo) => {
        const rawContent = msg.toString("utf-8").trim();
        this.ingestionManager.ingest({
          rawContent,
          sourceIp: rinfo.address,
          transport: "syslog-udp",
          metadata: { port: rinfo.port }
        }).catch(err => {
          logger.error(`Syslog UDP ingestion error: ${err.message}`);
        });
      });

      this.server.on("error", (err) => {
        logger.error(`Syslog UDP server error: ${err.message}`);
        this.server.close();
        reject(err);
      });

      this.server.bind(this.port, this.host, () => {
        logger.info(`📡 Syslog UDP Collector listening on ${this.host}:${this.port}`);
        resolve();
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info("Syslog UDP Collector stopped.");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = { SyslogUdpListener };
