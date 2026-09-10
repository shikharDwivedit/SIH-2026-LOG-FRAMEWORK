const fs   = require("fs");
const path = require("path");
const { eventProcessingService } = require("./event-processing.service");
const { sourceRegistryService }  = require("../source/source-registry.service");
const { logger }                 = require("../../utils/logger");

const SAMPLE_FILE = path.join(__dirname, "..", "..", "..", "samples", "sample_test_logs.log");

function seedInitialData() {
  try {
    if (eventProcessingService.getAllNormalizedEvents().length > 0) {
      logger.info("Existing event history found; skipping initial sample seed.");
      return;
    }

    logger.info("Seeding initial sample logs into normalization framework...");

    // Register default sources
    sourceRegistryService.register({
      name: "FW-FortiGate-Core",
      vendor: "Fortinet",
      product: "FortiGate 60E",
      device_ip: "10.0.0.1",
      device_type: "firewall",
      transport: "syslog-udp"
    });
    sourceRegistryService.register({
      name: "ASA-Edge-01",
      vendor: "Cisco",
      product: "ASA 5505",
      device_ip: "198.51.100.1",
      device_type: "firewall",
      transport: "syslog-tcp"
    });
    sourceRegistryService.register({
      name: "PA-3020-Primary",
      vendor: "Palo Alto Networks",
      product: "PA-3020",
      device_ip: "192.168.2.1",
      device_type: "firewall",
      transport: "syslog-udp"
    });
    sourceRegistryService.register({
      name: "Snort-IDS-Sensor",
      vendor: "Snort",
      product: "Snort 2.9",
      device_ip: "192.168.1.100",
      device_type: "ids",
      transport: "http"
    });
    sourceRegistryService.register({
      name: "Squid-Proxy-DMZ",
      vendor: "Squid",
      product: "Squid Proxy",
      device_ip: "192.168.1.75",
      device_type: "proxy",
      transport: "file"
    });

    if (!fs.existsSync(SAMPLE_FILE)) {
      logger.warn(`Sample log file not found at ${SAMPLE_FILE}`);
      return;
    }

    const lines = fs
      .readFileSync(SAMPLE_FILE, "utf-8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));

    lines.forEach((line) => {
      eventProcessingService.processSingleRawLog(line, { transport: "auto-seed" });
    });

    logger.info(`Initialized dashboard with ${lines.length} initial normalized events.`);

  } catch (err) {
    logger.error(`Error during auto-seeding: ${err.message}`);
  }
}

module.exports = { seedInitialData };
