const { WorkMemoryCaptureEngine } = require("./capture-engine");
const { applyCommitDecisions, buildAgentExport } = require("./commit-engine");
const { WorkMemoryJsonStore } = require("./json-store");
const { buildReviewPackMarkdown, buildThreadSnapshot } = require("./review-pack");
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
    const memoryItems = this.store.listMemoryItems();
    return buildAgentExport({
      events,
      threads,
      dirtyBuffer: events.filter(isDirtyBufferEvent),
      confirmedRecords: events.filter((event) => event.status === "committed"),
      decisions,
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
