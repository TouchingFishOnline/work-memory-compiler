function applyMemoryReviewOperation({ memoryItems = [], operation = {}, now } = {}) {
  const timestamp = typeof now === "string" && now.trim() ? now.trim() : new Date().toISOString();
  const items = (Array.isArray(memoryItems) ? memoryItems : []).map((item) => ({ ...item }));
  const action = operation.action || "list";

  if (action === "list") {
    return { memoryItems: items, applied: [] };
  }

  const memoryId = operation.memoryId || operation.id;
  const index = items.findIndex((item) => item.id === memoryId);
  if (index < 0) {
    throw new Error(`Memory item not found: ${memoryId}`);
  }

  const applied = [{ action, memoryId }];
  if (action === "delete") {
    items.splice(index, 1);
    return { memoryItems: items, applied };
  }

  const current = items[index];
  if (action === "update") {
    items[index] = {
      ...current,
      summary: typeof operation.summary === "string" && operation.summary.trim() ? operation.summary.trim() : current.summary,
      updated_at: timestamp,
    };
  } else if (action === "disable") {
    items[index] = { ...current, disabled: true, updated_at: timestamp };
  } else if (action === "enable") {
    items[index] = { ...current, disabled: false, updated_at: timestamp };
  } else {
    throw new Error(`Unsupported memory review action: ${action}`);
  }
  return { memoryItems: items, applied };
}

module.exports = {
  applyMemoryReviewOperation,
};
