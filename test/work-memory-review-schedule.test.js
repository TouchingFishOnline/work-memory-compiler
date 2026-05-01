const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DEFAULT_CONFIG, WorkMemoryService } = require("../src/work-memory");
const { WorkMemoryMcpToolHost } = require("../src/work-memory/mcp-tool-host");
const { evaluateReviewSchedule } = require("../src/work-memory/review-schedule");

test("default review schedule enables daily pack and disables weekly pack", () => {
  assert.equal(DEFAULT_CONFIG.reviewSchedule.dailyPack.enabled, true);
  assert.equal(DEFAULT_CONFIG.reviewSchedule.dailyPack.time, "22:30");
  assert.equal(DEFAULT_CONFIG.reviewSchedule.weeklyPack.enabled, false);
});

test("daily schedule is due after configured local time", () => {
  const result = evaluateReviewSchedule({
    config: DEFAULT_CONFIG,
    now: "2026-05-02T22:45:00+08:00",
    lastReviewAt: null,
  });

  assert.equal(result.due, true);
  assert.equal(result.kind, "daily_pack");
  assert.equal(result.output, "daily_pack");
  assert.equal(result.format, "short");
});

test("daily schedule is not due twice on same date", () => {
  const result = evaluateReviewSchedule({
    config: DEFAULT_CONFIG,
    now: "2026-05-02T23:00:00+08:00",
    lastReviewAt: "2026-05-02T22:45:00+08:00",
  });

  assert.equal(result.due, false);
  assert.equal(result.reason, "already_reviewed_today");
});

test("weekly schedule is due on configured day", () => {
  const result = evaluateReviewSchedule({
    config: {
      ...DEFAULT_CONFIG,
      reviewSchedule: {
        dailyPack: { enabled: false, time: "22:30", format: "short" },
        weeklyPack: { enabled: true, day: "Saturday", time: "16:00", format: "thread_review" },
      },
    },
    now: "2026-05-02T16:30:00+08:00",
  });

  assert.equal(result.due, true);
  assert.equal(result.kind, "weekly_pack");
  assert.equal(result.format, "thread_review");
});

test("service and mcp expose schedule status", async () => {
  const service = new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-schedule-")),
    now: () => "2026-05-02T22:45:00+08:00",
  });
  const host = new WorkMemoryMcpToolHost({ service });

  assert.equal(service.reviewScheduleStatus().due, true);
  assert.ok(host.listTools().some((tool) => tool.name === "work_memory_schedule_status"));

  const result = await host.invokeTool("work_memory_schedule_status", {});
  assert.equal(result.data.due, true);
});
