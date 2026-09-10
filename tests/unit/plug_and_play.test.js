const assert = require("assert");
const { parserRegistryService }  = require("../../src/services/parser/parser-registry.service");
const { eventProcessingService } = require("../../src/services/event/event-processing.service");

console.log("==================================================================");
console.log("🧪 RUNNING PLUG-AND-PLAY & PRIORITY MATCHING ACCEPTANCE TESTS");
console.log("==================================================================\n");

// Reload parser registry from disk to pick up new Check Point parser
parserRegistryService.init();

// Runtime registration uses the same definition shape as a parsers/*.json file.
parserRegistryService.registerParser({
	name: "acme-edge-firewall",
	version: "1.0",
	vendor: "Acme Security",
	product: "Edge Firewall",
	device_type: "firewall",
	format: "key-value",
	match_criteria: { contains: ["acme_edge="] },
	extraction: { type: "key-value" },
	field_mappings: {
		src: "network.source_ip",
		dst: "network.destination_ip",
		action: "event.action"
	}
});
const acmeEvent = eventProcessingService.processSingleRawLog(
	"acme_edge=1 src=192.0.2.10 dst=198.51.100.20 action=allow ticket=INC-42",
	{ parserName: "acme-edge-firewall", transport: "plug-and-play-test" }
);
assert.strictEqual(acmeEvent.processing.status, "PROCESSED");
assert.strictEqual(acmeEvent.source.vendor, "Acme Security");
assert.strictEqual(acmeEvent.network.source_ip, "192.0.2.10");
assert.strictEqual(acmeEvent.event.action, "allow");
assert.strictEqual(acmeEvent.extensions.vendor_specific.ticket, "INC-42");
console.log("  ✅ Runtime parser registration, mappings, and vendor-field retention verified!");

const parsers = parserRegistryService.getAllParsers();
const checkPointParser = parsers.find(p => p.name === "checkpoint-fw");
assert.ok(checkPointParser, "Check Point parser must be dynamically loaded from parsers/ directory!");
console.log("  ✅ Check Point parser loaded dynamically from config file with ZERO code changes!");

// Sample Check Point log line
const sampleCheckPointLog = 'time=14:35:00 product=VPN-1 action=Drop src=192.168.10.15 s_port=51200 dst=10.0.0.1 service=443 proto=tcp user=jdoe rule_name=Rule-Default-Drop origin=cp-gateway-01 policy_id=99';

// Process log through core pipeline WITHOUT touching core processing code
const event = eventProcessingService.processSingleRawLog(sampleCheckPointLog, { transport: "plug-and-play-test" });

assert.strictEqual(event.processing.status, "PROCESSED", "Check Point log must be successfully PROCESSED");
assert.strictEqual(event.source.vendor, "Check Point", "Vendor must be normalized to Check Point");
assert.strictEqual(event.trace.parser_name, "checkpoint-fw", "Parser name must be checkpoint-fw");

assert.strictEqual(event.network.source_ip, "192.168.10.15", "network.source_ip must map to 192.168.10.15");
assert.strictEqual(event.network.destination_ip, "10.0.0.1", "network.destination_ip must map to 10.0.0.1");
assert.strictEqual(event.event.action, "Drop", "event.action must map to Drop");
assert.strictEqual(event.identity.username, "jdoe", "identity.username must map to jdoe");

// Check lossless vendor extension field preservation
assert.ok(event.extensions.vendor_specific.policy_id, "policy_id must be retained under extensions.vendor_specific");
assert.strictEqual(String(event.extensions.vendor_specific.policy_id), "99", "Unmapped vendor field value must be preserved lossless!");

console.log("  ✅ Plug-and-Play Acceptance Test PASSED: New vendor added via config only, 100% normalized & lossless!");

console.log("\n==================================================================");
console.log("🎉 PLUG-AND-PLAY CHECKPOINT PASSED SUCCESSFULLY!");
console.log("==================================================================\n");
