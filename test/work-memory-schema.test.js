const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeEvent,
  normalizeThread,
  normalizeDecisionRecord,
  normalizeMemoryItem,
} = require("../src/work-memory/schema");
const { DEFAULT_QUICK_EVENTS, DEFAULT_CONFIG } = require("../src/work-memory/defaults");

test("default config uses balanced confirmation and conservative resume", () => {
  assert.equal(DEFAULT_CONFIG.confirmationBudget.mode, "balanced");
  assert.equal(DEFAULT_CONFIG.resumeSuggestion.mode, "conservative");
  assert.equal(DEFAULT_QUICK_EVENTS.length, 2);
});

test("event normalization preserves raw input and marks draft state", () => {
  const event = normalizeEvent({
    raw: "这个点别丢",
    summary: "这个点别丢",
    kind: "note",
    source: "user_input",
  }, { now: "2026-05-02T01:00:00+08:00" });

  assert.equal(event.raw, "这个点别丢");
  assert.equal(event.status, "draft");
  assert.equal(event.confidence, "explicit");
  assert.deepEqual(event.meta.threads, []);
  assert.equal(event.meta.source, "user_input");
  assert.equal(event.created_at, "2026-05-02T01:00:00+08:00");
});

test("thread normalization keeps active thread defaults", () => {
  const thread = normalizeThread({
    title: "整理包模板",
  }, { now: "2026-05-02T01:00:00+08:00" });

  assert.equal(thread.status, "active");
  assert.equal(thread.title, "整理包模板");
  assert.equal(thread.last_touched_at, "2026-05-02T01:00:00+08:00");
  assert.deepEqual(thread.related_events, []);
});

test("inferred decision records require draft status", () => {
  const decision = normalizeDecisionRecord({
    title: "先做 MCP",
    decision: "MVP 先暴露 MCP server",
    confidence: "inferred_medium",
  }, { now: "2026-05-02T01:00:00+08:00" });

  assert.equal(decision.status, "draft");
  assert.equal(decision.confidence, "inferred_medium");
  assert.deepEqual(decision.source_events, []);
});

test("memory items default to user editable and reviewable on conflict", () => {
  const memory = normalizeMemoryItem({
    type: "interaction_rules",
    summary: "专注段默认低打扰。",
  }, { now: "2026-05-02T01:00:00+08:00" });

  assert.equal(memory.user_editable, true);
  assert.equal(memory.review_policy, "on_conflict");
});
