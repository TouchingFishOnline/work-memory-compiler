const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { startReviewUiServer } = require("../src/work-memory/ui-server");
const { WorkMemoryService } = require("../src/work-memory");

function createService() {
  return new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-routes-")),
    now: () => "2026-05-02T12:00:00+08:00",
  });
}

test("review queue and operation routes apply event decisions", async (t) => {
  const service = createService();
  const captured = service.capture({ text: "确认这个" });
  const server = await startReviewUiServer({ host: "127.0.0.1", port: 0, service });
  t.after(() => server.close());

  const queue = await fetch(`${server.url}/api/review-queue`).then((res) => res.json());
  assert.equal(queue.events.length, 1);

  const applied = await fetch(`${server.url}/api/review-operations`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      operations: [{ targetType: "event", targetId: captured.event.id, action: "confirm" }],
    }),
  }).then((res) => res.json());

  assert.equal(applied.applied.length, 1);
  assert.equal(service.store.listEvents()[0].status, "committed");
});

test("memory routes list and disable memory items", async (t) => {
  const service = createService();
  service.store.appendMemoryItem({ id: "mem_1", summary: "偏好 A", user_editable: true });
  const server = await startReviewUiServer({ host: "127.0.0.1", port: 0, service });
  t.after(() => server.close());

  await fetch(`${server.url}/api/memory`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "disable", memoryId: "mem_1" }),
  });

  const memory = await fetch(`${server.url}/api/memory`).then((res) => res.json());
  assert.equal(memory.items[0].disabled, true);
});

test("dashboard and custom schema routes return json", async (t) => {
  const service = createService();
  service.capture({ text: "dashboard note" });
  const server = await startReviewUiServer({ host: "127.0.0.1", port: 0, service });
  t.after(() => server.close());

  const dashboard = await fetch(`${server.url}/api/dashboard`).then((res) => res.json());
  const schema = await fetch(`${server.url}/api/custom-schema`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields: [{ id: "project", label: "Project", type: "string" }] }),
  }).then((res) => res.json());

  assert.equal(dashboard.counts.dirtyItems, 1);
  assert.equal(schema.fields[0].id, "project");
});
