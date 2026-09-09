const path = require("path");
const { parserLoaderService } = require("./parser-loader.service");
const { formatDetectorService } = require("./format-detector.service");
const { logger } = require("../../utils/logger");

class ParserRegistryService {
  constructor() {
    this.parsersMap = new Map();
    this.init();
  }

  init(customDir) {
    const parserDir = customDir || path.join(process.cwd(), "parsers");
    const loaded = parserLoaderService.loadParsersFromDir(parserDir);
    this.parsersMap.clear();
    for (const p of loaded) {
      this.registerParser(p);
    }
  }

  registerParser(parserConfig) {
    const key = `${parserConfig.name}:${parserConfig.version || "1.0"}`;
    this.parsersMap.set(key, parserConfig);
    this.parsersMap.set(parserConfig.name, parserConfig); // default fallback alias
    logger.debug(`Registered parser: ${key}`);
  }

  getAllParsers() {
    return Array.from(new Set(this.parsersMap.values()));
  }

  findMatchingParser(rawContent, formatHint) {
    const detectedFormat = formatHint || formatDetectorService.detectFormat(rawContent);

    for (const parser of this.getAllParsers()) {
      if (parser.match_criteria) {
        // Contains check
        if (Array.isArray(parser.match_criteria.contains)) {
          const allMatch = parser.match_criteria.contains.every((substr) =>
            rawContent.includes(substr)
          );
          if (allMatch) return parser;
        }

        // Regex match criteria
        if (parser.match_criteria.regex) {
          const re = new RegExp(parser.match_criteria.regex, "i");
          if (re.test(rawContent)) return parser;
        }
      }

      // Format-based fallback
      if (parser.format === detectedFormat) {
        return parser;
      }
    }

    return null;
  }
}

const parserRegistryService = new ParserRegistryService();

module.exports = { parserRegistryService, ParserRegistryService };
