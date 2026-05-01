const test = require("node:test");
const assert = require("node:assert/strict");
const { applyCommitDecisions, buildAgentExport } = require("../src/work-memory/commit-engine");

test("commit decisions confirm ignore and keep draft events", () => {
  const result = applyCommitDecisions({
    events: [
      { id: "evt_1", status: "draft" },
      { id: "evt_2", status: "draft" },
      { id: "evt_3", status: "draft" },
    ],
    decisions: [
      { eventId: "evt_1", action: "confirm" },
      { eventId: "evt_2", action: "ignore" },
      { eventId: "evt_3", action: "keep_draft" },
    ],
  });

  assert.equal(result.events[0].status, "committed");
  assert.equal(result.events[1].status, "ignored");
  assert.equal(result.events[2].status, "draft");
});

test("agent export contains all PRD export buckets", () => {
  const exported = buildAgentExport({
    events: [],
    threads: [],
    dirtyBuffer: [],
    confirmedRecords: [],
    decisions: [],
    openLoops: [],
    reminders: [],
    memoryItems: [],
  });

  assert.deepEqual(Object.keys(exported), [
    "events",
    "threads",
    "dirty_buffer",
    "confirmed_records",
    "decisions",
    "open_loops",
    "reminders",
    "memory_items",
  ]);
});
