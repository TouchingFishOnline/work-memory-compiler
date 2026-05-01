const { DEFAULT_CONFIG, DEFAULT_QUICK_EVENTS } = require("./defaults");
const { buildDecisionPatch } = require("./decision-patch");
const {
  buildEditableReviewMarkdown,
  parseEditedReviewMarkdown,
} = require("./markdown-roundtrip");
const { applyMemoryReviewOperation } = require("./memory-review");
const { WorkMemoryService } = require("./memory-service");
const { buildResumeSuggestion } = require("./resume-engine");
const { evaluateReviewSchedule } = require("./review-schedule");
const { selectReviewInteraction } = require("./review-selector");
const { evaluateReviewTrigger } = require("./review-trigger");
const {
  normalizeDecisionRecord,
  normalizeEvent,
  normalizeMemoryItem,
  normalizeThread,
} = require("./schema");

module.exports = {
  DEFAULT_CONFIG,
  DEFAULT_QUICK_EVENTS,
  WorkMemoryService,
  applyMemoryReviewOperation,
  buildDecisionPatch,
  buildEditableReviewMarkdown,
  buildResumeSuggestion,
  evaluateReviewTrigger,
  evaluateReviewSchedule,
  normalizeDecisionRecord,
  normalizeEvent,
  normalizeMemoryItem,
  normalizeThread,
  parseEditedReviewMarkdown,
  selectReviewInteraction,
};
