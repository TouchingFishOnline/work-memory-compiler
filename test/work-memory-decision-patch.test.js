const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { WorkMemoryService } = require("../src/work-memory");
const { buildDecisionPatch } = require("../src/work-memory/decision-patch");

test("decision patch separates material facts from proposed updates", () => {
  const patch = buildDecisionPatch({
    decision: { id: "dec_1", title: "MCP first", decision: "先做 MCP" },
    material: {
      id: "mat_1",
      title: "review note",
      text: "用户补充：Cyberboss adapter 必须可选安装。",
    },
    now: "2026-05-02T12:00:00+08:00",
  });

  assert.equal(patch.decision_id, "dec_1");
  assert.equal(patch.material_id, "mat_1");
  assert.match(patch.material_facts[0], /Cyberboss adapter/);
  assert.equal(patch.status, "draft");
});

test("service persists decision patches", () => {
  const service = new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-decision-")),
    now: () => "2026-05-02T12:00:00+08:00",
  });
  service.store.appendDecision({ id: "dec_1", title: "MCP first", decision: "先做 MCP" });

  const result = service.createDecisionPatch({
    decisionId: "dec_1",
    material: { id: "mat_1", title: "note", text: "用户补充：需要 md 往返。" },
  });

  assert.equal(result.patch.decision_id, "dec_1");
  assert.equal(service.store.listDecisionPatches().length, 1);
});
