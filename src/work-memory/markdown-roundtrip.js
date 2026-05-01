const ALLOWED_ACTIONS = new Set(["confirm", "ignore", "keep_draft", "needs_clarification", "delete", "disable"]);

function buildEditableReviewMarkdown({ events = [], decisions = [], memoryItems = [] } = {}) {
  const lines = ["# Work Memory Review", ""];
  appendSection(lines, "Events", "event", events, (event) => [
    `summary: ${event.summary || event.raw || ""}`,
    `status: ${event.status || "draft"}`,
    "action: keep_draft",
    "note:",
  ]);
  appendSection(lines, "Decisions", "decision", decisions, (decision) => [
    `title: ${decision.title || ""}`,
    `status: ${decision.status || "draft"}`,
    "action: keep_draft",
    "note:",
  ]);
  appendSection(lines, "Memory Items", "memory", memoryItems, (memory) => [
    `summary: ${memory.summary || ""}`,
    `status: ${memory.disabled ? "disabled" : "active"}`,
    "action: keep_draft",
    "note:",
  ]);
  return `${lines.join("\n").trimEnd()}\n`;
}

function parseEditedReviewMarkdown(markdown) {
  const lines = String(markdown || "").split(/\r?\n/u);
  const operations = [];
  let current = null;
  for (const line of lines) {
    const marker = line.match(/^<!--\s*wmc:(event|decision|memory)\s+id="([^"]+)"\s*-->/u);
    if (marker) {
      pushOperation(operations, current);
      current = {
        targetType: marker[1],
        targetId: marker[2],
        action: "keep_draft",
        note: "",
      };
      continue;
    }
    if (!current) {
      continue;
    }
    const action = line.match(/^\s*action:\s*(\S+)\s*$/u);
    if (action && ALLOWED_ACTIONS.has(action[1])) {
      current.action = action[1];
      continue;
    }
    const note = line.match(/^\s*note:\s*(.*)$/u);
    if (note) {
      current.note = note[1].trim();
    }
  }
  pushOperation(operations, current);
  return operations;
}

function appendSection(lines, title, type, items, fieldsBuilder) {
  lines.push(`## ${title}`, "");
  for (const item of Array.isArray(items) ? items : []) {
    lines.push(`<!-- wmc:${type} id="${item.id}" -->`);
    for (const field of fieldsBuilder(item)) {
      lines.push(field);
    }
    lines.push("");
  }
}

function pushOperation(operations, current) {
  if (!current || !current.targetId) {
    return;
  }
  operations.push({
    targetType: current.targetType,
    targetId: current.targetId,
    action: current.action,
    note: current.note,
  });
}

module.exports = {
  buildEditableReviewMarkdown,
  parseEditedReviewMarkdown,
};
