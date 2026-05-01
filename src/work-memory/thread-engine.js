function groupThreadSnapshotItems({ events = [], threads = [] } = {}) {
  const safeEvents = Array.isArray(events) ? events : [];
  const safeThreads = Array.isArray(threads) ? threads : [];
  const pendingEvents = safeEvents.filter(isPending);
  const eventsByThread = new Map();

  for (const event of safeEvents) {
    for (const threadId of getEventThreadIds(event)) {
      if (!eventsByThread.has(threadId)) {
        eventsByThread.set(threadId, []);
      }
      eventsByThread.get(threadId).push(event);
    }
  }

  return {
    threads: safeThreads.map((thread) => ({
      ...thread,
      events: eventsByThread.get(thread.id) || [],
    })),
    activeThreads: safeThreads.filter((thread) => thread.status === "active"),
    pendingThreads: safeThreads.filter(isPending),
    pendingEvents,
  };
}

function isPending(item = {}) {
  return item.status === "needs_clarification" || item.status === "pending" || item.meta?.needs_user_review === true;
}

function getEventThreadIds(event = {}) {
  const threads = event.meta?.threads;
  return Array.isArray(threads) ? threads : [];
}

module.exports = {
  groupThreadSnapshotItems,
  isPending,
};
