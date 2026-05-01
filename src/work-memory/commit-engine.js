const ACTION_STATUSES = {
  confirm: "committed",
  ignore: "ignored",
  discard_candidate: "discarded_candidate",
  needs_clarification: "needs_clarification",
};

function applyCommitDecisions({ events = [], decisions = [] } = {}) {
  const nextEvents = Array.isArray(events) ? events.map((event) => ({ ...event })) : [];
  const eventIndexes = new Map(nextEvents.map((event, index) => [event.id, index]));
  const applied = [];
  const unknown = [];

  for (const decision of Array.isArray(decisions) ? decisions : []) {
    const eventIndex = eventIndexes.get(decision.eventId);
    if (eventIndex === undefined || !isSupportedAction(decision.action)) {
      unknown.push(decision);
      continue;
    }

    if (decision.action === "keep_draft") {
      nextEvents[eventIndex] = { ...nextEvents[eventIndex], status: "draft" };
    } else {
      nextEvents[eventIndex] = { ...nextEvents[eventIndex], status: ACTION_STATUSES[decision.action] };
    }
    applied.push(decision);
  }

  return {
    events: nextEvents,
    applied,
    unknown,
  };
}

function buildAgentExport({
  events = [],
  threads = [],
  dirtyBuffer = [],
  confirmedRecords = [],
  decisions = [],
  decisionPatches = [],
  openLoops = [],
  reminders = [],
  memoryItems = [],
} = {}) {
  return {
    events,
    threads,
    dirty_buffer: dirtyBuffer,
    confirmed_records: confirmedRecords,
    decisions,
    decision_patches: decisionPatches,
    open_loops: openLoops,
    reminders,
    memory_items: memoryItems,
  };
}

function isSupportedAction(action) {
  return action === "keep_draft" || Object.prototype.hasOwnProperty.call(ACTION_STATUSES, action);
}

module.exports = {
  applyCommitDecisions,
  buildAgentExport,
};
