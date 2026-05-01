const { groupThreadSnapshotItems, isPending } = require("./thread-engine");

function buildThreadSnapshot(input = {}) {
  const grouped = groupThreadSnapshotItems(input);
  const lines = ["# 当前线程截图"];

  if (normalizeText(input.now)) {
    lines.push("", `生成时间：${normalizeText(input.now)}`);
  }

  lines.push("", "## 活跃线程");
  appendThreadLines(lines, grouped.activeThreads, grouped.threads);

  lines.push("", "## 待确认");
  appendThreadLines(lines, grouped.pendingThreads, grouped.threads);
  appendEventLines(lines, grouped.pendingEvents);

  return {
    markdown: lines.join("\n"),
    threads: grouped.threads,
    pendingEvents: grouped.pendingEvents,
  };
}

function buildReviewPackMarkdown(input = {}) {
  const title = normalizeText(input.title) || "整理包";
  const events = Array.isArray(input.events) ? input.events : [];
  const decisions = Array.isArray(input.decisions) ? input.decisions : [];
  const memoryItems = Array.isArray(input.memoryItems) ? input.memoryItems : [];
  const facts = events.filter(isExplicitFact);
  const guesses = events.filter(isGuess);
  const pending = events.filter(isPending);
  const discardCandidates = events.filter(isDiscardCandidate);
  const lines = [`# ${title}`];

  appendSection(lines, "已记录事实", facts, formatEventLine);
  appendSection(lines, "推测", guesses, formatEventLine);
  appendSection(lines, "待确认", pending, formatEventLine);
  appendSection(lines, "可丢弃候选", discardCandidates, formatEventLine);

  if (decisions.length > 0) {
    appendSection(lines, "决策记录", decisions, formatDecisionLine);
  }

  if (memoryItems.length > 0) {
    appendSection(lines, "长期记忆", memoryItems, formatMemoryLine);
  }

  return lines.join("\n");
}

function appendThreadLines(lines, threads, hydratedThreads) {
  if (threads.length === 0) {
    lines.push("- 无");
    return;
  }

  const byId = new Map(hydratedThreads.map((thread) => [thread.id, thread]));
  for (const thread of threads) {
    const hydrated = byId.get(thread.id) || thread;
    const status = formatStatus(thread.status);
    const summary = normalizeText(thread.recent_summary);
    const suffix = summary ? `：${summary}` : "";
    lines.push(`- ${thread.title}（${status}）${suffix}`);
    appendEventLines(lines, hydrated.events || [], "  ");
  }
}

function appendEventLines(lines, events, indent = "") {
  for (const event of events) {
    lines.push(`${indent}- ${formatEventLine(event)}`);
  }
}

function appendSection(lines, title, items, formatter) {
  lines.push("", `## ${title}`);
  if (items.length === 0) {
    lines.push("- 无");
    return;
  }
  for (const item of items) {
    lines.push(`- ${formatter(item)}`);
  }
}

function formatEventLine(event = {}) {
  const summary = normalizeText(event.summary) || normalizeText(event.raw) || normalizeText(event.id) || "未命名事件";
  const status = formatStatus(event.status);
  const id = normalizeText(event.id);
  const suffix = id ? ` [${id}]` : "";
  return `${summary}（${status}）${suffix}`;
}

function formatDecisionLine(decision = {}) {
  const title = normalizeText(decision.title);
  const text = normalizeText(decision.decision) || title || normalizeText(decision.id) || "未命名决策";
  const prefix = title && text !== title ? `${title}：` : "";
  return `${prefix}${text}（${formatStatus(decision.status)}）`;
}

function formatMemoryLine(memoryItem = {}) {
  const summary = normalizeText(memoryItem.summary) || normalizeText(memoryItem.id) || "未命名记忆";
  return `${summary}（${formatStatus(memoryItem.status || memoryItem.review_policy)}）`;
}

function isExplicitFact(event = {}) {
  return normalizeText(event.confidence) === "explicit" && !isPending(event) && !isDiscardCandidate(event);
}

function isGuess(event = {}) {
  return normalizeText(event.confidence).startsWith("inferred");
}

function isDiscardCandidate(event = {}) {
  return ["discard_candidate", "ignored", "ignore"].includes(normalizeText(event.status));
}

function formatStatus(status) {
  const value = normalizeText(status);
  const labels = {
    active: "活跃",
    buffered: "缓冲中",
    committed: "已确认",
    discard_candidate: "可丢弃",
    draft: "草稿",
    ignored: "已忽略",
    ignore: "已忽略",
    needs_clarification: "待确认",
    on_conflict: "冲突时复核",
    pending: "待处理",
  };
  return labels[value] || value || "未标记";
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

module.exports = {
  buildReviewPackMarkdown,
  buildThreadSnapshot,
};
