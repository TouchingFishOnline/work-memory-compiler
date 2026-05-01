const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { WorkMemoryService } = require("../src/work-memory");
const {
  buildEditableReviewMarkdown,
  parseEditedReviewMarkdown,
} = require("../src/work-memory/markdown-roundtrip");

test("editable markdown includes stable operation markers", () => {
  const markdown = buildEditableReviewMarkdown({
    events: [{ id: "evt_1", summary: "字段少，维度多", status: "draft" }],
    decisions: [],
    memoryItems: [],
  });

  assert.match(markdown, /<!-- wmc:event id="evt_1" -->/);
  assert.match(markdown, /action: keep_draft/);
});

test("edited markdown parses user review operations", () => {
  const operations = parseEditedReviewMarkdown(`
<!-- wmc:event id="evt_1" -->
action: confirm
note: 这个可以进长期上下文
`);

  assert.deepEqual(operations, [{
    targetType: "event",
    targetId: "evt_1",
    action: "confirm",
    note: "这个可以进长期上下文",
  }]);
});

test("service applies edited event markdown to stored events", () => {
  const service = new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-md-")),
    now: () => "2026-05-02T12:00:00+08:00",
  });
  const capture = service.capture({ text: "字段少，维度多" });

  const markdown = `<!-- wmc:event id="${capture.event.id}" -->\naction: confirm\nnote: 可以确认\n`;
  const result = service.applyEditedMarkdown({ markdown });

  assert.equal(result.applied.length, 1);
  assert.equal(service.store.listEvents()[0].status, "committed");
  assert.equal(service.store.listEvents()[0].meta.review_note, "可以确认");
});
