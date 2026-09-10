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

  async processLogFileBatched(filePath, metadata = {}, batchSize = 25, onBatch, shouldStop = () => false) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Log file not found: ${filePath}`);
    }

    const fileStream = fs.createReadStream(filePath, { encoding: "utf8" });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    const batch = [];
    let processed = 0;

    try {
      for await (const line of rl) {
        if (shouldStop()) break;
        const trimmed = line.trim();
        if (!trimmed) continue;

        batch.push(rawStoreService.createRawEvent(trimmed, {
          ...metadata,
          transport: "file",
          file_path: filePath
        }));

        if (batch.length >= batchSize) {
          await onBatch(batch.splice(0, batch.length));
          processed += batchSize;
          await new Promise(resolve => setImmediate(resolve));
        }
      }

      if (!shouldStop() && batch.length) {
        const remaining = batch.splice(0, batch.length);
        await onBatch(remaining);
        processed += remaining.length;
      }
    } finally {
      rl.close();
      fileStream.destroy();
    }

    return processed;
  }
}

const fileIngestionService = new FileIngestionService();

module.exports = { fileIngestionService, FileIngestionService };
