const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { LocalRawEventStore } = require("../../packages/storage/raw-event-store");

console.log("==================================================================");
console.log("🧪 RUNNING STAGE 2 DURABLE RAW STORAGE TESTS");
console.log("==================================================================\n");

const testStorageDir = path.join(__dirname, "..", "..", "storage", "test_raw_events");
if (fs.existsSync(testStorageDir)) {
  fs.rmSync(testStorageDir, { recursive: true, force: true });
}

(async function runTest() {
  const store1 = new LocalRawEventStore(testStorageDir);

  const rawEvt = {
    eventId: "test-raw-uuid-101",
    rawContent: "<185>date=2026-09-09 devname=\"fw01\" action=\"deny\"",
    rawHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    ingestedAt: new Date().toISOString(),
    sourceId: "fw-01",
    transport: "syslog"
  };

  // 1. Save event
  await store1.save(rawEvt);
  assert.ok(fs.existsSync(path.join(testStorageDir, "test-raw-uuid-101.json")), "Event JSON file must exist on disk");
  console.log("  ✅ Raw event saved to disk store!");

  // 2. Retrieve event from same instance
  const fetched = await store1.get("test-raw-uuid-101");
  assert.strictEqual(fetched.rawContent, rawEvt.rawContent, "Content must match original raw string");
  assert.strictEqual(fetched.rawHash, rawEvt.rawHash, "Hash must match");
  console.log("  ✅ Raw event retrieved from memory cache!");

  // 3. Simulate process restart by instantiating new store on same dir
  const store2 = new LocalRawEventStore(testStorageDir);
  const reloaded = await store2.get("test-raw-uuid-101");
  assert.ok(reloaded, "Raw event must be preloaded from disk on restart");
  assert.strictEqual(reloaded.rawContent, rawEvt.rawContent, "Raw content preserved across restart!");
  console.log("  ✅ Raw event preloaded from disk store after restart simulation!");

  // Cleanup test store dir
  fs.rmSync(testStorageDir, { recursive: true, force: true });

  console.log("\n==================================================================");
  console.log("🎉 STAGE 2 CHECKPOINT PASSED SUCCESSFULLY!");
  console.log("==================================================================\n");
})();
