// Source Registry — registers log sources (devices) with their vendor, device type, parser hints
// SRS FR-02: "The framework shall identify vendor, product, device type, log format, parser required"
// A source can be IP-based, name-based, or config-driven. The registry routes incoming logs.

const { generateUuid } = require("../../utils/hash");

class SourceRegistryService {
  constructor() {
    this.sources = new Map(); // sourceId -> sourceDefinition
    this.ipIndex  = new Map(); // ip -> sourceId
    this.nameIndex = new Map(); // name/hostname -> sourceId
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

    this.sources.set(id, source);

    // Build IP and hostname indexes for fast lookup
    if (source.device_ip) this.ipIndex.set(source.device_ip, id);
    if (source.hostname) this.nameIndex.set(source.hostname.toLowerCase(), id);

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
