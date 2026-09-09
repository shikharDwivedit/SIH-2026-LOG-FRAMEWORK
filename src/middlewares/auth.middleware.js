const { ApiError } = require("../utils/ApiError");

// Mock user tokens / sessions for framework reference authentication (SRS §27)
const VALID_TOKENS = {
  "admin-token-secret-sih2026": { id: "u1", username: "admin", role: "Admin" },
  "analyst-token-secret-sih2026": { id: "u2", username: "analyst", role: "Analyst" },
  "viewer-token-secret-sih2026": { id: "u3", username: "viewer", role: "Viewer" }
};

const verifyAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers["x-api-key"];
  
  // If authorization header provided, validate token
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const user = VALID_TOKENS[token];
    if (!user) {
      throw new ApiError(401, "Invalid authentication token");
    }
    req.user = user;
    return next();
  }

  // Default guest/viewer fallback for public dashboard demonstration endpoints
  req.user = { id: "guest", username: "guest", role: "Viewer" };
  return next();
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, `Role '${req.user.role}' is not authorized to perform this operation. Required: ${allowedRoles.join(", ")}`);
    }
    next();
  };
};

module.exports = { verifyAuth, authorizeRoles, VALID_TOKENS };
