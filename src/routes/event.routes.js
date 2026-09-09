const { Router } = require("express");
const {
  ingestLog,
  getAllEvents,
  getEventById,
  getEventTraceability,
  ingestLogFile
} = require("../controllers/event.controller");

const router = Router();

router.route("/").get(getAllEvents);
router.route("/ingest").post(ingestLog);
router.route("/ingest-file").post(ingestLogFile);
router.route("/:id").get(getEventById);
router.route("/:id/trace").get(getEventTraceability);

module.exports = router;
