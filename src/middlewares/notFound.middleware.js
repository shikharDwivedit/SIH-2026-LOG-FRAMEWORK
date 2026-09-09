const { ApiError } = require("../utils/ApiError");

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route Not Found - ${req.originalUrl}`));
};

module.exports = { notFoundHandler };
