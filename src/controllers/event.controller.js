const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");
const { eventProcessingService } = require("../services/event/event-processing.service");
const { fileIngestionService } = require("../services/ingestion/file-ingestion.service");
const { replayService } = require("../services/event/replay.service");
const { generateUuid } = require("../utils/hash");

const fileIngestionJobs = new Map();

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
  const events = eventProcessingService.getNormalizedEventsPage({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search
  });
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

const replayEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = replayService.replayRawEvent(id, { parserName: req.body?.parser_name });
  return res.status(200).json(new ApiResponse(200, event, "Raw event replayed successfully"));
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
      source_id: filePath,
      source_vendor: req.body.source_vendor || "Unknown local source",
      source_product: req.body.source_product || "Local log file",
      source_device_type: req.body.source_device_type || "host",
      source_name: req.body.source_name || filePath
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

const startLogFileIngestion = asyncHandler(async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) throw new ApiError(400, "filePath parameter is required");

  const jobId = generateUuid();
  const batchSize = Math.min(100, Math.max(1, Number.parseInt(req.body.batchSize, 10) || 25));
  const job = {
    jobId,
    filePath,
    batchSize,
    source_vendor: req.body.source_vendor || "Unknown local source",
    source_product: req.body.source_product || "Local log file",
    source_device_type: req.body.source_device_type || "host",
    source_name: req.body.source_name || filePath,
    status: "QUEUED",
    processed: 0,
    startedAt: null,
    completedAt: null,
    error: null,
    stopRequested: false
  };
  fileIngestionJobs.set(jobId, job);

  setImmediate(async () => {
    job.status = "RUNNING";
    job.startedAt = new Date().toISOString();
    try {
      await fileIngestionService.processLogFileBatched(filePath, {
        source_id: filePath,
        source_vendor: job.source_vendor,
        source_product: job.source_product,
        source_device_type: job.source_device_type,
        source_name: job.source_name
      }, batchSize, async batch => {
        for (const rawEvent of batch) {
          if (job.stopRequested) return;
          eventProcessingService.processSingleRawLog(rawEvent.raw_content, {
            transport: "file",
            source_id: filePath,
            source_vendor: job.source_vendor,
            source_product: job.source_product,
            source_device_type: job.source_device_type,
            source_name: job.source_name
          });
          job.processed += 1;
        }
      }, () => job.stopRequested);
      job.status = job.stopRequested ? "STOPPED" : "COMPLETED";
    } catch (error) {
      job.status = "FAILED";
      job.error = error.message;
    } finally {
      job.completedAt = new Date().toISOString();
    }
  });

  return res.status(202).json(new ApiResponse(202, { jobId, status: job.status, batchSize }, "File ingestion job started"));
});

const getLogFileIngestionStatus = asyncHandler(async (req, res) => {
  const job = fileIngestionJobs.get(req.params.jobId);
  if (!job) throw new ApiError(404, `Ingestion job '${req.params.jobId}' not found`);
  return res.status(200).json(new ApiResponse(200, job, "File ingestion status retrieved"));
});

const stopLogFileIngestion = asyncHandler(async (req, res) => {
  const job = fileIngestionJobs.get(req.params.jobId);
  if (!job) throw new ApiError(404, `Ingestion job '${req.params.jobId}' not found`);
  if (["COMPLETED", "STOPPED", "FAILED"].includes(job.status)) return res.status(200).json(new ApiResponse(200, job, "File ingestion already finished"));
  job.stopRequested = true;
  return res.status(200).json(new ApiResponse(200, { ...job, status: "STOPPING" }, "File ingestion stop requested"));
});

module.exports = {
  ingestLog,
  getAllEvents,
  getEventById,
  getEventTraceability,
  replayEvent,
  ingestLogFile,
  startLogFileIngestion,
  getLogFileIngestionStatus,
  stopLogFileIngestion
};
