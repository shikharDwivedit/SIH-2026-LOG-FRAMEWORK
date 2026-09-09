const crypto = require("crypto");

function generateSha256(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function generateUuid() {
  return crypto.randomUUID();
}

module.exports = {
  generateSha256,
  generateUuid
};
