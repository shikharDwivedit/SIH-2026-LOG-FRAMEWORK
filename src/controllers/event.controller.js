const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");
const { eventProcessingService } = require("../services/event/event-processing.service");
const { fileIngestionService } = require("../services/ingestion/file-ingestion.service");

const ingestLog = asyncHandler(async (req, res) => {
  const { log, source_ip, transport } = req.body;

  if (!log || typeof log !== "string" || !log.trim()) {
    throw new ApiError(400, "Log content string is required in request body");
  }

  const result = eventProcessingService.processSingleRawLog(log, {
    source_ip,
    transport: transport || "http"
  });

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Log ingested and normalized successfully"));
});

const getAllEvents = asyncHandler(async (req, res) => {
  const events = eventProcessingService.getAllNormalizedEvents();
  return res
    .status(200)
    .json(new ApiResponse(200, events, "Normalized events fetched successfully"));
});

const getEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = eventProcessingService.getNormalizedEventById(id);

  if (!event) {
    throw new ApiError(404, `Normalized event with ID '${id}' not found`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, event, "Normalized event retrieved successfully"));
});

const getEventTraceability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const traceData = eventProcessingService.getEventTraceability(id);

  if (!traceData) {
    throw new ApiError(404, `Traceability data for event ID '${id}' not found`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, traceData, "Event traceability retrieved successfully"));
});

const ingestLogFile = asyncHandler(async (req, res) => {
  const { filePath } = req.body;

  if (!filePath) {
    throw new ApiError(400, "filePath parameter is required");
  }

  const processedEvents = [];
  await fileIngestionService.processLogFile(filePath, {}, async (rawEvent) => {
    const normalized = eventProcessingService.processSingleRawLog(rawEvent.raw_content, {
      transport: "file",
      source_id: filePath
    });
    processedEvents.push(normalized);
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { totalProcessed: processedEvents.length, events: processedEvents },
        `File '${filePath}' ingested and processed successfully`
      )
    );
});

module.exports = {
  ingestLog,
  getAllEvents,
  getEventById,
  getEventTraceability,
  ingestLogFile
};
