const { Router } = require("express");
const { exportEventCEF, exportAllCEF, exportAllJSONL, exportAllFlat } = require("../controllers/output.controller");

const router = Router();

router.get("/cef",      exportAllCEF);
router.get("/cef/:id",  exportEventCEF);
router.get("/jsonl",    exportAllJSONL);
router.get("/flat",     exportAllFlat);

module.exports = router;
