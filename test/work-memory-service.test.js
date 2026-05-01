const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { WorkMemoryService } = require("../src/work-memory");

test("service captures stores snapshots and exports", () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "wmc-service-"));
  const service = new WorkMemoryService({
    stateDir,
    now: () => "2026-05-02T01:00:00+08:00",
  });

  const capture = service.capture({ text: "这个点别丢", source: "wechat" });
  const snapshot = service.threadSnapshot();
  const exported = service.exportAgentReadable();

  assert.equal(capture.event.raw, "这个点别丢");
  assert.match(snapshot.markdown, /当前线程截图/);
  assert.equal(exported.events.length, 1);
});
