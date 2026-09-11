const dotenv = require("dotenv");

dotenv.config();

const config = {
  port: parseInt(process.env.PORT || "8000", 10),
  syslogPort: parseInt(process.env.SYSLOG_UDP_PORT || "5140", 10),
  syslogHost: process.env.SYSLOG_UDP_HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",
  apiVersion: process.env.API_VERSION || "v1",
  parserDir: process.env.PARSER_DIR || "parsers",
  schemaVersion: "1.0"
};

module.exports = { config };
