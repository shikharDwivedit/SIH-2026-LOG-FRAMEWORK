const assert = require("assert");
const { eventProcessingService } = require("../../src/services/event/event-processing.service");
const { deadLetterService }     = require("../../src/services/ingestion/dead-letter.service");
const { parserRegistryService }  = require("../../src/services/parser/parser-registry.service");
const { replayService }          = require("../../src/services/event/replay.service");

console.log("==================================================================");
console.log("🧪 RUNNING DEAD-LETTER & REPLAY ACCEPTANCE TESTS");
console.log("==================================================================\n");

// 1. Process an unsupported / unknown log line
const unknownLog = '2026-09-09 15:00:00 NEW_CUSTOM_VENDOR data="device_status_ok" code=777 action="permit" src=10.5.5.5 dst=10.5.5.1';
const initialEvent = eventProcessingService.processSingleRawLog(unknownLog, { transport: "replay-test" });

assert.strictEqual(initialEvent.processing.status, "UNSUPPORTED", "Unknown vendor log must initially fail and enter UNSUPPORTED status");

const deadLetters = deadLetterService.getAll();
const dlMatch = deadLetters.find(dl => dl.raw_event_id === initialEvent.raw_ref.raw_event_id);
assert.ok(dlMatch, "Unknown log must be recorded in Dead Letter store without losing raw data!");
console.log("  ✅ Unknown vendor log stored in Dead Letter Store without data loss!");

// 2. Dynamically register new parser for this custom vendor
parserRegistryService.registerParser({
  name: "new-custom-vendor",
  version: "1.0",
  vendor: "Custom Vendor",
  format: "key-value",
  match_criteria: { contains: ["NEW_CUSTOM_VENDOR"] },
  extraction: { type: "key-value" },
  field_mappings: {
    src: "network.source_ip",
    dst: "network.destination_ip",
    action: "event.action"
  }
});
console.log("  ✅ New custom parser registered into Parser Registry!");

// 3. Replay the raw event from dead letter store
const replayedEvent = replayService.replayRawEvent(initialEvent.raw_ref.raw_event_id);

assert.strictEqual(replayedEvent.processing.status, "PROCESSED", "Replayed event must now be PROCESSED!");
assert.strictEqual(replayedEvent.source.vendor, "Custom Vendor", "Replayed event vendor must be Custom Vendor");
assert.strictEqual(replayedEvent.network.source_ip, "10.5.5.5", "Replayed event source IP must be 10.5.5.5");

// 4. Verify dead letter store item resolved
const remainingDeadLetters = deadLetterService.getAll();
const resolvedMatch = remainingDeadLetters.find(dl => dl.raw_event_id === initialEvent.raw_ref.raw_event_id);
assert.strictEqual(resolvedMatch, undefined, "Dead letter item must be resolved and removed after successful replay!");

console.log("  ✅ Replay Acceptance Test PASSED: Raw event replayed with new parser, now 100% normalized!");

console.log("\n==================================================================");
console.log("🎉 DEAD-LETTER & REPLAY CHECKPOINT PASSED SUCCESSFULLY!");
console.log("==================================================================\n");
