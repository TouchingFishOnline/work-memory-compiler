function applyBatchReviewOperations({
  events = [],
  threads = [],
  decisions = [],
  memoryItems = [],
  operations = [],
  now,
} = {}) {
  const timestamp = normalizeNow(now);
  const state = {
    events: cloneArray(events),
    threads: cloneArray(threads),
    decisions: cloneArray(decisions),
    memoryItems: cloneArray(memoryItems),
  };
  const applied = [];
  const unknown = [];

  for (const operation of Array.isArray(operations) ? operations : []) {
    try {
      applyOne(state, operation, timestamp);
      applied.push(operation);
    } catch (error) {
      unknown.push({
        ...operation,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    ...state,
    applied,
    unknown,
  };
}

function applyOne(state, operation, now) {
  if (!operation || typeof operation !== "object") {
    throw new Error("operation is required.");
  }
  if (operation.targetType === "event") {
    applyEventOperation(state.events, operation, now);
  } else if (operation.targetType === "thread") {
    applyThreadOperation(state.threads, operation, now);
  } else if (operation.targetType === "memory") {
    applyMemoryOperation(state.memoryItems, operation, now);
  } else if (operation.targetType === "decision") {
    applyDecisionOperation(state.decisions, operation, now);
  } else {
    throw new Error(`Unsupported target type: ${operation.targetType}`);
  }
}

function applyEventOperation(events, operation, now) {
  const event = findById(events, operation.targetId, "event");
  const meta = { ...(event.meta && typeof event.meta === "object" ? event.meta : {}) };
  if (operation.note) {
    meta.review_note = operation.note;
  }
  if (operation.action === "confirm") {
    event.status = "committed";
  } else if (operation.action === "ignore") {
    event.status = "ignored";
  } else if (operation.action === "keep_draft") {
    event.status = "draft";
  } else if (operation.action === "needs_clarification") {
    event.status = "needs_clarification";
  } else if (operation.action === "annotate") {
    meta.review_note = operation.note || meta.review_note || "";
  } else {
    throw new Error(`Unsupported event action: ${operation.action}`);
  }
  event.meta = meta;
  event.updated_at = now;
}

function applyThreadOperation(threads, operation, now) {
  const thread = findById(threads, operation.targetId, "thread");
  if (operation.action === "archive") {
    thread.status = "archived";
  } else if (operation.action === "park") {
    thread.status = "parked";
  } else if (operation.action === "merge") {
    if (operation.mergeWith === operation.targetId) {
      throw new Error("Thread cannot merge with itself.");
    }
    const otherIndex = threads.findIndex((item) => item.id === operation.mergeWith);
    if (otherIndex < 0) {
      throw new Error(`Thread not found: ${operation.mergeWith}`);
    }
    const other = threads[otherIndex];
    thread.related_events = unique([...(thread.related_events || []), ...(other.related_events || [])]);
    thread.open_loops = unique([...(thread.open_loops || []), ...(other.open_loops || [])]);
    thread.recent_summary = [thread.recent_summary, other.recent_summary].filter(Boolean).join(" / ");
    threads.splice(otherIndex, 1);
  } else {
    throw new Error(`Unsupported thread action: ${operation.action}`);
  }
  thread.updated_at = now;
}

function applyMemoryOperation(memoryItems, operation, now) {
  const memory = findById(memoryItems, operation.targetId, "memory");
  if (operation.action === "update") {
    if (typeof operation.summary === "string" && operation.summary.trim()) {
      memory.summary = operation.summary.trim();
    }
  } else if (operation.action === "delete") {
    const index = memoryItems.findIndex((item) => item.id === operation.targetId);
    memoryItems.splice(index, 1);
    return;
  } else if (operation.action === "disable") {
    memory.disabled = true;
  } else if (operation.action === "enable") {
    memory.disabled = false;
  } else {
    throw new Error(`Unsupported memory action: ${operation.action}`);
  }
  memory.updated_at = now;
}

function applyDecisionOperation(decisions, operation, now) {
  const decision = findById(decisions, operation.targetId, "decision");
  if (operation.action === "update") {
    Object.assign(decision, pickDecisionPatch(operation.patch || {}));
  } else if (operation.action === "link_material") {
    decision.linked_materials = unique([...(decision.linked_materials || []), operation.materialId].filter(Boolean));
  } else if (operation.action === "mark_superseded") {
    decision.status = "superseded";
    decision.superseded_by = operation.supersededBy || decision.superseded_by || null;
  } else {
    throw new Error(`Unsupported decision action: ${operation.action}`);
  }
  decision.updated_at = now;
}

function pickDecisionPatch(patch) {
  const allowed = new Set([
    "title",
    "decision",
    "context",
    "rationale",
    "alternatives_considered",
    "tradeoffs",
    "linked_materials",
    "followup_questions",
    "status",
  ]);
  return Object.fromEntries(Object.entries(patch).filter(([key]) => allowed.has(key)));
}

function findById(items, id, label) {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) {
    throw new Error(`${label} not found: ${id}`);
  }
  return item;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function cloneArray(items) {
  return JSON.parse(JSON.stringify(Array.isArray(items) ? items : []));
}

function normalizeNow(value) {
  return typeof value === "string" && value.trim() ? value.trim() : new Date().toISOString();
}

module.exports = {
  applyBatchReviewOperations,
  pickDecisionPatch,
};
