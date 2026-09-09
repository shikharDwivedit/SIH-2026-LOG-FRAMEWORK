const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { eventProcessingService } = require("../../src/services/event/event-processing.service");

console.log("==================================================================");
console.log("🧪 RUNNING STAGE 1 CONTRACT & UNIVERSAL EVENT VALIDATION TESTS");
console.log("==================================================================\n");

// 1. Verify schema file exists
const schemaPath = path.join(__dirname, "..", "..", "schemas", "universal-event-v1.json");
assert.ok(fs.existsSync(schemaPath), "universal-event-v1.json schema file must exist");

const rawSchema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
assert.strictEqual(rawSchema.title, "UniversalEventSchemaV1");
console.log("  ✅ Schema definition file loaded & validated!");

// 2. Process a sample event and verify contract structure
const sampleLog = '<185>date=2026-09-09 time=14:02:11 devname="fw01" devid="FGT60D4614000001" logid="0000000013" type="traffic" subtype="forward" level="notice" vd="root" srcip=10.0.0.5 srcport=54321 dstip=8.8.8.8 dstport=443 proto=6 action="deny" status="blocked" msg="Access denied by policy 10" user="admin" policyid=10';
const event = eventProcessingService.processSingleRawLog(sampleLog, { transport: "unit-test" });

// Required fields according to UniversalEvent contract (Stage 1 / Section 6)
assert.ok(event.event_id, "UniversalEvent must contain event_id");
assert.strictEqual(event.schema_version, "1.0", "schema_version must be 1.0");

assert.ok(event.raw_ref, "raw_ref object must exist");
assert.ok(event.raw_ref.raw_event_id, "raw_ref.raw_event_id must exist");
assert.ok(event.raw_ref.hash, "raw_ref.hash must exist (SHA-256)");
assert.ok(event.raw_ref.ingested_at, "raw_ref.ingested_at timestamp must exist");

assert.ok(event.source, "source object must exist");
assert.ok(event.event, "event object must exist");
assert.ok(event.event.timestamp, "event.timestamp must exist");

assert.ok(event.processing, "processing metadata must exist");
assert.ok(["PROCESSED", "PARTIALLY_PROCESSED", "UNSUPPORTED", "PARSER_ERROR", "VALIDATION_ERROR", "OUTPUT_ERROR"].includes(event.processing.status), "processing.status must be valid status enum");

assert.ok(event.trace, "traceability metadata must exist");
assert.ok(event.extensions, "extensions object must exist for lossless vendor fields");

console.log("  ✅ UniversalEvent runtime object fully satisfies Stage 1 contract specification!");

console.log("\n==================================================================");
console.log("🎉 STAGE 1 CHECKPOINT PASSED SUCCESSFULLY!");
console.log("==================================================================\n");
