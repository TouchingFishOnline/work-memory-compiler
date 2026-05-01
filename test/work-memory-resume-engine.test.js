const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { WorkMemoryService } = require("../src/work-memory");
const { buildResumeSuggestion } = require("../src/work-memory/resume-engine");

test("conservative resume shows facts and pending items without next-step advice", () => {
  const result = buildResumeSuggestion({
    mode: "conservative",
    events: [
      { id: "evt_1", kind: "interruption", summary: "临时中断", status: "buffered", created_at: "2026-05-02T10:00:00+08:00" },
      { id: "evt_2", kind: "note", summary: "整理包模板先标准版", status: "draft" },
    ],
    threads: [{ id: "thr_1", title: "整理包", status: "active", recent_summary: "标准版优先" }],
  });

  assert.equal(result.enabled, true);
  assert.match(result.markdown, /上次停在/);
  assert.match(result.markdown, /整理包模板先标准版/);
  assert.doesNotMatch(result.markdown, /可以从这里接/);
});

test("service exposes resume summaries", () => {
  const service = new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-resume-")),
    now: () => "2026-05-02T12:00:00+08:00",
  });
  service.capture({ text: "🧷" });
  service.capture({ text: "整理包模板先标准版" });

  const result = service.resume();

  assert.match(result.markdown, /上次停在/);
});
