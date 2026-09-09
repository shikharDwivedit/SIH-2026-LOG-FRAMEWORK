const fs = require("fs");
const path = require("path");

class LocalEventQueue {
  constructor(queueDir) {
    this.queueDir = queueDir || path.join(process.cwd(), "storage", "queue");
    if (!fs.existsSync(this.queueDir)) {
      fs.mkdirSync(this.queueDir, { recursive: true });
    }
    this.memoryQueue = [];
    this.isConsuming = false;
  }

  async publish(data) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const job = {
      jobId,
      rawEventId: data.rawEventId,
      rawContent: data.rawContent,
      metadata: data.metadata || {},
      attempts: 0,
      maxAttempts: data.maxAttempts || 3,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.memoryQueue.push(job);
    const filePath = path.join(this.queueDir, `${jobId}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(job, null, 2), "utf-8");

    return job;
  }

  async consume(handler) {
    if (this.isConsuming) return;
    this.isConsuming = true;

    while (this.memoryQueue.length > 0) {
      const job = this.memoryQueue.shift();
      if (!job) continue;

      job.status = 'PROCESSING';
      job.attempts++;

      try {
        await handler(job);
        job.status = 'COMPLETED';
        const filePath = path.join(this.queueDir, `${job.jobId}.json`);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath).catch(() => {});
        }
      } catch (err) {
        job.error = err.message || String(err);
        if (job.attempts < job.maxAttempts) {
          await this.retry(job);
        } else {
          job.status = 'FAILED';
          const filePath = path.join(this.queueDir, `${job.jobId}.json`);
          await fs.promises.writeFile(filePath, JSON.stringify(job, null, 2), "utf-8");
        }
      }
    }

    this.isConsuming = false;
  }

  async retry(job) {
    job.status = 'PENDING';
    this.memoryQueue.push(job);
  }

  async getPendingCount() {
    return this.memoryQueue.length;
  }
}

module.exports = { LocalEventQueue };
