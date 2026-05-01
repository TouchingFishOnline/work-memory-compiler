const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { WorkMemoryService } = require("../src/work-memory");
const { WorkMemoryMcpToolHost } = require("../src/work-memory/mcp-tool-host");
const { buildDashboard } = require("../src/work-memory/dashboard");

test("dashboard summarizes dirty buffer threads decisions and memory", () => {
  const dashboard = buildDashboard({
    events: [{ id: "evt_1", status: "draft" }],
    threads: [{ id: "thr_1", status: "active" }],
    decisions: [{ id: "dec_1", status: "draft" }],
    memoryItems: [{ id: "mem_1", disabled: false }],
  });

  assert.equal(dashboard.counts.dirtyItems, 1);
  assert.equal(dashboard.counts.activeThreads, 1);
  assert.equal(dashboard.counts.draftDecisions, 1);
  assert.equal(dashboard.counts.activeMemoryItems, 1);
});

test("service and mcp expose dashboard", async () => {
  const service = new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-dashboard-")),
    now: () => "2026-05-02T12:00:00+08:00",
  });
  service.capture({ text: "dashboard note" });
  const host = new WorkMemoryMcpToolHost({ service });

  assert.equal(service.dashboard().counts.dirtyItems, 1);
  const result = await host.invokeTool("work_memory_dashboard", {});
  assert.equal(result.data.counts.dirtyItems, 1);
});
