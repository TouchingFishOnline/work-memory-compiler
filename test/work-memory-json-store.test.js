const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { WorkMemoryJsonStore } = require("../src/work-memory/json-store");

test("json store initializes local-first state files", () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "wmc-store-"));
  const store = new WorkMemoryJsonStore({ stateDir });
  store.ensure();

  assert.equal(fs.existsSync(path.join(stateDir, "events.json")), true);
  assert.equal(fs.existsSync(path.join(stateDir, "threads.json")), true);
  assert.equal(fs.existsSync(path.join(stateDir, "decisions.json")), true);
  assert.equal(fs.existsSync(path.join(stateDir, "decision-patches.json")), true);
  assert.equal(fs.existsSync(path.join(stateDir, "memory-items.json")), true);
  assert.equal(fs.existsSync(path.join(stateDir, "config.json")), true);
});

test("json store appends and lists events", () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "wmc-store-"));
  const store = new WorkMemoryJsonStore({ stateDir });
  const event = store.appendEvent({ id: "evt_1", raw: "📌", status: "buffered" });

  assert.equal(event.id, "evt_1");
  assert.deepEqual(store.listEvents().map((item) => item.id), ["evt_1"]);
});

test("json store reports corrupt state instead of overwriting it", () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "wmc-store-"));
  const store = new WorkMemoryJsonStore({ stateDir });
  store.ensure();
  const eventsFile = path.join(stateDir, "events.json");
  fs.writeFileSync(eventsFile, "{not-json", "utf8");

  assert.throws(() => store.listEvents(), /Failed to read JSON state/);
  assert.throws(() => store.appendEvent({ id: "evt_2" }), /Failed to read JSON state/);
  assert.equal(fs.readFileSync(eventsFile, "utf8"), "{not-json");
});

test("json store reports non-array list state instead of treating it as empty", () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "wmc-store-"));
  const store = new WorkMemoryJsonStore({ stateDir });
  store.ensure();
  const eventsFile = path.join(stateDir, "events.json");
  fs.writeFileSync(eventsFile, '{"events":[]}', "utf8");

  assert.throws(() => store.listEvents(), /Expected JSON array state/);
  assert.throws(() => store.appendEvent({ id: "evt_2" }), /Expected JSON array state/);
  assert.equal(fs.readFileSync(eventsFile, "utf8"), '{"events":[]}');
});
