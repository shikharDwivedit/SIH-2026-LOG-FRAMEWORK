const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse }  = require("../utils/ApiResponse");
const { ApiError }     = require("../utils/ApiError");
const { eventProcessingService } = require("../services/event/event-processing.service");
const { formatCEF }    = require("../services/output/cef.adapter");
const { formatJSONL, formatJSONLBatch, formatFlat } = require("../services/output/jsonl.adapter");

// GET /api/v1/output/cef/:id — export single event as CEF
const exportEventCEF = asyncHandler(async (req, res) => {
  const event = eventProcessingService.getNormalizedEventById(req.params.id);
  if (!event) throw new ApiError(404, `Event '${req.params.id}' not found`);
  const cef = formatCEF(event);
  return res.status(200).json(new ApiResponse(200, { cef }, "Event exported as CEF"));
});

// GET /api/v1/output/cef — export all events as CEF (one per line)
const exportAllCEF = asyncHandler(async (req, res) => {
  const events = eventProcessingService.getAllNormalizedEvents();
  const lines = events.map(formatCEF);
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", "attachment; filename=\"events.cef\"");
  return res.status(200).send(lines.join("\n"));
});

// GET /api/v1/output/jsonl — export all events as JSONL (Data Lake format)
const exportAllJSONL = asyncHandler(async (req, res) => {
  const events = eventProcessingService.getAllNormalizedEvents();
  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Content-Disposition", "attachment; filename=\"events.jsonl\"");
  return res.status(200).send(formatJSONLBatch(events));
});

// GET /api/v1/output/flat — ML-ready flat JSON lines
const exportAllFlat = asyncHandler(async (req, res) => {
  const events = eventProcessingService.getAllNormalizedEvents();
  const lines = events.map(formatFlat).join("\n");
  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Content-Disposition", "attachment; filename=\"events_flat.jsonl\"");
  return res.status(200).send(lines);
});

module.exports = { exportEventCEF, exportAllCEF, exportAllJSONL, exportAllFlat };
