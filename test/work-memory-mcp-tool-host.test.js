const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { WorkMemoryService } = require("../src/work-memory");
const { WorkMemoryMcpToolHost } = require("../src/work-memory/mcp-tool-host");

test("mcp host exposes MVP tools", () => {
  const service = new WorkMemoryService({ stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-mcp-")) });
  const host = new WorkMemoryMcpToolHost({ service });
  const names = host.listTools().map((tool) => tool.name);

  assert.deepEqual(names, [
    "work_memory_capture",
    "work_memory_thread_snapshot",
    "work_memory_review_pack",
    "work_memory_review_status",
    "work_memory_commit",
    "work_memory_export",
    "work_memory_config_get",
    "work_memory_config_set",
  ]);
});

test("mcp capture invokes service and returns compact text", async () => {
  const service = new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-mcp-")),
    now: () => "2026-05-02T01:00:00+08:00",
  });
  const host = new WorkMemoryMcpToolHost({ service });
  const result = await host.invokeTool("work_memory_capture", { text: "📌", source: "wechat" });

  assert.match(result.text, /记下|已标记|已缓冲/);
  assert.equal(result.data.event.kind, "quick_event");
});

test("mcp host validates tool input schemas", async () => {
  const service = new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-mcp-")),
  });
  const host = new WorkMemoryMcpToolHost({ service });

  await assert.rejects(async () => {
    await host.invokeTool("work_memory_capture", { text: 123 });
  }, /work_memory_capture input\.text must be a string/);

  await assert.rejects(async () => {
    await host.invokeTool("work_memory_thread_snapshot", { unexpected: true });
  }, /work_memory_thread_snapshot input\.unexpected is not allowed/);
});
