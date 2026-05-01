const { DEFAULT_CONFIG } = require("./defaults");
const { normalizeEvent } = require("./schema");

class WorkMemoryCaptureEngine {
  constructor(options = {}) {
    this.config = options.config || DEFAULT_CONFIG;
    this.now = options.now;
  }

  capture(input = {}) {
    const raw = normalizeText(input.text);
    if (!raw) {
      throw new Error("capture.text is required.");
    }

    const quickEvent = findQuickEvent(this.config, raw);
    if (quickEvent) {
      return this.captureQuickEvent({ quickEvent, raw, source: input.source });
    }

    const summary = summarize(raw);
    const event = normalizeEvent({
      raw,
      summary,
      kind: "note",
      status: "draft",
      confidence: "explicit",
      source: input.source,
    }, { now: this.now });

    return {
      event,
      reply: `记下了：${summary}`,
    };
  }

  captureQuickEvent({ quickEvent, raw, source }) {
    const event = normalizeEvent({
      raw,
      summary: quickEvent.name,
      kind: quickEvent.eventKind,
      status: "buffered",
      confidence: "explicit",
      source,
    }, { now: this.now });

    if (quickEvent.askOnReturn) {
      event.meta.ask_on_return = true;
    }

    return {
      event,
      reply: quickEvent.askOnReturn ? `已标记：${quickEvent.name}` : `已缓冲：${quickEvent.name}`,
    };
  }
}

function findQuickEvent(config, text) {
  const definitions = config?.quickEvents?.definitions || [];
  return definitions.find((definition) => {
    const emojis = Array.isArray(definition.emojis) ? definition.emojis : [];
    return emojis.includes(text);
  });
}

function summarize(raw) {
  const firstLine = normalizeText(raw).split(/\r?\n/u)[0];
  return Array.from(firstLine).slice(0, 80).join("");
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

module.exports = {
  WorkMemoryCaptureEngine,
};
