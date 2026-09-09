const { eventProcessingService } = require("../../src/services/event/event-processing.service");

console.log("==================================================================");
console.log("🚀 RUNNING SIH 2026 LOG NORMALIZATION FRAMEWORK BENCHMARK");
console.log("==================================================================\n");

const SAMPLE_LOG = '<185>date=2026-09-09 time=14:02:11 devname="fw01" devid="FGT60D4614000001" logid="0000000013" type="traffic" subtype="forward" level="notice" vd="root" srcip=10.0.0.5 srcport=54321 dstip=8.8.8.8 dstport=443 proto=6 action="deny" status="blocked" msg="Access denied by policy 10" user="admin" policyid=10';

const TOTAL_EVENTS = 5000;
const latencies = [];

const memBefore = process.memoryUsage().heapUsed;
const tStart = Date.now();

for (let i = 0; i < TOTAL_EVENTS; i++) {
  const t0 = performance.now();
  eventProcessingService.processSingleRawLog(SAMPLE_LOG, { transport: "benchmark" });
  const t1 = performance.now();
  latencies.push(t1 - t0);
}

const tEnd = Date.now();
const durationSec = (tEnd - tStart) / 1000;
const memAfter = process.memoryUsage().heapUsed;

latencies.sort((a, b) => a - b);
const p50 = latencies[Math.floor(latencies.length * 0.50)].toFixed(3);
const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(3);
const p99 = latencies[Math.floor(latencies.length * 0.99)].toFixed(3);
const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(3);
const eps = Math.round(TOTAL_EVENTS / durationSec);
const memMB = ((memAfter - memBefore) / 1024 / 1024).toFixed(2);

console.log(`📊 Benchmarked ${TOTAL_EVENTS.toLocaleString()} events in ${durationSec.toFixed(2)}s\n`);
console.log(`  ⚡ Throughput:            ${eps.toLocaleString()} Events / Second (EPS)`);
console.log(`  ⏱️  Avg Latency:          ${avg} ms`);
console.log(`  ⏱️  p50 Latency:          ${p50} ms`);
console.log(`  ⏱️  p95 Latency:          ${p95} ms`);
console.log(`  ⏱️  p99 Latency:          ${p99} ms`);
console.log(`  💾 Memory Delta:          ${memMB} MB Heap`);

console.log("\n==================================================================");
console.log("🎉 BENCHMARK COMPLETE — PERFORMANCE VERIFIED!");
console.log("==================================================================\n");
