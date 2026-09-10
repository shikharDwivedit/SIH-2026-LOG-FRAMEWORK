// Source Registry — registers log sources (devices) with their vendor, device type, parser hints
// SRS FR-02: "The framework shall identify vendor, product, device type, log format, parser required"
// A source can be IP-based, name-based, or config-driven. The registry routes incoming logs.

const { generateUuid } = require("../../utils/hash");
const fs = require("fs");
const path = require("path");

class SourceRegistryService {
  constructor() {
    this.sources = new Map(); // sourceId -> sourceDefinition
    this.ipIndex  = new Map(); // ip -> sourceId
    this.nameIndex = new Map(); // name/hostname -> sourceId
    this.storagePath = path.join(process.cwd(), "storage", "sources.json");
    this.load();
  }

  load() {
    try {
      const saved = JSON.parse(fs.readFileSync(this.storagePath, "utf8"));
      saved.forEach(source => this.index(source));
    } catch {
      // First run starts with an empty source registry.
    }
  }

  index(source) {
    this.sources.set(source.source_id, source);
    if (source.device_ip) this.ipIndex.set(source.device_ip, source.source_id);
    if (source.hostname) this.nameIndex.set(source.hostname.toLowerCase(), source.source_id);
  }

  persist() {
    fs.mkdirSync(path.dirname(this.storagePath), { recursive: true });
    fs.writeFileSync(this.storagePath, JSON.stringify(this.getAll(), null, 2), "utf8");
  }

  register(sourceDefinition) {
    const id = sourceDefinition.source_id || generateUuid();
    const source = {
      source_id: id,
      name: sourceDefinition.name || "Unknown Source",
      vendor: sourceDefinition.vendor || "Generic",
      product: sourceDefinition.product || "Unknown",
      device_type: sourceDefinition.device_type || "perimeter-device",
      device_ip: sourceDefinition.device_ip || null,
      hostname: sourceDefinition.hostname || null,
      preferred_parser: sourceDefinition.preferred_parser || null,
      log_format: sourceDefinition.log_format || "auto",
      transport: sourceDefinition.transport || "file",
      description: sourceDefinition.description || "",
      registered_at: new Date().toISOString(),
      active: true
    };

    this.index(source);
    this.persist();

    return source;
  }

  getAll() {
    return Array.from(this.sources.values());
  }

  getById(id) {
    return this.sources.get(id) || null;
  }

  findByIp(ip) {
    const id = this.ipIndex.get(ip);
    return id ? this.sources.get(id) : null;
  }

  findByHostname(hostname) {
    const id = this.nameIndex.get((hostname || "").toLowerCase());
    return id ? this.sources.get(id) : null;
  }

  deactivate(id) {
    const source = this.sources.get(id);
    if (source) {
      source.active = false;
      this.persist();
      return source;
    }
    return null;
  }

  getCount() {
    return this.sources.size;
  }
}

const sourceRegistryService = new SourceRegistryService();

module.exports = { sourceRegistryService, SourceRegistryService };
