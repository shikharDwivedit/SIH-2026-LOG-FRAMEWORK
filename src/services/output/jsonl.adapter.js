// JSON Lines Output Adapter — formats normalized events as newline-delimited JSON
// SRS FR-7: "Parquet/S3/Kafka" — JSONL is the portable precursor
// Each line is a self-contained JSON record; Data Lake / Kafka-friendly

function formatJSONL(normalizedEvent) {
  return JSON.stringify(normalizedEvent);
}

function formatJSONLBatch(events) {
  return events.map(formatJSONL).join("\n");
}

// Flat representation (easier for ML pipelines — no nested objects)
function formatFlat(normalizedEvent) {
  const flat = {
    event_id:         normalizedEvent.event_id,
    schema_version:   normalizedEvent.schema_version,
    raw_hash:         normalizedEvent.raw_ref?.hash,
    raw_event_id:     normalizedEvent.raw_ref?.raw_event_id,
    ingested_at:      normalizedEvent.raw_ref?.ingested_at,
    vendor:           normalizedEvent.source?.vendor,
    product:          normalizedEvent.source?.product,
    device_type:      normalizedEvent.source?.device_type,
    device_ip:        normalizedEvent.source?.device_ip,
    hostname:         normalizedEvent.source?.hostname,
    log_format:       normalizedEvent.source?.log_format,
    transport:        normalizedEvent.source?.transport,
    event_timestamp:  normalizedEvent.event?.timestamp,
    category:         normalizedEvent.event?.category,
    event_type:       normalizedEvent.event?.type,
    action:           normalizedEvent.event?.action,
    outcome:          normalizedEvent.event?.outcome,
    severity:         normalizedEvent.event?.severity,
    message:          normalizedEvent.event?.message,
    src_ip:           normalizedEvent.network?.source_ip,
    src_port:         normalizedEvent.network?.source_port,
    dst_ip:           normalizedEvent.network?.destination_ip,
    dst_port:         normalizedEvent.network?.destination_port,
    protocol:         normalizedEvent.network?.protocol,
    direction:        normalizedEvent.network?.direction,
    username:         normalizedEvent.identity?.username,
    user_id:          normalizedEvent.identity?.user_id,
    domain:           normalizedEvent.identity?.domain,
    session_id:       normalizedEvent.identity?.session_id,
    threat_name:      normalizedEvent.threat?.name,
    threat_type:      normalizedEvent.threat?.type,
    signature:        normalizedEvent.threat?.signature,
    rule_id:          normalizedEvent.threat?.rule_id,
    risk_score:       normalizedEvent.threat?.risk_score,
    parser_name:      normalizedEvent.trace?.parser_name,
    parser_version:   normalizedEvent.trace?.parser_version,
    transformation_id:normalizedEvent.trace?.transformation_id,
    processing_status:normalizedEvent.processing?.status,
    processing_errors:JSON.stringify(normalizedEvent.processing?.errors || []),
    vendor_specific:  JSON.stringify(normalizedEvent.extensions?.vendor_specific || {})
  };
  return JSON.stringify(flat);
}

module.exports = { formatJSONL, formatJSONLBatch, formatFlat };
