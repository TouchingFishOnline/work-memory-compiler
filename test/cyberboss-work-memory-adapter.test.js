const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createCyberbossWorkMemoryAdapter } = require("../src/integrations/cyberboss/work-memory-adapter");

test("cyberboss adapter exposes prefixed work memory tools", async () => {
  const adapter = createCyberbossWorkMemoryAdapter({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-cyberboss-")),
    now: () => "2026-05-02T01:00:00+08:00",
  });
  const names = adapter.listTools().map((tool) => tool.name);

  assert.ok(names.includes("cyberboss_work_memory_capture"));
  assert.ok(names.includes("cyberboss_work_memory_review_status"));

  const result = await adapter.invokeTool("cyberboss_work_memory_capture", {
    text: "小看板这个词不对",
    source: "wechat",
  });

  assert.match(result.text, /记下了/);
});
