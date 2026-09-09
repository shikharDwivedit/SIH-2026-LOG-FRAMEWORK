const { Router } = require("express");
const { getHealthStatus, getMetrics, getDeadLetterEvents } = require("../controllers/healthcheck.controller");

const router = Router();

router.get("/", getHealthStatus);
router.get("/metrics", getMetrics);
router.get("/dead-letter", getDeadLetterEvents);

module.exports = router;
