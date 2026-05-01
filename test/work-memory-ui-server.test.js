const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { formatHostForUrl, startReviewUiServer } = require("../src/work-memory/ui-server");
const { WorkMemoryService } = require("../src/work-memory");

function createService() {
  return new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-ui-")),
    now: () => "2026-05-02T12:00:00+08:00",
  });
}

test("review ui server serves health and index locally", async (t) => {
  const server = await startReviewUiServer({
    host: "127.0.0.1",
    port: 0,
    service: createService(),
  });
  t.after(() => server.close());

  const health = await fetch(`${server.url}/api/health`).then((res) => res.json());
  const html = await fetch(`${server.url}/`).then((res) => res.text());

  assert.equal(health.ok, true);
  assert.match(html, /Work Memory Compiler/);
  assert.match(html, /data-view="review"/);
});

test("ui server refuses non-local host unless sharing is explicitly enabled", async () => {
  await assert.rejects(async () => {
    await startReviewUiServer({
      host: "0.0.0.0",
      port: 0,
      allowPublicBind: false,
      service: createService(),
    });
  }, /public bind requires allowPublicBind/);
});

test("ui server formats ipv6 hosts for urls", () => {
  assert.equal(formatHostForUrl("::1"), "[::1]");
  assert.equal(formatHostForUrl("127.0.0.1"), "127.0.0.1");
});
