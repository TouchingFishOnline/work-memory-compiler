function buildDashboard({
  events = [],
  threads = [],
  decisions = [],
  memoryItems = [],
  reviewStatus = {},
  scheduleStatus = {},
  agentExport = {},
} = {}) {
  const eventList = Array.isArray(events) ? events : [];
  const threadList = Array.isArray(threads) ? threads : [];
  const decisionList = Array.isArray(decisions) ? decisions : [];
  const memoryList = Array.isArray(memoryItems) ? memoryItems : [];
  return {
    counts: {
      dirtyItems: eventList.filter((event) => ["buffered", "draft", "needs_clarification"].includes(event.status)).length,
      activeThreads: threadList.filter((thread) => ["active", "waiting", "ready_to_resume", "needs_clarification"].includes(thread.status)).length,
      draftDecisions: decisionList.filter((decision) => ["draft", "needs_clarification"].includes(decision.status || "draft")).length,
      activeMemoryItems: memoryList.filter((memory) => !memory.disabled).length,
    },
    reviewStatus,
    scheduleStatus,
    openLoops: collectOpenLoops(threadList),
    recentEvents: eventList.slice(-10),
    agentExport,
  };
}

function collectOpenLoops(threads) {
  return threads.flatMap((thread) => (Array.isArray(thread.open_loops) ? thread.open_loops : []).map((loop) => ({
    thread_id: thread.id,
    thread_title: thread.title,
    text: loop,
  })));
}

module.exports = {
  buildDashboard,
};
