const { DEFAULT_CONFIG, DEFAULT_QUICK_EVENTS } = require("./defaults");
const { WorkMemoryService } = require("./memory-service");
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
  evaluateReviewTrigger,
  normalizeDecisionRecord,
  normalizeEvent,
  normalizeMemoryItem,
  normalizeThread,
};
