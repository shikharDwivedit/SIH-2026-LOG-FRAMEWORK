const express = require("express");
const path    = require("path");

const { errorHandler }   = require("./middlewares/error.middleware");
const { notFoundHandler }= require("./middlewares/notFound.middleware");

const healthcheckRouter = require("./routes/healthcheck.routes");
const authRouter        = require("./routes/auth.routes");
const eventRouter       = require("./routes/event.routes");
const parserRouter      = require("./routes/parser.routes");
const sourceRouter      = require("./routes/source.routes");
const outputRouter      = require("./routes/output.routes");

const app = express();

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ── Static files — serve the Vite build, with the legacy UI as a fallback ───
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendDist));
app.use(express.static(path.join(__dirname, "..", "public")));

// ── Redirect root to dashboard ───────────────────────────────────────────────
app.get("/", (req, res) => {
  const entry = path.join(frontendDist, "index.html");
  if (require("fs").existsSync(entry)) return res.sendFile(entry);
  return res.redirect("/dashboard.html");
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/auth",        authRouter);
app.use("/api/v1/events",      eventRouter);
app.use("/api/v1/parsers",     parserRouter);
app.use("/api/v1/sources",     sourceRouter);
app.use("/api/v1/output",      outputRouter);

// Let the Vite client handle direct navigation to its local test page.
app.get("*", (req, res, next) => {
  const entry = path.join(frontendDist, "index.html");
  if (require("fs").existsSync(entry)) return res.sendFile(entry);
  return next();
});

// ── 404 + Centralized Error Handling ─────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
