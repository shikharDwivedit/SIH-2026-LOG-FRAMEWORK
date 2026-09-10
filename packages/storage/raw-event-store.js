const fs = require("fs");
const path = require("path");

class LocalRawEventStore {
  constructor(storageDir) {
    this.baseDir = storageDir || path.join(process.cwd(), "storage", "raw_events");
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    this.cache = new Map();
    this.preloadFromDisk();
  }

  preloadFromDisk() {
    try {
      const files = fs.readdirSync(this.baseDir);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(this.baseDir, file);
          const data = fs.readFileSync(filePath, "utf-8");
          const event = JSON.parse(data);
          if (event.eventId) {
            this.cache.set(event.eventId, event);
            if (event.rawHash) {
              this.cache.set(`hash:${event.rawHash}`, event);
            }
          }
        }
      }
    } catch (e) {
      // Directory empty initially
    }
  }

  async save(event) {
    this.cache.set(event.eventId, event);
    if (event.rawHash) {
      this.cache.set(`hash:${event.rawHash}`, event);
    }

    const filePath = path.join(this.baseDir, `${event.eventId}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(event, null, 2), "utf-8");
  }

  saveSync(event) {
    this.cache.set(event.eventId, event);
    if (event.rawHash) this.cache.set(`hash:${event.rawHash}`, event);
    const filePath = path.join(this.baseDir, `${event.eventId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(event, null, 2), "utf-8");
  }

  getSync(eventId) {
    return this.cache.get(eventId) || null;
  }

  getByHashSync(hash) {
    const key = `hash:${hash}`;
    if (this.cache.has(key)) {
      return this.cache.get(key) || null;
    }
    for (const evt of this.cache.values()) {
      if (evt.rawHash === hash) {
        this.cache.set(key, evt);
        return evt;
      }
    }
    return null;
  }

  listSync() {
    const uniqueMap = new Map();
    for (const evt of this.cache.values()) {
      if (evt.eventId) {
        uniqueMap.set(evt.eventId, evt);
      }
    }
    return Array.from(uniqueMap.values());
  }

  async get(eventId) {
    return this.getSync(eventId);
  }

  async getByHash(hash) {
    return this.getByHashSync(hash);
  }

  async exists(eventId) {
    if (this.cache.has(eventId)) return true;
    const filePath = path.join(this.baseDir, `${eventId}.json`);
    return fs.existsSync(filePath);
  }

  async list() {
    return this.listSync();
  }
}

module.exports = { LocalRawEventStore };
