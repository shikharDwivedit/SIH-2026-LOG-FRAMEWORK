const { Router } = require("express");
const { getAllSources, registerSource, getSourceById, deactivateSource } = require("../controllers/source.controller");

const router = Router();

router.get("/", getAllSources);
router.post("/", registerSource);
router.get("/:id", getSourceById);
router.delete("/:id", deactivateSource);

module.exports = router;
