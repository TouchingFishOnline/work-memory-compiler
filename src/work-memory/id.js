const crypto = require("crypto");

function createId(prefix) {
  const safePrefix = normalizePrefix(prefix);
  return `${safePrefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function normalizePrefix(prefix) {
  const value = typeof prefix === "string" ? prefix.trim() : "";
  return value || "wmc";
}

module.exports = {
  createId,
};
