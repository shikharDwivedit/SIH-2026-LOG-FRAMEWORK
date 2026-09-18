const { Router } = require("express");
const { getHealthStatus, getMetrics, getDeadLetterEvents, resetApplicationData } = require("../controllers/healthcheck.controller");

const router = Router();

router.get("/", getHealthStatus);
router.get("/metrics", getMetrics);
router.get("/dead-letter", getDeadLetterEvents);
router.post("/reset", resetApplicationData);

module.exports = router;
