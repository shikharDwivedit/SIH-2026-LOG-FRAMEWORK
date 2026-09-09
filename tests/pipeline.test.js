const assert = require("assert");
const path = require("path");
const { eventProcessingService } = require("../src/services/event/event-processing.service");
const { fileIngestionService } = require("../src/services/ingestion/file-ingestion.service");
const { parserRegistryService } = require("../src/services/parser/parser-registry.service");

async function runTests() {
  console.log("==================================================================");
  console.log("🧪 RUNNING SIH 2026 UNIVERSAL LOG NORMALIZATION TEST SUITE");
  console.log("==================================================================\n");

  // Ensure parsers loaded
  parserRegistryService.init();

  // Test 1: Single FortiGate Log Normalization & Lossless Guarantee
  console.log("▶ Test 1: FortiGate Key-Value Log Ingestion & Lossless Normalization");
  const rawFortiGate = '<185>date=2026-09-09 time=14:02:11 devname="fw01" devid="FGT60D4614000001" logid="0000000013" type="traffic" level="notice" srcip=10.0.0.5 srcport=54321 dstip=8.8.8.8 dstport=443 proto=6 action="deny" status="blocked" msg="Access denied by policy 10" user="admin" policyid=10 custom_field_x="unmapped_val"';

  const event1 = eventProcessingService.processSingleRawLog(rawFortiGate, { source_ip: "10.0.0.1" });

  assert.strictEqual(event1.source.vendor, "Fortinet");
  assert.strictEqual(event1.network.source_ip, "10.0.0.5");
  assert.strictEqual(event1.network.source_port, 54321);
  assert.strictEqual(event1.network.destination_ip, "8.8.8.8");
  assert.strictEqual(event1.network.destination_port, 443);
  assert.strictEqual(event1.event.action, "deny");
  assert.strictEqual(event1.identity.username, "admin");

  // Lossless check: Unmapped field preserved in extensions.vendor_specific
  assert.strictEqual(event1.extensions.vendor_specific.custom_field_x, "unmapped_val");
  assert.strictEqual(event1.extensions.vendor_specific.devid, "FGT60D4614000001");
  console.log("  ✅ FortiGate Log parsed, canonicalized, and vendor extension retained!");

  // Test 2: Traceability Verification
  console.log("\n▶ Test 2: Raw-to-Normalized Traceability Lineage");
  const trace = eventProcessingService.getEventTraceability(event1.event_id);

  assert.ok(trace);
  assert.strictEqual(trace.raw_content, rawFortiGate);
  assert.strictEqual(trace.raw_hash, event1.raw_ref.hash);
  assert.strictEqual(trace.parser_name, "fortigate");
  console.log("  ✅ SHA-256 hash match & 100% Traceability verified!");

  // Test 3: Cisco ASA Regex Log Parsing
  console.log("\n▶ Test 3: Cisco ASA Regex Pattern Parser");
  const rawCisco = "<134>Sep 9 14:02:11 asa-fw01 %ASA-6-106100: access-list cached type TCP connection from 10.0.0.100/41234 to 172.16.0.5/80";

  const event2 = eventProcessingService.processSingleRawLog(rawCisco);

  assert.strictEqual(event2.source.vendor, "Cisco");
  assert.strictEqual(event2.network.source_ip, "10.0.0.100");
  assert.strictEqual(event2.network.source_port, 41234);
  assert.strictEqual(event2.network.destination_ip, "172.16.0.5");
  assert.strictEqual(event2.network.destination_port, 80);
  assert.strictEqual(event2.network.protocol, "TCP");
  console.log("  ✅ Cisco ASA Firewall log successfully normalized!");

  // Test 4: Stream Log File Ingestion
  console.log("\n▶ Test 4: Batch Stream File Ingestion");
  const sampleFilePath = path.join(process.cwd(), "samples", "firewall", "fortigate_sample.log");
  const fileEvents = [];

  await fileIngestionService.processLogFile(sampleFilePath, {}, async (rawEvent) => {
    const norm = eventProcessingService.processSingleRawLog(rawEvent.raw_content, { transport: "file" });
    fileEvents.push(norm);
  });

  assert.ok(fileEvents.length >= 2);
  console.log(`  ✅ Processed ${fileEvents.length} events from stream log file!`);

  console.log("\n==================================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! FRAMEWORK READY.");
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
