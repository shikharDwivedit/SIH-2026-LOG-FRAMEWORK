const { rawStoreService }       = require("../ingestion/raw-store.service");
const { deadLetterService }     = require("../ingestion/dead-letter.service");
const { formatDetectorService } = require("../parser/format-detector.service");
const { parserRegistryService } = require("../parser/parser-registry.service");
const { parserService }         = require("../parser/parser.service");
const { normalizationService }  = require("../normalization/normalization.service");
const { eventValidationService }= require("../validation/event-validation.service");
const { traceabilityService }   = require("../traceability/traceability.service");
const { metricsService }        = require("../metrics/metrics.service");
const { ProcessingStatus }      = require("../../constants/status.constants");
const { logger }                = require("../../utils/logger");

class EventProcessingService {
  constructor() {
    this.normalizedEventsMap = new Map();
  }

  processSingleRawLog(rawLogContent, metadata = {}) {
    metricsService.recordReceived();
    const t0 = Date.now();

    // ── 1. Raw Event Preservation (always first, never skipped) ──────────────
    const rawEvent = rawStoreService.createRawEvent(rawLogContent, metadata);

    // ── 2. Format Detection ──────────────────────────────────────────────────
    const detectedFormat = formatDetectorService.detectFormat(rawEvent.raw_content);
    metricsService.recordFormat(detectedFormat);

    // ── 3. Parser Match ──────────────────────────────────────────────────────
    const parserConfig = parserRegistryService.findMatchingParser(rawEvent.raw_content, detectedFormat);

    // ── 4. Parse ─────────────────────────────────────────────────────────────
    const parseResult = parserService.parse(rawEvent.raw_content, parserConfig);

    // ── 5. Normalize (always runs — lossless even if parse failed) ───────────
    const normalizedEvent = normalizationService.normalize(rawEvent, parseResult);

    // ── 6. Validate ──────────────────────────────────────────────────────────
    eventValidationService.validate(normalizedEvent);

    // ── 7. Dead-letter routing ───────────────────────────────────────────────
    // If no parser matched AND the event is not even partially parsed,
    // send it to the dead-letter store so it's never silently dropped.
    if (!parserConfig && !parseResult.success) {
      normalizedEvent.processing.status = ProcessingStatus.UNSUPPORTED;
      deadLetterService.record(rawEvent, {
        code: "NO_PARSER_FOUND",
        message: "No matching parser for this log source. Add a parser config to parsers/ directory.",
        detectedFormat,
        attemptedParser: null
      });
      metricsService.recordDeadLettered();
    }

    // ── 8. Store normalized event ─────────────────────────────────────────────
    this.normalizedEventsMap.set(normalizedEvent.event_id, normalizedEvent);

    // ── 9. Metrics ────────────────────────────────────────────────────────────
    const durationMs = Date.now() - t0;
    metricsService.recordProcessed(normalizedEvent, durationMs);

    logger.debug(
      `Processed event ${normalizedEvent.event_id} ` +
      `(Format: ${detectedFormat}, Parser: ${normalizedEvent.trace.parser_name}, ` +
      `Status: ${normalizedEvent.processing.status}, ${durationMs}ms)`
    );

    return normalizedEvent;
  }

  // ── Test a raw log against a specific parser WITHOUT storing ─────────────────
  testLog(rawLogContent, parserName) {
    const { rawStoreService: rs } = require("../ingestion/raw-store.service");

    // Create a temporary raw event (not stored in main store)
    const crypto = require("crypto");
    const tempRaw = {
      raw_event_id: crypto.randomUUID(),
      raw_content: rawLogContent,
      hash: crypto.createHash("sha256").update(rawLogContent, "utf8").digest("hex"),
      ingested_at: new Date().toISOString(),
      source_id: "test",
      transport: "test"
    };

    const detectedFormat = formatDetectorService.detectFormat(rawLogContent);
    let parserConfig = parserName
      ? parserRegistryService.getAllParsers().find(p => p.name === parserName)
      : parserRegistryService.findMatchingParser(rawLogContent, detectedFormat);

    const parseResult   = parserService.parse(rawLogContent, parserConfig);
    const normalizedEvt = normalizationService.normalize(tempRaw, parseResult);

    return {
      input: rawLogContent,
      detected_format: detectedFormat,
      matched_parser: parserConfig ? { name: parserConfig.name, version: parserConfig.version } : null,
      extracted_fields: parseResult.extracted,
      normalized_event: normalizedEvt,
      mapped_fields: normalizedEvt.trace.mapped_fields,
      vendor_specific_retained: normalizedEvt.extensions.vendor_specific,
      parse_success: parseResult.success,
      processing_status: normalizedEvt.processing.status
    };
  }

  getNormalizedEventById(eventId) {
    return this.normalizedEventsMap.get(eventId) || null;
  }

  getAllNormalizedEvents() {
    return Array.from(this.normalizedEventsMap.values());
  }

  getEventTraceability(eventId) {
    const event = this.getNormalizedEventById(eventId);
    if (!event) return null;
    return traceabilityService.getTraceability(event);
  }
}

const eventProcessingService = new EventProcessingService();

module.exports = { eventProcessingService, EventProcessingService };
