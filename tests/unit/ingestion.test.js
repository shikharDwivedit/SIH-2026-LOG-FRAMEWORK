const assert = require("assert");
const fs     = require("fs");
const path   = require("path");

const { IngestionManager } = require("../../packages/ingestion/ingestion-manager");
const { LocalRawEventStore } = require("../../packages/storage/raw-event-store");
const { LocalEventQueue }    = require("../../packages/queue/event-queue");

console.log("==================================================================");
console.log("🧪 RUNNING STAGE 5 INGESTION ABSTRACTION TESTS");
console.log("==================================================================\n");

const testStorageDir = path.join(__dirname, "..", "..", "storage", "test_ingest_storage");
const testQueueDir   = path.join(__dirname, "..", "..", "storage", "test_ingest_queue");

[testStorageDir, testQueueDir].forEach(dir => {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
});

(async function runTest() {
  const store = new LocalRawEventStore(testStorageDir);
  const queue = new LocalEventQueue(testQueueDir);
  const ingestMgr = new IngestionManager(store, queue);

  const sampleLog = "<134>Sep 09 14:15:33 asa-fw01 %ASA-6-106100: access-list OUTSIDE-IN denied tcp OUTSIDE/198.51.100.44(41234) -> INSIDE/10.0.1.100(22)";

  // Ingest via common ingestion manager interface regardless of input path
  const result = await ingestMgr.ingest({
    rawContent: sampleLog,
    sourceIp: "198.51.100.1",
    transport: "syslog-udp",
    sourceId: "cisco-asa-01"
  });

  assert.ok(result.rawEvent, "Ingest result must return rawEvent");
  assert.ok(result.jobId, "Ingest result must return queue jobId");

  // Verify raw event saved in RawStore
  const stored = await store.get(result.rawEvent.eventId);
  assert.ok(stored, "Raw event must be durably stored in RawEventStore");
  assert.strictEqual(stored.rawContent, sampleLog, "Raw content must match original byte string");

  // Verify processing job queued
  const pendingCount = await queue.getPendingCount();
  assert.strictEqual(pendingCount, 1, "Queue must contain 1 pending processing job");

  console.log("  ✅ IngestionManager successfully stored raw log and queued processing job!");

  // Cleanup test dirs
  [testStorageDir, testQueueDir].forEach(dir => {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  });

  console.log("\n==================================================================");
  console.log("🎉 STAGE 5 / CHECKPOINT 4 PASSED SUCCESSFULLY!");
  console.log("==================================================================\n");
})();
