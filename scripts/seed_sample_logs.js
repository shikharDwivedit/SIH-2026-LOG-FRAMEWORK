const fs   = require("fs");
const path = require("path");
const http = require("http");

const SAMPLE_FILE = path.join(__dirname, "..", "samples", "sample_test_logs.log");

async function seedLogs() {
  console.log("🚀 Seeding sample logs into SIH 2026 Normalization Pipeline...\n");

  if (!fs.existsSync(SAMPLE_FILE)) {
    console.error(`❌ Sample file not found at ${SAMPLE_FILE}`);
    process.exit(1);
  }

  const lines = fs
    .readFileSync(SAMPLE_FILE, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  console.log(`📄 Found ${lines.length} sample log entries to ingest.\n`);

  let count = 0;
  for (const logLine of lines) {
    count++;
    try {
      const payload = JSON.stringify({ log: logLine, transport: "http" });
      const req = http.request(
        {
          hostname: "localhost",
          port: 8000,
          path: "/api/v1/events/ingest",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload)
          }
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data);
              const status = parsed.data?.processing?.status || parsed.data?.error_code || "OK";
              const parser = parsed.data?.trace?.parser_name || "dead-letter";
              console.log(`  [Log #${count}] Status: ${status} | Parser: ${parser}`);
            } catch {
              console.log(`  [Log #${count}] Ingested (http ${res.statusCode})`);
            }
          });
        }
      );

      req.on("error", (err) => {
        console.error(`  [Log #${count}] ❌ Ingestion error: ${err.message}`);
      });

      req.write(payload);
      req.end();

      // Brief delay between logs
      await new Promise((r) => setTimeout(r, 150));
    } catch (err) {
      console.error(`  ❌ Failed to ingest line #${count}: ${err.message}`);
    }
  }

  console.log("\n✅ All sample logs sent to server!");
}

seedLogs();
