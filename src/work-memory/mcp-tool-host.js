class WorkMemoryMcpToolHost {
  constructor({ service } = {}) {
    this.service = service;
  }

  listTools() {
    return TOOL_CATALOG.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  async invokeTool(toolName, args = {}) {
    const tool = TOOL_HANDLERS[toolName];
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    const normalizedArgs = isPlainObject(args) ? args : {};
    const spec = TOOL_CATALOG.find((candidate) => candidate.name === toolName);
    validateSchema(spec?.inputSchema, normalizedArgs, toolName, "input");
    return tool(this.service, normalizedArgs);
  }
}

const TOOL_CATALOG = [
  {
    name: "work_memory_capture",
    description: "Capture a low-friction work memory fragment or quick-event marker.",
    inputSchema: objectSchema({
      text: {
        type: "string",
        description: "The memory fragment or quick-event marker to capture.",
      },
      source: {
        type: "string",
        description: "Optional source label, such as wechat, codex, or cli.",
      },
      eventTime: {
        type: "string",
        description: "Optional ISO-like event timestamp override.",
      },
      meta: {
        type: "object",
        description: "Optional metadata to merge onto the captured event.",
        additionalProperties: true,
      },
    }, ["text"]),
  },
  {
    name: "work_memory_thread_snapshot",
    description: "Build a markdown snapshot of active threads and pending memory events.",
    inputSchema: objectSchema({
      since: {
        type: "string",
        description: "Only include events at or after this ISO-like timestamp.",
      },
      limit: {
        type: "integer",
        minimum: 0,
        description: "Maximum number of recent events to include.",
      },
    }),
  },
  {
    name: "work_memory_review_pack",
    description: "Build a markdown review pack for organizing captured work memory.",
    inputSchema: objectSchema({
      date: {
        type: "string",
        description: "Optional YYYY-MM-DD date filter.",
      },
      format: {
        type: "string",
        description: "Optional format hint for the review pack.",
      },
    }),
  },
  {
    name: "work_memory_review_status",
    description: "Evaluate whether the dirty buffer should prompt for a lightweight review.",
    inputSchema: objectSchema({
      lastReviewCheckAt: {
        type: "string",
        description: "Optional timestamp of the previous review check.",
      },
    }),
  },
  {
    name: "work_memory_commit",
    description: "Apply review decisions to captured work memory events.",
    inputSchema: objectSchema({
      decisions: {
        type: "array",
        description: "Commit decisions keyed by eventId and action.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            eventId: { type: "string" },
            action: {
              type: "string",
              enum: ["confirm", "ignore", "discard_candidate", "needs_clarification", "keep_draft"],
            },
          },
          required: ["eventId", "action"],
        },
      },
    }),
  },
  {
    name: "work_memory_export",
    description: "Export agent-readable work memory state.",
    inputSchema: objectSchema({}),
  },
  {
    name: "work_memory_config_get",
    description: "Read the current work memory compiler configuration.",
    inputSchema: objectSchema({}),
  },
  {
    name: "work_memory_config_set",
    description: "Patch the current work memory compiler configuration.",
    inputSchema: objectSchema({
      patch: {
        type: "object",
        description: "Configuration patch to merge into the current config.",
        additionalProperties: true,
      },
    }),
  },
];

const TOOL_HANDLERS = {
  work_memory_capture(service, args) {
    const result = service.capture(args);
    return {
      text: result.reply || `Captured: ${result.event.id}`,
      data: result,
    };
  },

  work_memory_thread_snapshot(service, args) {
    const snapshot = service.threadSnapshot(args);
    return {
      text: snapshot.markdown,
      data: snapshot,
    };
  },

  work_memory_review_pack(service, args) {
    const result = service.reviewPack(args);
    return {
      text: result.markdown,
      data: result,
    };
  },

  work_memory_review_status(service, args) {
    const result = service.reviewTriggerStatus(args);
    return {
      text: result.shouldPrompt ? result.message : `Work memory review status: ${result.reason}.`,
      data: result,
    };
  },

  work_memory_commit(service, args) {
    const result = service.commit(args);
    const appliedCount = Array.isArray(result.applied) ? result.applied.length : 0;
    return {
      text: `Work memory commit applied ${appliedCount} decision${appliedCount === 1 ? "" : "s"}.`,
      data: result,
    };
  },

  work_memory_export(service) {
    return {
      text: "Work memory export ready.",
      data: service.exportAgentReadable(),
    };
  },

  work_memory_config_get(service) {
    return {
      text: "Work memory config ready.",
      data: service.getConfig(),
    };
  },

  work_memory_config_set(service, args) {
    return {
      text: "Work memory config updated.",
      data: service.setConfig(args.patch || args),
    };
  },
};

function objectSchema(properties, required = []) {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties,
  };
  if (required.length > 0) {
    schema.required = required;
  }
  return schema;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateSchema(schema, value, toolName, path) {
  if (!schema || typeof schema !== "object") {
    return;
  }
  const schemaType = schema.type;
  if (schemaType === "object") {
    if (!isPlainObject(value)) {
      throw new Error(`${toolName} ${path} must be an object.`);
    }
    const properties = isPlainObject(schema.properties) ? schema.properties : {};
    const required = Array.isArray(schema.required) ? schema.required : [];
    for (const key of required) {
      if (!(key in value)) {
        throw new Error(`${toolName} ${path}.${key} is required.`);
      }
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) {
          throw new Error(`${toolName} ${path}.${key} is not allowed.`);
        }
      }
    }
    for (const [key, propertySchema] of Object.entries(properties)) {
      if (key in value) {
        validateSchema(propertySchema, value[key], toolName, `${path}.${key}`);
      }
    }
    return;
  }
  if (schemaType === "array") {
    if (!Array.isArray(value)) {
      throw new Error(`${toolName} ${path} must be an array.`);
    }
    if (schema.items) {
      value.forEach((item, index) => validateSchema(schema.items, item, toolName, `${path}[${index}]`));
    }
    return;
  }
  if (schemaType === "string" && typeof value !== "string") {
    throw new Error(`${toolName} ${path} must be a string.`);
  }
  if (schemaType === "boolean" && typeof value !== "boolean") {
    throw new Error(`${toolName} ${path} must be a boolean.`);
  }
  if (schemaType === "integer" && !Number.isInteger(value)) {
    throw new Error(`${toolName} ${path} must be an integer.`);
  }
  if (schemaType === "number" && (typeof value !== "number" || !Number.isFinite(value))) {
    throw new Error(`${toolName} ${path} must be a number.`);
  }
}

module.exports = {
  WorkMemoryMcpToolHost,
};
