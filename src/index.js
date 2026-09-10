const { app } = require("./app");
const { config } = require("./config/env");
const { logger } = require("./utils/logger");

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`⚙️  Server is running at port : ${PORT}`);
  logger.info(`🚀 Universal Log Normalization Framework v${config.schemaVersion} ready`);
});

