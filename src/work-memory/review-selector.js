function selectReviewInteraction({ counts = {}, hints = {} } = {}) {
  const normalizedCounts = {
    dirtyItems: nonNegativeInteger(counts.dirtyItems),
    decisionRecords: nonNegativeInteger(counts.decisionRecords),
    activeThreads: nonNegativeInteger(counts.activeThreads),
    materials: nonNegativeInteger(counts.materials),
  };
  const normalizedHints = normalizeHints(hints);

  if (
    normalizedCounts.dirtyItems > 20 ||
    normalizedCounts.activeThreads > 6 ||
    normalizedCounts.decisionRecords > 5 ||
    normalizedCounts.materials > 5 ||
    normalizedHints.multipleThreadsNeedMerge ||
    normalizedHints.userWantsDashboardOrNoteEditing
  ) {
    return result("review_ui_recommended", "review_ui_threshold", normalizedCounts, normalizedHints);
  }

  if (
    normalizedCounts.dirtyItems > 8 ||
    normalizedCounts.decisionRecords > 2 ||
    normalizedHints.longTextNeeded ||
    normalizedHints.decisionsNeedRationale ||
    normalizedHints.userWantsAnnotation
  ) {
    return result("md_roundtrip", "annotation_or_size", normalizedCounts, normalizedHints);
  }

  if (
    normalizedCounts.dirtyItems <= 8 &&
    normalizedCounts.decisionRecords <= 2 &&
    (normalizedHints.userIsOnMobile || normalizedHints.userRequestedShortSummary)
  ) {
    return result("wechat_inline", "small_mobile_review", normalizedCounts, normalizedHints);
  }

  return result("wechat_inline", "default_low_friction", normalizedCounts, normalizedHints);
}

function result(mode, reason, counts, hints) {
  return {
    mode,
    reason,
    counts,
    hints,
    startsServer: false,
  };
}

function normalizeHints(hints) {
  const input = hints && typeof hints === "object" && !Array.isArray(hints) ? hints : {};
  return {
    userIsOnMobile: Boolean(input.userIsOnMobile),
    userRequestedShortSummary: Boolean(input.userRequestedShortSummary),
    longTextNeeded: Boolean(input.longTextNeeded),
    decisionsNeedRationale: Boolean(input.decisionsNeedRationale),
    userWantsAnnotation: Boolean(input.userWantsAnnotation),
    multipleThreadsNeedMerge: Boolean(input.multipleThreadsNeedMerge),
    userWantsDashboardOrNoteEditing: Boolean(input.userWantsDashboardOrNoteEditing),
  };
}

function nonNegativeInteger(value) {
  return Number.isInteger(value) && value > 0 ? value : 0;
}

module.exports = {
  selectReviewInteraction,
};
