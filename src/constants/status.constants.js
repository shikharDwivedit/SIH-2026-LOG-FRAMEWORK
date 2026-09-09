const ProcessingStatus = Object.freeze({
  PROCESSED: "PROCESSED",
  PARTIALLY_PROCESSED: "PARTIALLY_PROCESSED",
  UNSUPPORTED: "UNSUPPORTED",
  PARSER_ERROR: "PARSER_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR"
});

const LogFormat = Object.freeze({
  KEY_VALUE: "key-value",
  SYSLOG: "syslog",
  CEF: "cef",
  JSON: "json",
  REGEX: "regex",
  UNKNOWN: "unknown"
});

module.exports = {
  ProcessingStatus,
  LogFormat
};
