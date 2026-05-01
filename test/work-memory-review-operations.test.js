const test = require("node:test");
const assert = require("node:assert/strict");
const { applyBatchReviewOperations } = require("../src/work-memory/review-operations");

test("batch review confirms ignores and annotates events", () => {
  const result = applyBatchReviewOperations({
    events: [
      { id: "evt_1", status: "draft", meta: {} },
      { id: "evt_2", status: "draft", meta: {} },
    ],
    operations: [
      { targetType: "event", targetId: "evt_1", action: "confirm", note: "确认进入记录" },
      { targetType: "event", targetId: "evt_2", action: "ignore" },
    ],
    now: "2026-05-02T12:00:00+08:00",
  });

  assert.equal(result.events[0].status, "committed");
  assert.equal(result.events[0].meta.review_note, "确认进入记录");
  assert.equal(result.events[1].status, "ignored");
  assert.equal(result.applied.length, 2);
});

test("batch review can merge threads and update decisions", () => {
  const result = applyBatchReviewOperations({
    threads: [
      { id: "thr_1", title: "A", related_events: ["evt_1"], open_loops: ["loop"] },
      { id: "thr_2", title: "B", related_events: ["evt_2"], open_loops: [] },
    ],
    decisions: [{ id: "dec_1", rationale: [], linked_materials: [] }],
    operations: [
      { targetType: "thread", targetId: "thr_1", action: "merge", mergeWith: "thr_2" },
      { targetType: "decision", targetId: "dec_1", action: "link_material", materialId: "mat_1" },
    ],
    now: "2026-05-02T12:00:00+08:00",
  });

  assert.equal(result.threads.length, 1);
  assert.deepEqual(result.threads[0].related_events, ["evt_1", "evt_2"]);
  assert.deepEqual(result.decisions[0].linked_materials, ["mat_1"]);
});

test("batch review rejects self thread merge without deleting the thread", () => {
  const result = applyBatchReviewOperations({
    threads: [
      { id: "thr_1", status: "active", related_events: ["evt_1"], open_loops: [] },
    ],
    operations: [
      { targetType: "thread", targetId: "thr_1", action: "merge", mergeWith: "thr_1" },
    ],
    now: "2026-05-02T12:00:00+08:00",
  });

  assert.equal(result.threads.length, 1);
  assert.equal(result.applied.length, 0);
  assert.equal(result.unknown.length, 1);
});
