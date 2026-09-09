const { ProcessingStatus } = require("../../constants/status.constants");

class EventValidationService {
  isValidIp(ip) {
    if (!ip || typeof ip !== "string") return false;
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      return ip.split('.').every(num => parseInt(num, 10) >= 0 && parseInt(num, 10) <= 255);
    }
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv6Regex.test(ip);
  }

  isValidPort(port) {
    if (port === null || port === undefined) return true;
    const p = Number(port);
    return Number.isInteger(p) && p >= 0 && p <= 65535;
  }

  validate(universalEvent) {
    const errors = [];

    if (!universalEvent.event_id) errors.push("Missing mandatory field: event_id");
    if (!universalEvent.schema_version) errors.push("Missing mandatory field: schema_version");
    if (!universalEvent.raw_ref || !universalEvent.raw_ref.hash) {
      errors.push("Missing raw reference hash");
    }
    if (!universalEvent.event || !universalEvent.event.timestamp) {
      errors.push("Missing event timestamp");
    }

    // IP address validation
    const net = universalEvent.network || {};
    if (net.source_ip && !this.isValidIp(net.source_ip)) {
      errors.push(`Invalid source_ip format: '${net.source_ip}'`);
    }
    if (net.destination_ip && !this.isValidIp(net.destination_ip)) {
      errors.push(`Invalid destination_ip format: '${net.destination_ip}'`);
    }

    // Port range validation
    if (!this.isValidPort(net.source_port)) {
      errors.push(`Invalid source_port range: '${net.source_port}' (must be 0-65535)`);
    }
    if (!this.isValidPort(net.destination_port)) {
      errors.push(`Invalid destination_port range: '${net.destination_port}' (must be 0-65535)`);
    }

    if (errors.length > 0) {
      universalEvent.processing.status = ProcessingStatus.VALIDATION_ERROR;
      universalEvent.processing.errors = universalEvent.processing.errors || [];
      universalEvent.processing.errors.push(...errors);
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }
}

const eventValidationService = new EventValidationService();

module.exports = { eventValidationService, EventValidationService };
