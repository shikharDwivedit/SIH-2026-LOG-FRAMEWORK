const { LogFormat } = require("../../constants/status.constants");

class FormatDetectorService {
  detectFormat(rawContent) {
    if (!rawContent || typeof rawContent !== "string") {
      return LogFormat.UNKNOWN;
    }

    const trimmed = rawContent.trim();

    // JSON format check
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        JSON.parse(trimmed);
        return LogFormat.JSON;
      } catch (e) {
        // Not JSON
      }
    }

    // CEF format check (CEF:Version|Device Vendor|Device Product|Device Version|Signature ID|Name|Severity|Extension)
    if (trimmed.startsWith("CEF:") || trimmed.includes(" CEF:")) {
      return LogFormat.CEF;
    }

    // FortiGate / KV format check (contains multiple key=value pairs, e.g., srcip=10.0.0.5 action=deny)
    const kvMatches = trimmed.match(/\b([a-zA-Z0-9_\-\.]+)=("[^"]*"|\S+)/g);
    if (kvMatches && kvMatches.length >= 3) {
      return LogFormat.KEY_VALUE;
    }

    // Standard Syslog check (<134>Sep 9 14:02:11 host msg...)
    if (/^<\d{1,3}>[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/.test(trimmed)) {
      return LogFormat.SYSLOG;
    }

    return LogFormat.REGEX;
  }
}

const formatDetectorService = new FormatDetectorService();

module.exports = { formatDetectorService, FormatDetectorService };
