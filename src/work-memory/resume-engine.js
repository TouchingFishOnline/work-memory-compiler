function buildResumeSuggestion({ mode = "conservative", events = [], threads = [] } = {}) {
  if (mode === "off") {
    return { enabled: false, mode, markdown: "" };
  }

  const eventList = Array.isArray(events) ? events : [];
  const threadList = Array.isArray(threads) ? threads : [];
  const latestInterruption = eventList.filter((event) => event.kind === "interruption").at(-1);
  const pending = eventList.filter((event) => ["buffered", "draft", "needs_clarification"].includes(event.status)).slice(-5);
  const activeThreads = threadList.filter((thread) => ["active", "waiting", "ready_to_resume", "needs_clarification"].includes(thread.status)).slice(0, 5);
  const lines = ["# 回来继续", "", "上次停在："];

  if (latestInterruption) {
    lines.push(`- ${latestInterruption.summary || "临时中断"}`);
  }
  for (const thread of activeThreads) {
    lines.push(`- ${thread.title}${thread.recent_summary ? `：${thread.recent_summary}` : ""}`);
  }
  for (const event of pending) {
    lines.push(`- ${event.summary || event.raw || event.id}`);
  }
  if (!latestInterruption && activeThreads.length === 0 && pending.length === 0) {
    lines.push("- 暂无可恢复的工作记忆。");
  }

  if (mode === "proactive") {
    const openLoops = activeThreads.flatMap((thread) => Array.isArray(thread.open_loops) ? thread.open_loops : []);
    if (openLoops.length > 0) {
      lines.push("", "可以从这里接：");
      for (const loop of openLoops.slice(0, 3)) {
        lines.push(`- ${loop}`);
      }
    }
  }

  return {
    enabled: true,
    mode,
    markdown: `${lines.join("\n")}\n`,
  };
}

module.exports = {
  buildResumeSuggestion,
};
