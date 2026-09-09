const express = require("express");
const path    = require("path");

const { errorHandler }   = require("./middlewares/error.middleware");
const { notFoundHandler }= require("./middlewares/notFound.middleware");

const healthcheckRouter = require("./routes/healthcheck.routes");
const eventRouter       = require("./routes/event.routes");
const parserRouter      = require("./routes/parser.routes");
const sourceRouter      = require("./routes/source.routes");
const outputRouter      = require("./routes/output.routes");

const app = express();

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ── Static files — serve the UI dashboard ───────────────────────────────────
app.use(express.static(path.join(__dirname, "..", "public")));

// ── Redirect root to dashboard ───────────────────────────────────────────────
app.get("/", (req, res) => {
  res.redirect("/dashboard.html");
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/events",      eventRouter);
app.use("/api/v1/parsers",     parserRouter);
app.use("/api/v1/sources",     sourceRouter);
app.use("/api/v1/output",      outputRouter);

// ── 404 + Centralized Error Handling ─────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
