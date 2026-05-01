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
