const { createId } = require("./id");
const { resolveNow } = require("./time");

function normalizeEvent(input = {}, options = {}) {
  const now = resolveNow(options);
  const raw = normalizeRequiredText(input.raw, "event.raw");
  const meta = normalizeMeta(input.meta, input.source);
  return {
    id: normalizeText(input.id) || createId("evt"),
    created_at: normalizeText(input.created_at) || now,
    event_time: input.event_time === undefined ? null : input.event_time,
    raw,
    kind: normalizeText(input.kind) || "note",
    summary: normalizeText(input.summary) || summarize(raw),
    status: normalizeText(input.status) || "draft",
    confidence: normalizeText(input.confidence) || "explicit",
    meta,
  };
}

function normalizeThread(input = {}, options = {}) {
  const now = resolveNow(options);
  const title = normalizeRequiredText(input.title, "thread.title");
  return {
    id: normalizeText(input.id) || createId("thr"),
    title,
    status: normalizeText(input.status) || "active",
    recent_summary: normalizeText(input.recent_summary),
    open_loops: normalizeArray(input.open_loops),
    last_touched_at: normalizeText(input.last_touched_at) || now,
    related_events: normalizeArray(input.related_events),
    confidence: normalizeText(input.confidence) || "explicit",
  };
}

function normalizeDecisionRecord(input = {}, options = {}) {
  const now = resolveNow(options);
  const title = normalizeRequiredText(input.title, "decision_record.title");
  const decision = normalizeRequiredText(input.decision, "decision_record.decision");
  return {
    id: normalizeText(input.id) || createId("dec"),
    title,
    decision,
    context: normalizeText(input.context),
    rationale: normalizeArray(input.rationale),
    alternatives_considered: normalizeArray(input.alternatives_considered),
    tradeoffs: normalizeArray(input.tradeoffs),
    confidence: normalizeText(input.confidence) || "explicit",
    status: normalizeText(input.status) || "draft",
    source_events: normalizeArray(input.source_events),
    linked_threads: normalizeArray(input.linked_threads),
    linked_materials: normalizeArray(input.linked_materials),
    followup_questions: normalizeArray(input.followup_questions),
    created_at: normalizeText(input.created_at) || now,
    updated_at: normalizeText(input.updated_at) || now,
    supersedes: input.supersedes || null,
    superseded_by: input.superseded_by || null,
  };
}

function normalizeMemoryItem(input = {}, options = {}) {
  const now = resolveNow(options);
  const summary = normalizeRequiredText(input.summary, "memory_item.summary");
  return {
    id: normalizeText(input.id) || createId("mem"),
    type: normalizeText(input.type) || "work_background",
    summary,
    source_refs: normalizeArray(input.source_refs),
    created_at: normalizeText(input.created_at) || now,
    updated_at: normalizeText(input.updated_at) || now,
    confidence: normalizeText(input.confidence) || "explicit",
    stability: normalizeText(input.stability) || "evolving",
    review_policy: normalizeText(input.review_policy) || "on_conflict",
    user_editable: input.user_editable === undefined ? true : Boolean(input.user_editable),
  };
}

function normalizeMeta(meta = {}, source) {
  const input = meta && typeof meta === "object" && !Array.isArray(meta) ? meta : {};
  return {
    threads: normalizeArray(input.threads),
    facets: normalizeArray(input.facets),
    source: normalizeText(input.source) || normalizeText(source) || "user_input",
    time_precision: normalizeText(input.time_precision) || "exact",
    evidence_refs: normalizeArray(input.evidence_refs),
    linked_events: normalizeArray(input.linked_events),
    linked_materials: normalizeArray(input.linked_materials),
    reminder: input.reminder || null,
    user_tags: normalizeArray(input.user_tags),
    needs_user_review: input.needs_user_review === undefined ? false : Boolean(input.needs_user_review),
  };
}

function summarize(raw) {
  return normalizeText(raw).split(/\r?\n/u)[0].slice(0, 120);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRequiredText(value, fieldName) {
  const text = normalizeText(value);
  if (!text) {
    throw new Error(`${fieldName} is required.`);
  }
  return text;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

module.exports = {
  normalizeDecisionRecord,
  normalizeEvent,
  normalizeMemoryItem,
  normalizeThread,
};
