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
  reviewSchedule: {
    dailyPack: { enabled: true, time: "22:30", format: "short", output: "daily_pack" },
    weeklyPack: { enabled: false, day: "Sunday", time: "16:00", format: "thread_review", output: "weekly_thread_review" },
  },
  quickEvents: {
    maxTotalEvents: 8,
    maxEmojisPerEvent: 3,
    definitions: DEFAULT_QUICK_EVENTS,
  },
  reviewInteractionSelector: {
    wechatInlineDirtyItemLimit: 8,
    mdRoundtripDirtyItemThreshold: 8,
    reviewUiDirtyItemThreshold: 20,
  },
  reviewPackTemplate: { preset: "standard", customSections: [] },
  customEventSchema: { fields: [] },
  reviewUi: {
    host: "127.0.0.1",
    port: 37671,
    allowPublicBind: false,
  },
  decisionRecords: {
    enabled: true,
    autoDetectDecisions: true,
    requireConfirmationForInferredDecisions: true,
    allowMaterialPatches: true,
  },
  interactionModes: {
    wechatInline: true,
    mdRoundtrip: true,
    reviewUi: false,
  },
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
