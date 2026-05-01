const fs = require("fs");
const os = require("os");
const path = require("path");

const { DEFAULT_CONFIG } = require("./defaults");

class WorkMemoryJsonStore {
  constructor({ stateDir } = {}) {
    this.stateDir = normalizeStateDir(stateDir);
    this.files = {
      events: path.join(this.stateDir, "events.json"),
      threads: path.join(this.stateDir, "threads.json"),
      decisions: path.join(this.stateDir, "decisions.json"),
      memoryItems: path.join(this.stateDir, "memory-items.json"),
      config: path.join(this.stateDir, "config.json"),
    };
    this.exportsDir = path.join(this.stateDir, "exports");
  }

  ensure() {
    fs.mkdirSync(this.stateDir, { recursive: true });
    fs.mkdirSync(this.exportsDir, { recursive: true });
    this.ensureArrayFile(this.files.events);
    this.ensureArrayFile(this.files.threads);
    this.ensureArrayFile(this.files.decisions);
    this.ensureArrayFile(this.files.memoryItems);
    if (!fs.existsSync(this.files.config)) {
      writeJsonFile(this.files.config, clone(DEFAULT_CONFIG));
    }
  }

  listEvents() {
    return this.readArray(this.files.events);
  }

  appendEvent(event) {
    return this.appendItem(this.files.events, event);
  }

  replaceEvents(events) {
    this.writeArray(this.files.events, events);
    return this.listEvents();
  }

  listThreads() {
    return this.readArray(this.files.threads);
  }

  appendThread(thread) {
    return this.appendItem(this.files.threads, thread);
  }

  replaceThreads(threads) {
    this.writeArray(this.files.threads, threads);
    return this.listThreads();
  }

  listDecisions() {
    return this.readArray(this.files.decisions);
  }

  appendDecision(decision) {
    return this.appendItem(this.files.decisions, decision);
  }

  replaceDecisions(decisions) {
    this.writeArray(this.files.decisions, decisions);
    return this.listDecisions();
  }

  listMemoryItems() {
    return this.readArray(this.files.memoryItems);
  }

  appendMemoryItem(memoryItem) {
    return this.appendItem(this.files.memoryItems, memoryItem);
  }

  replaceMemoryItems(memoryItems) {
    this.writeArray(this.files.memoryItems, memoryItems);
    return this.listMemoryItems();
  }

  readConfig() {
    this.ensure();
    return readJsonFile(this.files.config, clone(DEFAULT_CONFIG));
  }

  writeConfig(config) {
    this.ensure();
    writeJsonFile(this.files.config, config && typeof config === "object" ? config : clone(DEFAULT_CONFIG));
    return this.readConfig();
  }

  appendItem(filePath, item) {
    const items = this.readArray(filePath);
    items.push(item);
    this.writeArray(filePath, items);
    return item;
  }

  readArray(filePath) {
    this.ensure();
    const value = readJsonFile(filePath, []);
    return Array.isArray(value) ? value : [];
  }

  writeArray(filePath, items) {
    this.ensure();
    writeJsonFile(filePath, Array.isArray(items) ? items : []);
  }

  ensureArrayFile(filePath) {
    if (!fs.existsSync(filePath)) {
      writeJsonFile(filePath, []);
    }
  }
}

function normalizeStateDir(stateDir) {
  const value = typeof stateDir === "string" ? stateDir.trim() : "";
  if (value) {
    return path.resolve(value.replace(/^~(?=$|\/)/u, os.homedir()));
  }
  return path.join(os.homedir(), ".work-memory-compiler");
}

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return clone(fallback);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read JSON state ${filePath}: ${message}`);
  }
}

function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = {
  WorkMemoryJsonStore,
};
