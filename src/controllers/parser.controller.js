const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse }  = require("../utils/ApiResponse");
const { ApiError }     = require("../utils/ApiError");
const { parserRegistryService }  = require("../services/parser/parser-registry.service");
const { parserLoaderService }    = require("../services/parser/parser-loader.service");
const { eventProcessingService } = require("../services/event/event-processing.service");

function validateParserConfig(parserConfig) {
  const errors = [];
  const extractionTypes = ["key-value", "json", "regex", "cef"];

  if (!parserConfig || typeof parserConfig !== "object" || Array.isArray(parserConfig)) {
    return ["Parser config must be a JSON object"];
  }
  if (!parserConfig.name || typeof parserConfig.name !== "string") errors.push("'name' must be a non-empty string");
  if (!parserConfig.format || typeof parserConfig.format !== "string") errors.push("'format' must be a non-empty string");
  if (parserConfig.extraction?.type && !extractionTypes.includes(parserConfig.extraction.type)) {
    errors.push(`'extraction.type' must be one of: ${extractionTypes.join(", ")}`);
  }
  if (parserConfig.extraction?.type === "regex" && !parserConfig.extraction.pattern) {
    errors.push("Regex parsers require 'extraction.pattern'");
  }
  if (parserConfig.field_mappings !== undefined && (typeof parserConfig.field_mappings !== "object" || Array.isArray(parserConfig.field_mappings))) {
    errors.push("'field_mappings' must be an object of source fields to universal paths");
  }
  if (parserConfig.match_criteria !== undefined && (typeof parserConfig.match_criteria !== "object" || Array.isArray(parserConfig.match_criteria))) {
    errors.push("'match_criteria' must be an object with 'contains' and/or 'regex'");
  }
  return errors;
}

// GET /api/v1/parsers — list all registered parsers
const getAllParsers = asyncHandler(async (req, res) => {
  const parsers = parserRegistryService.getAllParsers();
  return res
    .status(200)
    .json(new ApiResponse(200, parsers, "Active parser definitions retrieved successfully"));
});

// POST /api/v1/parsers — register a new parser via JSON body (Plug-and-Play API)
const registerCustomParser = asyncHandler(async (req, res) => {
  const parserConfig = req.body;

  const validationErrors = validateParserConfig(parserConfig);
  if (validationErrors.length) {
    throw new ApiError(400, validationErrors.join("; "));
  }

  const defaultExtractionType = ["json", "regex", "cef"].includes(parserConfig.format)
    ? parserConfig.format
    : "key-value";
  const registeredParser = {
    version: "1.0",
    extraction: { type: defaultExtractionType, ...(parserConfig.extraction || {}) },
    field_mappings: {},
    ...parserConfig
  };
  parserRegistryService.registerParser(registeredParser);

  return res
    .status(201)
    .json(new ApiResponse(201, registeredParser, `Parser '${registeredParser.name}' registered (Plug-and-Play active)`));
});

// POST /api/v1/parsers/test — test a raw log against a parser without ingesting
// Body: { log: "raw log string", parser_name: "optional-parser-name" }
const testParser = asyncHandler(async (req, res) => {
  const { log, parser_name } = req.body;

  if (!log || typeof log !== "string" || !log.trim()) {
    throw new ApiError(400, "Request body must include a 'log' string to test");
  }

  const result = eventProcessingService.testLog(log.trim(), parser_name || null);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Parser test completed"));
});

// POST /api/v1/parsers/reload — hot-reload parsers from disk without restart
const reloadParsers = asyncHandler(async (req, res) => {
  parserRegistryService.init();
  const parsers = parserRegistryService.getAllParsers();
  return res
    .status(200)
    .json(new ApiResponse(200, { count: parsers.length, parsers }, "Parser registry reloaded from disk"));
});

module.exports = { getAllParsers, registerCustomParser, testParser, reloadParsers };
