const fs = require("fs");
const path = require("path");
const { logger } = require("../../utils/logger");

class ParserLoaderService {
  loadParsersFromDir(baseDir) {
    const parsers = [];
    if (!fs.existsSync(baseDir)) {
      logger.warn(`Parser directory not found: ${baseDir}`);
      return parsers;
    }

    const readDirRecursive = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          readDirRecursive(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".json")) {
          try {
            const content = fs.readFileSync(fullPath, "utf8");
            const parserConfig = JSON.parse(content);
            if (parserConfig.name && parserConfig.format) {
              parsers.push(parserConfig);
            }
          } catch (e) {
            logger.error(`Failed to load parser config from ${fullPath}: ${e.message}`);
          }
        }
      }
    };

    readDirRecursive(baseDir);
    logger.info(`Loaded ${parsers.length} parser definitions from ${baseDir}`);
    return parsers;
  }
}

const parserLoaderService = new ParserLoaderService();

module.exports = { parserLoaderService, ParserLoaderService };
