const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse }  = require("../utils/ApiResponse");
const { ApiError }     = require("../utils/ApiError");
const { sourceRegistryService } = require("../services/source/source-registry.service");

// GET /api/v1/sources — list all registered sources
const getAllSources = asyncHandler(async (req, res) => {
  const sources = sourceRegistryService.getAll();
  return res
    .status(200)
    .json(new ApiResponse(200, sources, "Registered sources retrieved"));
});

// POST /api/v1/sources — register a new source (Plug-and-Play SRS FR-02)
const registerSource = asyncHandler(async (req, res) => {
  const body = req.body;

  if (!body || !body.name || !body.vendor) {
    throw new ApiError(400, "Source registration requires at least 'name' and 'vendor'");
  }

  const source = sourceRegistryService.register(body);

  return res
    .status(201)
    .json(new ApiResponse(201, source, `Source '${source.name}' registered successfully`));
});

// GET /api/v1/sources/:id — get a single source
const getSourceById = asyncHandler(async (req, res) => {
  const source = sourceRegistryService.getById(req.params.id);
  if (!source) throw new ApiError(404, `Source '${req.params.id}' not found`);
  return res.status(200).json(new ApiResponse(200, source, "Source retrieved"));
});

// DELETE /api/v1/sources/:id — deactivate a source
const deactivateSource = asyncHandler(async (req, res) => {
  const source = sourceRegistryService.deactivate(req.params.id);
  if (!source) throw new ApiError(404, `Source '${req.params.id}' not found`);
  return res.status(200).json(new ApiResponse(200, source, "Source deactivated"));
});

module.exports = { getAllSources, registerSource, getSourceById, deactivateSource };
