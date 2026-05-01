const DEFAULT_QUICK_EVENTS = [
  {
    id: "quick_interruption",
    name: "临时中断",
    description: "Mark a temporary interruption and ask on return.",
    emojis: ["🧷"],
    maxEmojis: 3,
    eventKind: "interruption",
    defaultAction: "mark_interruption",
    askOnReturn: true,
    requireConfirmation: false,
  },
  {
    id: "quick_pin",
    name: "这个别丢",
    description: "Capture a fragment into the dirty buffer.",
    emojis: ["📌"],
    maxEmojis: 3,
    eventKind: "quick_event",
    defaultAction: "buffer",
    askOnReturn: false,
    requireConfirmation: false,
  },
];

const DEFAULT_CONFIG = {
  confirmationBudget: {
    mode: "balanced",
    maxChecksPerFocusBlock: 1,
    minIntervalMinutes: 60,
    threadCountThreshold: 5,
    dirtyItemThreshold: 8,
    allowRiskTriggeredCheck: true,
  },
  resumeSuggestion: { mode: "conservative" },
  quickEvents: {
    maxTotalEvents: 8,
    maxEmojisPerEvent: 3,
    definitions: DEFAULT_QUICK_EVENTS,
  },
  reviewPackTemplate: { preset: "standard", customSections: [] },
  longTermMemory: {
    enabled: true,
    defaultWritePolicy: "confirmed_only",
    allowInferredMemory: true,
    inferredMemoryRequiresReview: true,
    memoryReviewInterval: "monthly",
    userCanDelete: true,
    conflictPolicy: "ask_user",
  },
};

module.exports = {
  DEFAULT_CONFIG,
  DEFAULT_QUICK_EVENTS,
};
