const path = require("node:path");
const { WorkMemoryService } = require("../../work-memory");
const { WorkMemoryMcpToolHost } = require("../../work-memory/mcp-tool-host");

const WORK_MEMORY_PREFIX = "work_memory_";
const CYBERBOSS_WORK_MEMORY_PREFIX = "cyberboss_work_memory_";
const CYBERBOSS_WORK_MEMORY_TOOL_NAMES = [
  "cyberboss_work_memory_capture",
  "cyberboss_work_memory_thread_snapshot",
  "cyberboss_work_memory_review_pack",
  "cyberboss_work_memory_review_status",
  "cyberboss_work_memory_schedule_status",
  "cyberboss_work_memory_review_select_mode",
  "cyberboss_work_memory_md_export",
  "cyberboss_work_memory_md_apply",
  "cyberboss_work_memory_resume",
  "cyberboss_work_memory_decision_patch",
  "cyberboss_work_memory_memory_review",
  "cyberboss_work_memory_commit",
  "cyberboss_work_memory_export",
  "cyberboss_work_memory_config_get",
  "cyberboss_work_memory_config_set",
];

function createCyberbossWorkMemoryAdapter({ stateDir, config, now, service } = {}) {
  const resolvedService = service || new WorkMemoryService({
    stateDir: resolveStateDir({ stateDir, config }),
    now,
  });
  const host = new WorkMemoryMcpToolHost({ service: resolvedService });

  return {
    listTools() {
      return host.listTools().map((tool) => ({
        ...tool,
        name: toCyberbossToolName(tool.name),
      }));
    },

    async invokeTool(toolName, args = {}) {
      return await host.invokeTool(toWorkMemoryToolName(toolName), args);
    },
  };
}

function resolveStateDir({ stateDir, config } = {}) {
  if (isNonEmptyString(stateDir)) {
    return stateDir;
  }
  if (isNonEmptyString(process.env.WORK_MEMORY_COMPILER_STATE_DIR)) {
    return process.env.WORK_MEMORY_COMPILER_STATE_DIR;
  }
  if (isNonEmptyString(config?.workMemoryStateDir)) {
    return config.workMemoryStateDir;
  }
  if (isNonEmptyString(config?.stateDir)) {
    return path.join(config.stateDir, "work-memory");
  }
  return undefined;
}

function toCyberbossToolName(toolName) {
  if (typeof toolName === "string" && toolName.startsWith(WORK_MEMORY_PREFIX)) {
    return `${CYBERBOSS_WORK_MEMORY_PREFIX}${toolName.slice(WORK_MEMORY_PREFIX.length)}`;
  }
  return toolName;
}

function toWorkMemoryToolName(toolName) {
  if (typeof toolName === "string" && toolName.startsWith(CYBERBOSS_WORK_MEMORY_PREFIX)) {
    return `${WORK_MEMORY_PREFIX}${toolName.slice(CYBERBOSS_WORK_MEMORY_PREFIX.length)}`;
  }
  return toolName;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

module.exports = {
  CYBERBOSS_WORK_MEMORY_TOOL_NAMES,
  createCyberbossWorkMemoryAdapter,
};
