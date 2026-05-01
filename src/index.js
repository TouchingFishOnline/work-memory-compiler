async function main() {
  const argv = process.argv.slice(2);
  const command = argv[0] || "help";

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(buildWorkMemoryHelpText());
    return;
  }

  if (command === "mcp") {
    const { WorkMemoryMcpToolHost } = require("./work-memory/mcp-tool-host");
    const { runWorkMemoryMcpServer } = require("./work-memory/mcp-stdio-server");
    const service = createWorkMemoryService();
    const toolHost = new WorkMemoryMcpToolHost({ service });
    runWorkMemoryMcpServer({ toolHost });
    return;
  }

  if (command === "capture") {
    const text = readFlagValue(argv.slice(1), "--text");
    if (!text) {
      throw new Error("capture --text TEXT is required.");
    }
    const service = createWorkMemoryService();
    console.log(service.capture({ text }).reply);
    return;
  }

  if (command === "snapshot") {
    const service = createWorkMemoryService();
    console.log(service.threadSnapshot().markdown);
    return;
  }

  if (command === "review-pack") {
    const service = createWorkMemoryService();
    console.log(service.reviewPack().markdown);
    return;
  }

  if (command === "review-status") {
    const service = createWorkMemoryService();
    console.log(JSON.stringify(service.reviewTriggerStatus(), null, 2));
    return;
  }

  if (command === "schedule-status") {
    const service = createWorkMemoryService();
    console.log(JSON.stringify(service.reviewScheduleStatus(), null, 2));
    return;
  }

  if (command === "review-select-mode") {
    const service = createWorkMemoryService();
    console.log(JSON.stringify(service.reviewSelectMode(), null, 2));
    return;
  }

  if (command === "md-export") {
    const service = createWorkMemoryService();
    console.log(service.exportEditableMarkdown().markdown);
    return;
  }

  if (command === "md-apply") {
    const file = readFlagValue(argv.slice(1), "--file");
    if (!file) {
      throw new Error("md-apply --file PATH is required.");
    }
    const fs = require("node:fs");
    const service = createWorkMemoryService();
    console.log(JSON.stringify(service.applyEditedMarkdown({ markdown: fs.readFileSync(file, "utf8") }), null, 2));
    return;
  }

  if (command === "resume") {
    const service = createWorkMemoryService();
    console.log(service.resume().markdown);
    return;
  }

  if (command === "memory-list") {
    const service = createWorkMemoryService();
    console.log(JSON.stringify(service.reviewMemory({ operation: { action: "list" } }).memoryItems, null, 2));
    return;
  }

  if (command === "memory-update") {
    const id = readFlagValue(argv.slice(1), "--id");
    const summary = readFlagValue(argv.slice(1), "--summary");
    const service = createWorkMemoryService();
    console.log(JSON.stringify(service.reviewMemory({ operation: { action: "update", memoryId: id, summary } }), null, 2));
    return;
  }

  if (command === "memory-disable" || command === "memory-delete") {
    const id = readFlagValue(argv.slice(1), "--id");
    const service = createWorkMemoryService();
    const action = command === "memory-disable" ? "disable" : "delete";
    console.log(JSON.stringify(service.reviewMemory({ operation: { action, memoryId: id } }), null, 2));
    return;
  }

  if (command === "export") {
    const service = createWorkMemoryService();
    console.log(JSON.stringify(service.exportAgentReadable(), null, 2));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function buildWorkMemoryHelpText() {
  return [
    "Work Memory Compiler",
    "",
    "Commands:",
    "  help                 Show this help.",
    "  mcp                  Start the standalone MCP server.",
    "  capture --text TEXT  Capture a low-friction memory fragment.",
    "  snapshot             Print a lightweight thread snapshot.",
    "  review-pack          Print a markdown review pack.",
    "  review-status        Print confirmation-budget review status.",
    "  schedule-status      Print periodic review schedule status.",
    "  review-select-mode   Print recommended review interaction mode.",
    "  md-export            Print editable review markdown.",
    "  md-apply --file PATH Apply edited review markdown.",
    "  resume               Print conservative resume context.",
    "  memory-list          Print long-term memory items.",
    "  export               Print agent-readable JSON.",
  ].join("\n");
}

function createWorkMemoryService() {
  const { WorkMemoryService } = require("./work-memory");
  return new WorkMemoryService({
    stateDir: process.env.WORK_MEMORY_COMPILER_STATE_DIR,
  });
}

function readFlagValue(args, flag) {
  if (!Array.isArray(args)) {
    return "";
  }
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === flag) {
      return String(args[index + 1] || "").trim();
    }
  }
  return "";
}

module.exports = { main };
