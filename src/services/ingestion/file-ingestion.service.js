const fs = require("fs");
const readline = require("readline");
const { rawStoreService } = require("./raw-store.service");

class FileIngestionService {
  async processLogFile(filePath, metadata = {}, onLineCallback) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Log file not found: ${filePath}`);
    }

    const fileStream = fs.createReadStream(filePath, { encoding: "utf8" });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    const results = [];

    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const rawEvent = rawStoreService.createRawEvent(trimmed, {
        ...metadata,
        transport: "file",
        file_path: filePath
      });

      if (onLineCallback) {
        await onLineCallback(rawEvent);
      }

      results.push(rawEvent);
    }

    return results;
  }
}

const fileIngestionService = new FileIngestionService();

module.exports = { fileIngestionService, FileIngestionService };
