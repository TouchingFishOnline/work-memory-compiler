const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DEFAULT_CONFIG } = require("../src/work-memory/defaults");
const { evaluateReviewTrigger } = require("../src/work-memory/review-trigger");
const { WorkMemoryService } = require("../src/work-memory");
const { WorkMemoryMcpToolHost } = require("../src/work-memory/mcp-tool-host");

test("review trigger stays quiet in silent mode", () => {
  const result = evaluateReviewTrigger({
    config: {
      ...DEFAULT_CONFIG,
      confirmationBudget: {
        ...DEFAULT_CONFIG.confirmationBudget,
        mode: "silent",
      },
    },
    events: Array.from({ length: 20 }, (_, index) => ({
      id: `evt_${index}`,
      status: "draft",
    })),
    threads: Array.from({ length: 10 }, (_, index) => ({
      id: `thr_${index}`,
      status: "active",
    })),
    now: "2026-05-02T10:00:00+08:00",
  });

  assert.equal(result.shouldPrompt, false);
  assert.equal(result.reason, "silent_mode");
});

test("review trigger suggests lightweight snapshot when risk thresholds are exceeded", () => {
  const result = evaluateReviewTrigger({
    config: DEFAULT_CONFIG,
    events: [
      { id: "evt_1", status: "draft" },
      { id: "evt_2", status: "buffered" },
      { id: "evt_3", status: "needs_clarification" },
      { id: "evt_4", status: "draft" },
      { id: "evt_5", status: "draft" },
      { id: "evt_6", status: "draft" },
      { id: "evt_7", status: "draft" },
      { id: "evt_8", status: "draft" },
      { id: "evt_9", status: "draft" },
    ],
    threads: [
      { id: "thr_1", status: "active" },
      { id: "thr_2", status: "waiting" },
      { id: "thr_3", status: "archived" },
    ],
    now: "2026-05-02T10:00:00+08:00",
  });

  assert.equal(result.shouldPrompt, true);
  assert.equal(result.output, "thread_snapshot");
  assert.match(result.message, /轻量线程截图/);
  assert.deepEqual(result.triggers.map((trigger) => trigger.kind), ["dirty_item_count"]);
});

test("review trigger respects minimum interval after the previous check", () => {
  const result = evaluateReviewTrigger({
    config: DEFAULT_CONFIG,
    events: Array.from({ length: 9 }, (_, index) => ({
      id: `evt_${index}`,
      status: "draft",
    })),
    threads: [],
    now: "2026-05-02T10:00:00+08:00",
    lastReviewCheckAt: "2026-05-02T09:30:00+08:00",
  });

  assert.equal(result.shouldPrompt, false);
  assert.equal(result.reason, "min_interval");
  assert.equal(result.nextEligibleAt, "2026-05-02T10:30:00.000+08:00");
});

test("service exposes review trigger status from persisted state", () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "wmc-trigger-"));
  const service = new WorkMemoryService({
    stateDir,
    now: () => "2026-05-02T10:00:00+08:00",
  });

  for (let index = 0; index < 9; index += 1) {
    service.capture({ text: `note ${index}` });
  }

  const result = service.reviewTriggerStatus();

  assert.equal(result.shouldPrompt, true);
  assert.equal(result.counts.dirtyItems, 9);
});

test("mcp host exposes review trigger status", async () => {
  const service = new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-trigger-")),
    now: () => "2026-05-02T10:00:00+08:00",
  });
  const host = new WorkMemoryMcpToolHost({ service });

  const names = host.listTools().map((tool) => tool.name);
  assert.ok(names.includes("work_memory_review_status"));

  const result = await host.invokeTool("work_memory_review_status", {});

  assert.match(result.text, /review/);
  assert.equal(result.data.shouldPrompt, false);
});
