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

  findMatchingParser(rawContent, formatHint, options = {}) {
    const allParsers = this.getAllParsers();

    // Priority 1: Explicit parser name requested
    if (options.parserName) {
      const explicit = this.parsersMap.get(options.parserName);
      if (explicit) return explicit;
    }

    if (options.sourceId) {
      const source = require("../source/source-registry.service").sourceRegistryService.getById(options.sourceId);
      if (source?.preferred_parser) {
        const configured = this.parsersMap.get(source.preferred_parser);
        if (configured) return configured;
      }
    }

    // Priority 2: Vendor + Product hint matching
    if (options.vendor) {
      const vendorMatch = allParsers.find(p => 
        p.vendor?.toLowerCase() === options.vendor.toLowerCase() &&
        (!options.product || p.product?.toLowerCase() === options.product.toLowerCase())
      );
      if (vendorMatch) return vendorMatch;
    }

    // Priority 3: Strong message fingerprint (contains array / regex pattern)
    for (const parser of allParsers) {
      if (parser.match_criteria) {
        if (Array.isArray(parser.match_criteria.contains) && parser.match_criteria.contains.length > 0) {
          const anyMatch = parser.match_criteria.contains.some((substr) =>
            rawContent.includes(substr)
          );
          if (anyMatch) return parser;
        }

        if (parser.match_criteria.regex) {
          try {
            const re = new RegExp(parser.match_criteria.regex, "i");
            if (re.test(rawContent)) return parser;
          } catch (e) {}
        }
      }
    }

    // Priority 4: Format-based generic fallback
    const detectedFormat = formatHint || formatDetectorService.detectFormat(rawContent);
    if (detectedFormat) {
      const formatMatch = allParsers.find(p => 
        p.format === detectedFormat && 
        (!p.match_criteria || (
          !p.match_criteria.contains?.length && !p.match_criteria.regex
        ))
      );
      if (formatMatch) return formatMatch;
    }

    // Priority 5: Unknown
    return null;
  }
}

const parserRegistryService = new ParserRegistryService();

module.exports = { parserRegistryService, ParserRegistryService };
