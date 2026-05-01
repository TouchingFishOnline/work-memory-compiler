const { WorkMemoryCaptureEngine } = require("./capture-engine");
const { applyCommitDecisions, buildAgentExport } = require("./commit-engine");
const { buildDecisionPatch } = require("./decision-patch");
const { WorkMemoryJsonStore } = require("./json-store");
const { buildEditableReviewMarkdown, parseEditedReviewMarkdown } = require("./markdown-roundtrip");
const { applyMemoryReviewOperation } = require("./memory-review");
const { buildResumeSuggestion } = require("./resume-engine");
const { buildReviewPackMarkdown, buildThreadSnapshot } = require("./review-pack");
const { evaluateReviewSchedule } = require("./review-schedule");
const { selectReviewInteraction } = require("./review-selector");
const { evaluateReviewTrigger } = require("./review-trigger");
const { normalizeEvent } = require("./schema");
const { dateKeyFromIso, resolveNow } = require("./time");

class WorkMemoryService {
  constructor(options = {}) {
    this.now = options.now;
    this.store = options.store || new WorkMemoryJsonStore({ stateDir: options.stateDir });
    this.store.ensure();
  }

  capture({ text, source, eventTime, meta } = {}) {
    const engine = new WorkMemoryCaptureEngine({
      config: this.getConfig(),
      now: this.now,
    });
    const result = engine.capture({ text, source });
    const event = normalizeEvent({
      ...result.event,
      event_time: eventTime === undefined ? result.event.event_time : eventTime,
      meta: mergePlainObjects(result.event.meta, meta),
      source,
    }, { now: this.now });

    this.store.appendEvent(event);
    return {
      ...result,
      event,
    };
  }

  threadSnapshot({ since, limit } = {}) {
    const events = filterEvents(this.store.listEvents(), { since, limit });
    const snapshot = buildThreadSnapshot({
      events,
      threads: this.store.listThreads(),
      now: resolveNow({ now: this.now }),
    });
    return snapshot;
  }

  reviewPack({ date, format } = {}) {
    const events = filterEventsByDate(this.store.listEvents(), date);
    const markdown = buildReviewPackMarkdown({
      title: date ? `${date} 整理包` : "整理包",
      events,
      decisions: this.store.listDecisions(),
      memoryItems: this.store.listMemoryItems(),
      format,
    });
    return { markdown };
  }

  reviewTriggerStatus({ lastReviewCheckAt } = {}) {
    return evaluateReviewTrigger({
      config: this.getConfig(),
      events: this.store.listEvents(),
      threads: this.store.listThreads(),
      now: resolveNow({ now: this.now }),
      lastReviewCheckAt,
    });
  }

  reviewScheduleStatus({ lastReviewAt } = {}) {
    return evaluateReviewSchedule({
      config: this.getConfig(),
      now: resolveNow({ now: this.now }),
      lastReviewAt,
    });
  }

  reviewSelectMode({ counts, hints } = {}) {
    return selectReviewInteraction({
      counts: counts || buildReviewCounts({
        events: this.store.listEvents(),
        decisions: this.store.listDecisions(),
        threads: this.store.listThreads(),
      }),
      hints,
    });
  }

  exportEditableMarkdown({ date } = {}) {
    return {
      markdown: buildEditableReviewMarkdown({
        events: filterEventsByDate(this.store.listEvents(), date),
        decisions: this.store.listDecisions(),
        memoryItems: this.store.listMemoryItems(),
      }),
    };
  }

  applyEditedMarkdown({ markdown } = {}) {
    const operations = parseEditedReviewMarkdown(markdown);
    const eventDecisions = operations
      .filter((operation) => operation.targetType === "event")
      .map((operation) => ({
        eventId: operation.targetId,
        action: operation.action,
        note: operation.note,
      }));
    const memoryOperations = operations
      .filter((operation) => operation.targetType === "memory")
      .map((operation) => ({
        action: markdownActionToMemoryAction(operation.action),
        memoryId: operation.targetId,
        summary: operation.note,
      }));
    const unsupportedOperations = operations.filter((operation) => operation.targetType === "decision");
    const applied = [];
    const unknown = [];
    let events = this.store.listEvents();
    if (eventDecisions.length > 0) {
      const result = applyCommitDecisions({ events, decisions: eventDecisions });
      events = mergeEventReviewNotes(result.events, eventDecisions);
      this.store.replaceEvents(events);
      applied.push(...result.applied.map((decision) => ({
        targetType: "event",
        targetId: decision.eventId,
        action: decision.action,
        note: decision.note || "",
      })));
      unknown.push(...result.unknown.map((decision) => ({
        targetType: "event",
        targetId: decision.eventId,
        action: decision.action,
        note: decision.note || "",
      })));
    }
    let memoryItems = this.store.listMemoryItems();
    for (const operation of memoryOperations) {
      try {
        const result = applyMemoryReviewOperation({
          memoryItems,
          operation,
          now: resolveNow({ now: this.now }),
        });
        memoryItems = result.memoryItems;
        applied.push(...result.applied.map((item) => ({
          targetType: "memory",
          targetId: item.memoryId,
          action: item.action,
          note: "",
        })));
      } catch (error) {
        unknown.push({
          targetType: "memory",
          targetId: operation.memoryId,
          action: operation.action,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    if (memoryOperations.length > 0) {
      this.store.replaceMemoryItems(memoryItems);
    }
    unknown.push(...unsupportedOperations);
    return {
      operations,
      applied,
      unknown,
    };
  }

  resume({ mode, since } = {}) {
    const config = this.getConfig();
    return buildResumeSuggestion({
      mode: mode || config.resumeSuggestion?.mode || "conservative",
      events: filterEvents(this.store.listEvents(), { since, limit: 20 }),
      threads: this.store.listThreads(),
    });
  }

  createDecisionPatch({ decisionId, material } = {}) {
    const decision = this.store.listDecisions().find((item) => item.id === decisionId);
    if (!decision) {
      throw new Error(`Decision not found: ${decisionId}`);
    }
    const patch = buildDecisionPatch({
      decision,
      material,
      now: resolveNow({ now: this.now }),
    });
    this.store.appendDecisionPatch(patch);
    return { patch };
  }

  reviewMemory({ operation } = {}) {
    const result = applyMemoryReviewOperation({
      memoryItems: this.store.listMemoryItems(),
      operation,
      now: resolveNow({ now: this.now }),
    });
    this.store.replaceMemoryItems(result.memoryItems);
    return result;
  }

  commit({ decisions } = {}) {
    const result = applyCommitDecisions({
      events: this.store.listEvents(),
      decisions,
    });
    this.store.replaceEvents(result.events);
    return result;
  }

  exportAgentReadable() {
    const events = this.store.listEvents();
    const threads = this.store.listThreads();
    const decisions = this.store.listDecisions();
    const decisionPatches = this.store.listDecisionPatches ? this.store.listDecisionPatches() : [];
    const memoryItems = this.store.listMemoryItems();
    return buildAgentExport({
      events,
      threads,
      dirtyBuffer: events.filter(isDirtyBufferEvent),
      confirmedRecords: events.filter((event) => event.status === "committed"),
      decisions,
      decisionPatches,
      openLoops: collectOpenLoops(threads),
      reminders: collectReminders(events),
      memoryItems,
    });
  }

  getConfig() {
    return this.store.readConfig();
  }

  setConfig(patch) {
    const nextConfig = deepMerge(this.getConfig(), patch);
    return this.store.writeConfig(nextConfig);
  }
}

function buildReviewCounts({ events, decisions, threads }) {
  const eventList = Array.isArray(events) ? events : [];
  return {
    dirtyItems: eventList.filter(isDirtyBufferEvent).length,
    decisionRecords: Array.isArray(decisions) ? decisions.length : 0,
    activeThreads: (Array.isArray(threads) ? threads : []).filter((thread) => ["active", "waiting", "ready_to_resume", "needs_clarification"].includes(thread.status)).length,
  };
}

function mergeEventReviewNotes(events, decisions) {
  const notesById = new Map(decisions.filter((decision) => decision.note).map((decision) => [decision.eventId, decision.note]));
  return events.map((event) => {
    const note = notesById.get(event.id);
    if (!note) {
      return event;
    }
    return {
      ...event,
      meta: {
        ...(event.meta && typeof event.meta === "object" ? event.meta : {}),
        review_note: note,
      },
    };
  });
}

function markdownActionToMemoryAction(action) {
  if (action === "keep_draft") {
    return "list";
  }
  if (action === "ignore") {
    return "disable";
  }
  if (action === "confirm") {
    return "enable";
  }
  return action;
}

function filterEvents(events, { since, limit } = {}) {
  let nextEvents = Array.isArray(events) ? events.slice() : [];
  if (typeof since === "string" && since.trim()) {
    nextEvents = nextEvents.filter((event) => eventSortTime(event) >= since.trim());
  }
  if (Number.isInteger(limit) && limit >= 0) {
    nextEvents = nextEvents.slice(-limit);
  }
  return nextEvents;
}

function filterEventsByDate(events, date) {
  const dateText = typeof date === "string" ? date.trim() : "";
  if (!dateText) {
    return Array.isArray(events) ? events : [];
  }
  return (Array.isArray(events) ? events : []).filter((event) => dateKeyFromIso(eventSortTime(event)) === dateText);
}

function eventSortTime(event = {}) {
  return event.event_time || event.created_at || "";
}

function isDirtyBufferEvent(event = {}) {
  return ["buffered", "draft", "needs_clarification"].includes(event.status);
}

function collectOpenLoops(threads) {
  return (Array.isArray(threads) ? threads : []).flatMap((thread) => {
    const loops = Array.isArray(thread.open_loops) ? thread.open_loops : [];
    return loops.map((loop) => ({
      thread_id: thread.id,
      thread_title: thread.title,
      text: loop,
    }));
  });
}

function collectReminders(events) {
  return (Array.isArray(events) ? events : [])
    .map((event) => event.meta?.reminder ? { event_id: event.id, reminder: event.meta.reminder } : null)
    .filter(Boolean);
}

function deepMerge(base, patch) {
  if (!isPlainObject(base)) {
    return clone(patch);
  }
  if (!isPlainObject(patch)) {
    return clone(base);
  }

  const result = clone(base);
  for (const [key, value] of Object.entries(patch)) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = clone(value);
    }
  }
  return result;
}

function mergePlainObjects(base, patch) {
  if (!isPlainObject(patch)) {
    return isPlainObject(base) ? base : {};
  }
  return {
    ...(isPlainObject(base) ? base : {}),
    ...patch,
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  if (value === undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value));
}

module.exports = {
  WorkMemoryService,
};
