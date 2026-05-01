const test = require("node:test");
const assert = require("node:assert/strict");
const { buildThreadSnapshot, buildReviewPackMarkdown } = require("../src/work-memory/review-pack");

test("thread snapshot groups active and pending items", () => {
  const snapshot = buildThreadSnapshot({
    now: "2026-05-02T01:00:00+08:00",
    events: [
      { id: "evt_1", kind: "note", summary: "整理包模板要标准版", status: "draft", meta: { threads: ["review_pack"] } },
      { id: "evt_2", kind: "question", summary: "resume suggestion 默认是否 conservative", status: "needs_clarification", meta: { threads: ["resume"] } },
    ],
    threads: [
      { id: "review_pack", title: "整理包模板", status: "active", recent_summary: "标准版优先" },
      { id: "resume", title: "回来继续", status: "needs_clarification", recent_summary: "默认值待确认" },
    ],
  });

  assert.match(snapshot.markdown, /当前线程截图/);
  assert.match(snapshot.markdown, /整理包模板/);
  assert.match(snapshot.markdown, /待确认/);
});

test("review pack distinguishes facts guesses pending and discard candidates", () => {
  const pack = buildReviewPackMarkdown({
    title: "今日整理包",
    events: [
      { id: "evt_1", summary: "字段少，维度多", status: "draft", confidence: "explicit", kind: "note", meta: {} },
      { id: "evt_2", summary: "可能和 PLA 有关", status: "needs_clarification", confidence: "inferred_low", kind: "observation", meta: {} },
    ],
    decisions: [],
    memoryItems: [],
  });

  assert.match(pack, /## 已记录事实/);
  assert.match(pack, /## 待确认/);
  assert.match(pack, /字段少，维度多/);
});
