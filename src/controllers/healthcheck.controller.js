const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse }  = require("../utils/ApiResponse");
const { ApiError }     = require("../utils/ApiError");
const { metricsService }    = require("../services/metrics/metrics.service");
const { deadLetterService } = require("../services/ingestion/dead-letter.service");

// GET /api/v1/healthcheck — basic liveness probe
const getHealthStatus = asyncHandler(async (req, res) => {
  const healthData = {
    status: "UP",
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: "SIH 2026 Lossless Log Normalization Framework"
  };
  return res.status(200).json(new ApiResponse(200, healthData, "System is healthy and operational"));
});

// GET /api/v1/metrics — pipeline observability (SRS §33)
const getMetrics = asyncHandler(async (req, res) => {
  const summary = metricsService.getSummary();
  return res.status(200).json(new ApiResponse(200, summary, "Pipeline metrics retrieved"));
});

// GET /api/v1/metrics/dead-letter — all dead-lettered events
const getDeadLetterEvents = asyncHandler(async (req, res) => {
  const events = deadLetterService.getPage({ page: req.query.page, limit: req.query.limit, search: req.query.search });
  return res
    .status(200)
    .json(new ApiResponse(200, events, `${events.pagination.total} dead-lettered events retrieved`));
});

module.exports = { getHealthStatus, getMetrics, getDeadLetterEvents };
