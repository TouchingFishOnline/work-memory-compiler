const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { WorkMemoryService } = require("../src/work-memory");
const { WorkMemoryMcpToolHost } = require("../src/work-memory/mcp-tool-host");
const { validateCustomEventSchema } = require("../src/work-memory/custom-schema");

test("custom event schema accepts small safe field definitions", () => {
  const schema = validateCustomEventSchema({
    fields: [
      { id: "project", label: "Project", type: "string", required: false },
      { id: "risk", label: "Risk", type: "enum", options: ["low", "medium", "high"] },
    ],
  });

  assert.equal(schema.fields.length, 2);
});

test("custom event schema rejects executable or oversized fields", () => {
  assert.throws(() => validateCustomEventSchema({
    fields: [{ id: "script", label: "Script", type: "javascript" }],
  }), /unsupported field type/);
});

test("custom event schema rejects duplicate field ids", () => {
  assert.throws(() => validateCustomEventSchema({
    fields: [
      { id: "project", label: "Project", type: "string" },
      { id: "project", label: "Project Again", type: "string" },
    ],
  }), /duplicate field id/);
});

test("service and mcp expose custom schema config", async () => {
  const service = new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-schema-")),
  });
  const host = new WorkMemoryMcpToolHost({ service });

  service.setCustomEventSchema({ fields: [{ id: "project", label: "Project", type: "string" }] });
  assert.equal(service.getCustomEventSchema().fields[0].id, "project");

  const result = await host.invokeTool("work_memory_custom_schema_get", {});
  assert.equal(result.data.fields[0].id, "project");
});
