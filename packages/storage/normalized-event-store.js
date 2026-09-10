const fs = require("fs");
const path = require("path");

class LocalNormalizedEventStore {
  constructor(storageDir) {
    this.baseDir = storageDir || path.join(process.cwd(), "storage", "normalized_events");
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  loadAll() {
    return fs.readdirSync(this.baseDir)
      .filter(file => file.endsWith(".json"))
      .map(file => {
        try {
          return JSON.parse(fs.readFileSync(path.join(this.baseDir, file), "utf8"));
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  async save(event) {
    await fs.promises.writeFile(
      path.join(this.baseDir, `${event.event_id}.json`),
      JSON.stringify(event, null, 2),
      "utf8"
    );
  }
}

module.exports = { LocalNormalizedEventStore };
