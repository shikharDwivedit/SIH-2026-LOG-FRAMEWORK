const { generateUuid } = require("../../utils/hash");
const { ProcessingStatus } = require("../../constants/status.constants");

class NormalizationService {
  normalize(rawEvent, parseResult) {
    const extracted = parseResult.extracted || {};
    const fieldMappings = parseResult.field_mappings || {};

    const ingestTime = rawEvent.ingested_at || new Date().toISOString();
    const universalEvent = {
      event_id: generateUuid(),
      schema_version: "1.0",
      raw_ref: {
        raw_event_id: rawEvent.raw_event_id,
        hash: rawEvent.hash,
        ingested_at: rawEvent.ingested_at
      },
      source: {
        vendor: parseResult.vendor || "Generic",
        product: parseResult.product || "Unknown",
        device_type: parseResult.device_type || "perimeter-device",
        device_ip: rawEvent.source_ip || extracted.devip || null,
        hostname: extracted.hostname || extracted.devname || null,
        log_format: parseResult.parser_name ? "parsed" : "raw",
        transport: rawEvent.transport || "file"
      },
      event: {
        event_time: extracted.timestamp || null,
        ingest_time: ingestTime,
        processing_time: new Date().toISOString(),
        timestamp: extracted.timestamp || null,
        category: extracted.category || extracted.type || "network",
        type: extracted.subtype || "connection",
        action: extracted.action || extracted.act || "observed",
        outcome: extracted.outcome || extracted.status || "completed",
        severity: String(extracted.severity || extracted.level || "informational"),
        message: rawEvent.raw_content
      },
      network: {
        source_ip: null,
        source_port: null,
        destination_ip: null,
        destination_port: null,
        protocol: null,
        direction: null
      },
      identity: {
        username: null,
        user_id: null,
        domain: null,
        session_id: null
      },
      threat: {
        name: null,
        type: null,
        signature: null,
        rule_id: null,
        risk_score: null
      },
      extensions: {
        vendor_specific: {}
      },
      trace: {
        parser_name: parseResult.parser_name || "unparsed",
        parser_version: parseResult.parser_version || "0.0",
        transformation_id: generateUuid(),
        mapped_fields: {},
        field_lineage: {}
      },
      processing: {
        status: parseResult.success ? ProcessingStatus.PROCESSED : ProcessingStatus.PARTIALLY_PROCESSED,
        errors: parseResult.success ? [] : ["Parser incomplete or unrecognized source format"]
      }
    };

    const mappedVendorKeys = new Set();

    // Perform taxonomy mapping based on parser field_mappings or auto-detect standard names
    for (const [vendorKey, vendorVal] of Object.entries(extracted)) {
      if (vendorVal === undefined || vendorVal === null || vendorVal === "") continue;

      const targetPath = fieldMappings[vendorKey] || this.autoInferFieldMapping(vendorKey);

      if (targetPath) {
        this.setDeepProperty(universalEvent, targetPath, vendorVal);
        universalEvent.trace.mapped_fields[vendorKey] = targetPath;
        universalEvent.trace.field_lineage[targetPath] = {
          source_field: vendorKey,
          raw_event_id: rawEvent.raw_event_id,
          parser: parseResult.parser_name || "unparsed",
          parser_version: parseResult.parser_version || "0.0"
        };
        mappedVendorKeys.add(vendorKey);
      }
    }

    // Retain all unmapped vendor keys in extensions.vendor_specific for 100% Lossless Guarantee!
    for (const [vendorKey, vendorVal] of Object.entries(extracted)) {
      if (!mappedVendorKeys.has(vendorKey)) {
        universalEvent.extensions.vendor_specific[vendorKey] = vendorVal;
      }
    }

    // Coerce numeric types for ports
    if (universalEvent.network.source_port) {
      universalEvent.network.source_port = parseInt(universalEvent.network.source_port, 10) || null;
    }
    if (universalEvent.network.destination_port) {
      universalEvent.network.destination_port = parseInt(universalEvent.network.destination_port, 10) || null;
    }

    return universalEvent;
  }

  autoInferFieldMapping(key) {
    const k = key.toLowerCase();
    if (["srcip", "src_ip", "source_ip", "src"].includes(k)) return "network.source_ip";
    if (["srcport", "src_port", "source_port"].includes(k)) return "network.source_port";
    if (["dstip", "dst_ip", "destination_ip", "dst"].includes(k)) return "network.destination_ip";
    if (["dstport", "dst_port", "destination_port"].includes(k)) return "network.destination_port";
    if (["proto", "protocol"].includes(k)) return "network.protocol";
    if (["action", "act"].includes(k)) return "event.action";
    if (["user", "usr", "username"].includes(k)) return "identity.username";
    if (["policyid", "rule_id", "ruleid"].includes(k)) return "threat.rule_id";
    return null;
  }

  setDeepProperty(obj, pathStr, value) {
    const parts = pathStr.split(".");
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
}

const normalizationService = new NormalizationService();

module.exports = { normalizationService, NormalizationService };
