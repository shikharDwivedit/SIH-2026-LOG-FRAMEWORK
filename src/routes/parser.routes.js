const { Router } = require("express");
const { getAllParsers, registerCustomParser, testParser, reloadParsers } = require("../controllers/parser.controller");

const router = Router();

router.get("/", getAllParsers);
router.post("/", registerCustomParser);
router.post("/test", testParser);
router.post("/reload", reloadParsers);

module.exports = router;
