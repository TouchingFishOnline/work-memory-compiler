const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { WorkMemoryService } = require("../src/work-memory");
const { applyMemoryReviewOperation } = require("../src/work-memory/memory-review");

test("memory review update preserves user editability", () => {
  const result = applyMemoryReviewOperation({
    memoryItems: [{ id: "mem_1", summary: "旧描述", user_editable: true }],
    operation: { action: "update", memoryId: "mem_1", summary: "新描述" },
    now: "2026-05-02T12:00:00+08:00",
  });

  assert.equal(result.memoryItems[0].summary, "新描述");
  assert.equal(result.memoryItems[0].user_editable, true);
});

test("memory review can disable a memory item without deleting history", () => {
  const result = applyMemoryReviewOperation({
    memoryItems: [{ id: "mem_1", summary: "偏好 A", user_editable: true }],
    operation: { action: "disable", memoryId: "mem_1" },
    now: "2026-05-02T12:00:00+08:00",
  });

  assert.equal(result.memoryItems[0].disabled, true);
});

test("service review memory updates persisted memory items", () => {
  const service = new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-memory-")),
    now: () => "2026-05-02T12:00:00+08:00",
  });
  service.store.appendMemoryItem({ id: "mem_1", summary: "旧描述", user_editable: true });

  const result = service.reviewMemory({
    operation: { action: "update", memoryId: "mem_1", summary: "新描述" },
  });

  assert.equal(result.memoryItems[0].summary, "新描述");
  assert.equal(service.store.listMemoryItems()[0].summary, "新描述");
});
