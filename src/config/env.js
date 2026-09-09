const dotenv = require("dotenv");

dotenv.config();

const config = {
  port: parseInt(process.env.PORT || "8000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  apiVersion: process.env.API_VERSION || "v1",
  parserDir: process.env.PARSER_DIR || "parsers",
  schemaVersion: "1.0"
};

module.exports = { config };
