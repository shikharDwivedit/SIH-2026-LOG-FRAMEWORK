const { ApiError } = require("../utils/ApiError");
const { logger } = require("../utils/logger");
const { config } = require("../config/env");

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  logger.error(`[API ERROR] ${error.statusCode} - ${error.message}`);

  const response = {
    statusCode: error.statusCode,
    message: error.message,
    success: false,
    errors: error.errors,
    ...(config.nodeEnv === "development" ? { stack: error.stack } : {})
  };

  return res.status(error.statusCode).json(response);
};

module.exports = { errorHandler };
