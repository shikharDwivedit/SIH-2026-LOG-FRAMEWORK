const assert = require("assert");
const fs     = require("fs");
const path   = require("path");

const { LocalEventQueue }       = require("../../packages/queue/event-queue");
const { EventWorker }           = require("../../apps/worker/event-worker");
const { eventProcessingService }= require("../../src/services/event/event-processing.service");

console.log("==================================================================");
console.log("🧪 RUNNING STAGE 3 & 4 QUEUE + WORKER SEPARATION TESTS");
console.log("==================================================================\n");

const testQueueDir = path.join(__dirname, "..", "..", "storage", "test_queue");
if (fs.existsSync(testQueueDir)) {
  fs.rmSync(testQueueDir, { recursive: true, force: true });
}

(async function runTest() {
  const queue = new LocalEventQueue(testQueueDir);
  const worker = new EventWorker(queue);

  const sampleLog = '<185>date=2026-09-09 time=14:02:11 devname="fw01" devid="FGT60D4614000001" logid="0000000013" type="traffic" subtype="forward" level="notice" vd="root" srcip=10.0.0.5 srcport=54321 dstip=8.8.8.8 dstport=443 proto=6 action="deny" status="blocked" msg="Access denied by policy 10" user="admin" policyid=10';

  // 1. Publish job to queue
  const job = await queue.publish({
    rawEventId: "raw-uuid-worker-test",
    rawContent: sampleLog,
    metadata: { transport: "queue-worker-test" }
  });

  assert.strictEqual(job.status, "PENDING", "Job status must initially be PENDING");
  console.log("  ✅ Job published to durable event queue!");

  // 2. Consume job using worker
  const initialCount = eventProcessingService.getAllNormalizedEvents().length;
  await worker.processQueue();

  const finalCount = eventProcessingService.getAllNormalizedEvents().length;
  assert.strictEqual(finalCount, initialCount + 1, "Worker must process job from queue and produce normalized event");

  const lastEvent = eventProcessingService.getAllNormalizedEvents().slice(-1)[0];
  assert.strictEqual(lastEvent.source.vendor, "Fortinet", "Normalized event vendor must be Fortinet");
  console.log("  ✅ Worker successfully consumed job from queue and processed event through framework pipeline!");

  // Cleanup test queue dir
  fs.rmSync(testQueueDir, { recursive: true, force: true });

  console.log("\n==================================================================");
  console.log("🎉 STAGE 3 & 4 CHECKPOINT PASSED SUCCESSFULLY!");
  console.log("==================================================================\n");
})();
