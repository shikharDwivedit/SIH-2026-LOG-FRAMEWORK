const { rawStoreService } = require("../ingestion/raw-store.service");

class TraceabilityService {
  getTraceability(normalizedEvent) {
    const rawRef = normalizedEvent.raw_ref;
    const rawEvent = rawStoreService.getRawEventByHash(rawRef.hash);

    return {
      event_id: normalizedEvent.event_id,
      raw_event_id: rawRef.raw_event_id,
      raw_hash: rawRef.hash,
      raw_content: rawEvent ? rawEvent.raw_content : null,
      parser_name: normalizedEvent.trace.parser_name,
      parser_version: normalizedEvent.trace.parser_version,
      transformation_id: normalizedEvent.trace.transformation_id,
      mapped_fields: normalizedEvent.trace.mapped_fields,
      vendor_specific_extensions: normalizedEvent.extensions.vendor_specific
    };
  }
}

const traceabilityService = new TraceabilityService();

module.exports = { traceabilityService, TraceabilityService };
