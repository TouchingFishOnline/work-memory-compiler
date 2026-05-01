const test = require("node:test");
const assert = require("node:assert/strict");
const { WorkMemoryCaptureEngine } = require("../src/work-memory/capture-engine");
const { DEFAULT_CONFIG } = require("../src/work-memory/defaults");

function createEngine() {
  return new WorkMemoryCaptureEngine({
    config: DEFAULT_CONFIG,
    now: () => "2026-05-02T01:00:00+08:00",
  });
}

test("plain fragment becomes explicit draft note", () => {
  const result = createEngine().capture({ text: "小看板这个词不对", source: "wechat" });

  assert.equal(result.event.kind, "note");
  assert.equal(result.event.status, "draft");
  assert.equal(result.event.raw, "小看板这个词不对");
  assert.equal(result.event.meta.source, "wechat");
  assert.equal(result.reply, "记下了：小看板这个词不对");
});

test("pin emoji becomes buffered quick event", () => {
  const result = createEngine().capture({ text: "📌", source: "wechat" });

  assert.equal(result.event.kind, "quick_event");
  assert.equal(result.event.status, "buffered");
  assert.equal(result.event.summary, "这个别丢");
});

test("interruption emoji marks interruption and asks on return", () => {
  const result = createEngine().capture({ text: "🧷", source: "wechat" });

  assert.equal(result.event.kind, "interruption");
  assert.equal(result.event.meta.ask_on_return, true);
  assert.match(result.reply, /已标记/);
});
