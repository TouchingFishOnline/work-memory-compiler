const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { WorkMemoryService } = require("../src/work-memory");

test("service updates decision rationale and links material", () => {
  const service = new WorkMemoryService({ stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-decisions-")) });
  service.store.appendDecision({
    id: "dec_1",
    title: "MCP first",
    decision: "先做 MCP",
    rationale: [],
    linked_materials: [],
  });

  const result = service.updateDecision({
    decisionId: "dec_1",
    patch: {
      rationale: ["standalone users can install it first"],
      linked_materials: ["mat_1"],
    },
  });

  assert.deepEqual(result.decision.rationale, ["standalone users can install it first"]);
  assert.deepEqual(result.decision.linked_materials, ["mat_1"]);
});
