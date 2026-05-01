const DIRTY_STATUSES = new Set(["buffered", "draft", "needs_clarification"]);
const ACTIVE_THREAD_STATUSES = new Set(["active", "waiting", "ready_to_resume", "needs_clarification", "stale"]);

function evaluateReviewTrigger({
  config = {},
  events = [],
  threads = [],
  now,
  lastReviewCheckAt,
} = {}) {
  const budget = normalizeBudget(config.confirmationBudget);
  const counts = countReviewInputs(events, threads);

  if (budget.mode === "silent" || budget.maxChecksPerFocusBlock === 0) {
    return buildQuietResult({ reason: "silent_mode", counts, now });
  }

  const interval = checkMinimumInterval({
    now,
    lastReviewCheckAt,
    minIntervalMinutes: budget.minIntervalMinutes,
  });
  if (!interval.allowed) {
    return {
      ...buildQuietResult({ reason: "min_interval", counts, now }),
      nextEligibleAt: interval.nextEligibleAt,
    };
  }

  const triggers = collectRiskTriggers(counts, budget);
  if (triggers.length === 0) {
    return buildQuietResult({ reason: "below_threshold", counts, now });
  }

  if (!budget.allowRiskTriggeredCheck) {
    return {
      ...buildQuietResult({ reason: "risk_trigger_disabled", counts, now }),
      triggers,
    };
  }

  return {
    shouldPrompt: true,
    reason: "risk_threshold",
    output: chooseOutput(triggers),
    message: buildPromptMessage(triggers),
    triggers,
    counts,
    evaluatedAt: normalizeNow(now),
    nextEligibleAt: null,
  };
}

function normalizeBudget(budget = {}) {
  const input = budget && typeof budget === "object" && !Array.isArray(budget) ? budget : {};
  return {
    mode: normalizeMode(input.mode),
    maxChecksPerFocusBlock: normalizeNonNegativeInteger(input.maxChecksPerFocusBlock, 1),
    minIntervalMinutes: normalizeNonNegativeInteger(input.minIntervalMinutes, 60),
    threadCountThreshold: normalizeNonNegativeInteger(input.threadCountThreshold, 5),
    dirtyItemThreshold: normalizeNonNegativeInteger(input.dirtyItemThreshold, 8),
    needsClarificationThreshold: normalizeNonNegativeInteger(input.needsClarificationThreshold, 4),
    allowRiskTriggeredCheck: input.allowRiskTriggeredCheck === undefined ? true : Boolean(input.allowRiskTriggeredCheck),
  };
}

function countReviewInputs(events, threads) {
  const eventList = Array.isArray(events) ? events : [];
  const threadList = Array.isArray(threads) ? threads : [];
  return {
    dirtyItems: eventList.filter((event) => DIRTY_STATUSES.has(event?.status)).length,
    needsClarification: eventList.filter((event) => event?.status === "needs_clarification").length,
    activeThreads: threadList.filter((thread) => ACTIVE_THREAD_STATUSES.has(thread?.status)).length,
  };
}

function collectRiskTriggers(counts, budget) {
  const triggers = [];
  if (counts.activeThreads > budget.threadCountThreshold) {
    triggers.push({
      kind: "active_thread_count",
      count: counts.activeThreads,
      threshold: budget.threadCountThreshold,
    });
  }
  if (counts.dirtyItems > budget.dirtyItemThreshold) {
    triggers.push({
      kind: "dirty_item_count",
      count: counts.dirtyItems,
      threshold: budget.dirtyItemThreshold,
    });
  }
  if (counts.needsClarification > budget.needsClarificationThreshold) {
    triggers.push({
      kind: "needs_clarification_count",
      count: counts.needsClarification,
      threshold: budget.needsClarificationThreshold,
    });
  }
  return triggers;
}

function chooseOutput(triggers) {
  const kinds = triggers.map((trigger) => trigger.kind);
  if (kinds.includes("active_thread_count") || kinds.includes("needs_clarification_count")) {
    return "review_pack";
  }
  return "thread_snapshot";
}

function buildPromptMessage(triggers) {
  const kinds = triggers.map((trigger) => trigger.kind);
  if (kinds.includes("active_thread_count")) {
    return "线程有点多了，我可以先给你一份轻量线程截图。";
  }
  if (kinds.includes("needs_clarification_count")) {
    return "待确认内容有点多了，我可以生成一份整理包。";
  }
  return "临时记录有点多了，我可以先给你一份轻量线程截图。";
}

function checkMinimumInterval({ now, lastReviewCheckAt, minIntervalMinutes }) {
  const nowDate = parseDate(now);
  const lastDate = parseDate(lastReviewCheckAt);
  if (!nowDate || !lastDate) {
    return { allowed: true, nextEligibleAt: null };
  }
  const nextDate = new Date(lastDate.getTime() + minIntervalMinutes * 60 * 1000);
  if (nowDate.getTime() >= nextDate.getTime()) {
    return { allowed: true, nextEligibleAt: null };
  }
  return {
    allowed: false,
    nextEligibleAt: formatWithOffset(nextDate, extractOffset(now) || extractOffset(lastReviewCheckAt) || "+00:00"),
  };
}

function buildQuietResult({ reason, counts, now }) {
  return {
    shouldPrompt: false,
    reason,
    output: null,
    message: "",
    triggers: [],
    counts,
    evaluatedAt: normalizeNow(now),
    nextEligibleAt: null,
  };
}

function normalizeMode(mode) {
  return ["silent", "light", "balanced", "active"].includes(mode) ? mode : "balanced";
}

function normalizeNonNegativeInteger(value, fallback) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function normalizeNow(value) {
  return typeof value === "string" && value.trim() ? value.trim() : new Date().toISOString();
}

function parseDate(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function extractOffset(value) {
  if (typeof value !== "string") {
    return "";
  }
  const match = value.match(/([+-]\d{2}:\d{2}|Z)$/u);
  if (!match) {
    return "";
  }
  return match[1] === "Z" ? "+00:00" : match[1];
}

function formatWithOffset(date, offset) {
  const sign = offset.startsWith("-") ? -1 : 1;
  const [hours, minutes] = offset.slice(1).split(":").map(Number);
  const offsetMinutes = sign * (hours * 60 + minutes);
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return `${local.toISOString().replace("Z", "")}${offset}`;
}

module.exports = {
  evaluateReviewTrigger,
};
