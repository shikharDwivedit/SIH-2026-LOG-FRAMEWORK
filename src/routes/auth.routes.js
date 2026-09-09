const { Router } = require("express");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError }    = require("../utils/ApiError");
const { verifyAuth, VALID_TOKENS } = require("../middlewares/auth.middleware");

const router = Router();

// POST /api/v1/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    throw new ApiError(400, "Username and password required");
  }

  if (username === "admin" && password === "admin123") {
    return res.status(200).json(new ApiResponse(200, {
      token: "admin-token-secret-sih2026",
      user: { id: "u1", username: "admin", role: "Admin" }
    }, "Login successful"));
  }

  if (username === "analyst" && password === "analyst123") {
    return res.status(200).json(new ApiResponse(200, {
      token: "analyst-token-secret-sih2026",
      user: { id: "u2", username: "analyst", role: "Analyst" }
    }, "Login successful"));
  }

  throw new ApiError(401, "Invalid username or password");
});

// GET /api/v1/auth/me
router.get("/me", verifyAuth, (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "Current user session retrieved"));
});

// POST /api/v1/auth/logout
router.post("/logout", (req, res) => {
  return res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});

module.exports = router;
