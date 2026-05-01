const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { WorkMemoryService } = require("../src/work-memory");
const { WorkMemoryMcpToolHost } = require("../src/work-memory/mcp-tool-host");
const { selectReviewInteraction } = require("../src/work-memory/review-selector");

test("selector keeps small mobile reviews inline", () => {
  const result = selectReviewInteraction({
    counts: { dirtyItems: 4, decisionRecords: 1 },
    hints: { userIsOnMobile: true },
  });

  assert.equal(result.mode, "wechat_inline");
  assert.equal(result.startsServer, false);
});

test("selector recommends markdown roundtrip for larger annotation work", () => {
  const result = selectReviewInteraction({
    counts: { dirtyItems: 12, decisionRecords: 3 },
    hints: { longTextNeeded: true, userWantsAnnotation: true },
  });

  assert.equal(result.mode, "md_roundtrip");
});

test("selector recommends review ui without starting ui in v0.2", () => {
  const result = selectReviewInteraction({
    counts: { dirtyItems: 25, decisionRecords: 6, activeThreads: 8 },
    hints: { userWantsDashboardOrNoteEditing: true },
  });

  assert.equal(result.mode, "review_ui_recommended");
  assert.equal(result.startsServer, false);
});

test("service and mcp expose review mode selection", async () => {
  const service = new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-selector-")),
  });
  const host = new WorkMemoryMcpToolHost({ service });

  assert.equal(service.reviewSelectMode({
    counts: { dirtyItems: 12, decisionRecords: 3 },
    hints: { userWantsAnnotation: true },
  }).mode, "md_roundtrip");

  const result = await host.invokeTool("work_memory_review_select_mode", {
    counts: { dirtyItems: 4, decisionRecords: 1 },
    hints: { userIsOnMobile: true },
  });

  assert.equal(result.data.mode, "wechat_inline");
});
