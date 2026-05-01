function currentIso() {
  return new Date().toISOString();
}

function resolveNow(options = {}) {
  if (typeof options.now === "function") {
    return options.now();
  }
  if (typeof options.now === "string" && options.now.trim()) {
    return options.now.trim();
  }
  return currentIso();
}

function dateKeyFromIso(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.slice(0, 10);
}

module.exports = {
  currentIso,
  dateKeyFromIso,
  resolveNow,
};
