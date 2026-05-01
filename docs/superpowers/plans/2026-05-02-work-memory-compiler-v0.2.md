# Work Memory Compiler v0.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build v0.2 around confirmation budget, periodic review, markdown roundtrip, conservative resume, Decision Patch, and long-term memory review commands.

**Architecture:** Keep v0.2 in the existing local-first core. Add small deterministic engines under `src/work-memory/`, then expose them through `WorkMemoryService`, standalone MCP, CLI, and the Cyberboss adapter. No background daemon, UI server, or public tunnel in v0.2; all capabilities are explicit commands/tools.

**Tech Stack:** Node.js 22, CommonJS, `node:test`, JSON files, deterministic Markdown generation/parsing, MCP JSON-RPC over stdio.

---

## Current Baseline

Already implemented before this plan:

- `src/work-memory/review-trigger.js`
- `WorkMemoryService.reviewTriggerStatus()`
- MCP tool `work_memory_review_status`
- CLI command `review-status`
- Cyberboss prefixed tool `cyberboss_work_memory_review_status`

Do not redo the baseline. New work should build on it.

## File Structure

- Create `src/work-memory/review-schedule.js`: evaluate daily/weekly review schedule and next due review.
- Create `src/work-memory/review-selector.js`: choose `wechat_inline`, `md_roundtrip`, or `review_ui_recommended` from content counts and user hints.
- Create `src/work-memory/markdown-roundtrip.js`: generate editable markdown with stable markers and parse edited markdown into structured review operations.
- Create `src/work-memory/resume-engine.js`: conservative resume summary after interruption or long gap.
- Create `src/work-memory/decision-patch.js`: convert user-uploaded material notes into draft Decision Patch records linked to decisions/materials.
- Create `src/work-memory/memory-review.js`: list, update, delete, disable memory items with explicit user operations.
- Modify `src/work-memory/defaults.js`: add `reviewSchedule`, `reviewInteractionSelector`, `decisionRecords`, and `interactionModes` defaults.
- Modify `src/work-memory/schema.js`: add normalization helpers for review operations and decision patches.
- Modify `src/work-memory/json-store.js`: persist review operations and decision patches if separate files are needed.
- Modify `src/work-memory/memory-service.js`: add service methods for all v0.2 engines.
- Modify `src/work-memory/mcp-tool-host.js`: expose v0.2 tools.
- Modify `src/index.js`: expose CLI commands.
- Modify `README.md`, `docs/commands.md`, `docs/work-memory-compiler-dev-plan.md`: document v0.2.
- Add focused tests under `test/work-memory-*.test.js`.

## v0.2 Tool API

Add standalone MCP tools:

- `work_memory_schedule_status`
- `work_memory_review_select_mode`
- `work_memory_md_export`
- `work_memory_md_apply`
- `work_memory_resume`
- `work_memory_decision_patch`
- `work_memory_memory_review`

Cyberboss adapter exposes these automatically as:

- `cyberboss_work_memory_schedule_status`
- `cyberboss_work_memory_review_select_mode`
- `cyberboss_work_memory_md_export`
- `cyberboss_work_memory_md_apply`
- `cyberboss_work_memory_resume`
- `cyberboss_work_memory_decision_patch`
- `cyberboss_work_memory_memory_review`

---

### Task 1: Review Schedule Defaults And Evaluator

**Files:**
- Modify: `src/work-memory/defaults.js`
- Create: `src/work-memory/review-schedule.js`
- Modify: `src/work-memory/index.js`
- Test: `test/work-memory-review-schedule.test.js`

- [ ] **Step 1: Write failing schedule tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { DEFAULT_CONFIG } = require("../src/work-memory/defaults");
const { evaluateReviewSchedule } = require("../src/work-memory/review-schedule");

test("default review schedule enables daily pack and disables weekly pack", () => {
  assert.equal(DEFAULT_CONFIG.reviewSchedule.dailyPack.enabled, true);
  assert.equal(DEFAULT_CONFIG.reviewSchedule.dailyPack.time, "22:30");
  assert.equal(DEFAULT_CONFIG.reviewSchedule.weeklyPack.enabled, false);
});

test("daily schedule is due after configured local time", () => {
  const result = evaluateReviewSchedule({
    config: DEFAULT_CONFIG,
    now: "2026-05-02T22:45:00+08:00",
    lastReviewAt: null,
  });

  assert.equal(result.due, true);
  assert.equal(result.kind, "daily_pack");
  assert.equal(result.output, "daily_pack");
});

test("daily schedule is not due twice on same date", () => {
  const result = evaluateReviewSchedule({
    config: DEFAULT_CONFIG,
    now: "2026-05-02T23:00:00+08:00",
    lastReviewAt: "2026-05-02T22:45:00+08:00",
  });

  assert.equal(result.due, false);
  assert.equal(result.reason, "already_reviewed_today");
});
```

- [ ] **Step 2: Run failing test**

Run: `node --test test/work-memory-review-schedule.test.js`  
Expected: FAIL because `review-schedule.js` and `reviewSchedule` defaults do not exist.

- [ ] **Step 3: Implement defaults**

Add to `DEFAULT_CONFIG`:

```js
reviewSchedule: {
  dailyPack: { enabled: true, time: "22:30", format: "short" },
  weeklyPack: { enabled: false, day: "Sunday", time: "16:00", format: "thread_review" },
},
```

- [ ] **Step 4: Implement schedule evaluator**

Create `evaluateReviewSchedule({ config, now, lastReviewAt })` with deterministic rules:

- daily is due when enabled, current local `HH:MM` is greater than or equal to configured time, and `lastReviewAt` is not the same local date.
- weekly is due when enabled, local weekday matches configured day, local `HH:MM` is greater than or equal to configured time, and `lastReviewAt` is not the same local ISO week key.
- return shape:

```js
{
  due: true,
  kind: "daily_pack",
  output: "daily_pack",
  format: "short",
  reason: "scheduled",
  evaluatedAt: "2026-05-02T22:45:00+08:00"
}
```

- [ ] **Step 5: Export evaluator**

Export `evaluateReviewSchedule` from `src/work-memory/index.js`.

- [ ] **Step 6: Run test**

Run: `node --test test/work-memory-review-schedule.test.js`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/work-memory/defaults.js src/work-memory/review-schedule.js src/work-memory/index.js test/work-memory-review-schedule.test.js
git commit -m "feat: evaluate review schedules"
```

---

### Task 2: Service, CLI, And MCP Schedule Status

**Files:**
- Modify: `src/work-memory/memory-service.js`
- Modify: `src/work-memory/mcp-tool-host.js`
- Modify: `src/index.js`
- Test: `test/work-memory-review-schedule.test.js`
- Test: `test/work-memory-mcp-tool-host.test.js`
- Test: `test/work-memory-cli.test.js`

- [ ] **Step 1: Write failing service and adapter tests**

Add tests:

```js
test("service exposes schedule status", () => {
  const service = new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-schedule-")),
    now: () => "2026-05-02T22:45:00+08:00",
  });

  const result = service.reviewScheduleStatus();

  assert.equal(result.due, true);
  assert.equal(result.kind, "daily_pack");
});

test("mcp host exposes schedule status tool", async () => {
  const service = new WorkMemoryService({
    stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-schedule-")),
    now: () => "2026-05-02T22:45:00+08:00",
  });
  const host = new WorkMemoryMcpToolHost({ service });

  assert.ok(host.listTools().some((tool) => tool.name === "work_memory_schedule_status"));

  const result = await host.invokeTool("work_memory_schedule_status", {});
  assert.equal(result.data.due, true);
});
```

- [ ] **Step 2: Run failing tests**

Run: `node --test test/work-memory-review-schedule.test.js test/work-memory-mcp-tool-host.test.js`  
Expected: FAIL because service/tool methods do not exist.

- [ ] **Step 3: Implement service method**

Add `reviewScheduleStatus({ lastReviewAt } = {})` to `WorkMemoryService`; it reads config and calls `evaluateReviewSchedule`.

- [ ] **Step 4: Add MCP tool**

Add `work_memory_schedule_status` with input schema:

```js
objectSchema({
  lastReviewAt: {
    type: "string",
    description: "Optional timestamp of the previous scheduled review.",
  },
})
```

Handler text should be short:

```js
result.due ? `Scheduled review due: ${result.kind}.` : `Scheduled review not due: ${result.reason}.`
```

- [ ] **Step 5: Add CLI command**

Add command:

```bash
work-memory-compiler schedule-status
```

It prints JSON from `service.reviewScheduleStatus()`.

- [ ] **Step 6: Run tests**

Run: `npm run test:work-memory`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/work-memory/memory-service.js src/work-memory/mcp-tool-host.js src/index.js test/work-memory-review-schedule.test.js test/work-memory-mcp-tool-host.test.js test/work-memory-cli.test.js
git commit -m "feat: expose review schedule status"
```

---

### Task 3: Review Interaction Selector

**Files:**
- Create: `src/work-memory/review-selector.js`
- Modify: `src/work-memory/defaults.js`
- Modify: `src/work-memory/memory-service.js`
- Modify: `src/work-memory/mcp-tool-host.js`
- Test: `test/work-memory-review-selector.test.js`

- [ ] **Step 1: Write failing selector tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { selectReviewInteraction } = require("../src/work-memory/review-selector");

test("selector keeps small mobile reviews inline", () => {
  const result = selectReviewInteraction({
    counts: { dirtyItems: 4, decisionRecords: 1 },
    hints: { userIsOnMobile: true },
  });

  assert.equal(result.mode, "wechat_inline");
});

test("selector recommends markdown roundtrip for larger annotation work", () => {
  const result = selectReviewInteraction({
    counts: { dirtyItems: 12, decisionRecords: 3 },
    hints: { longTextNeeded: true, userWantsAnnotation: true },
  });

  assert.equal(result.mode, "md_roundtrip");
});

test("selector recommends review ui without starting ui in v0.2", () => {
  const result = selectReviewInteraction({
    counts: { dirtyItems: 25, decisionRecords: 6, activeThreads: 8 },
    hints: { userWantsDashboardOrNoteEditing: true },
  });

  assert.equal(result.mode, "review_ui_recommended");
  assert.equal(result.startsServer, false);
});
```

- [ ] **Step 2: Run failing test**

Run: `node --test test/work-memory-review-selector.test.js`  
Expected: FAIL because selector does not exist.

- [ ] **Step 3: Implement selector**

Rules mirror PRD section 14.4:

- `wechat_inline` when `dirtyItems <= 8`, `decisionRecords <= 2`, and mobile or short summary hint.
- `md_roundtrip` when dirty items are larger than 8, long text is needed, decisions need rationale, or user wants annotation.
- `review_ui_recommended` when dirty items are larger than 20, multiple threads need merge, many decisions/materials exist, or user wants dashboard/note editing.
- v0.2 only recommends UI; it never starts a server.

- [ ] **Step 4: Expose through service and MCP**

Add `reviewSelectMode({ counts, hints } = {})` and MCP tool `work_memory_review_select_mode`.

- [ ] **Step 5: Run tests**

Run: `node --test test/work-memory-review-selector.test.js test/work-memory-mcp-tool-host.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/work-memory/review-selector.js src/work-memory/defaults.js src/work-memory/memory-service.js src/work-memory/mcp-tool-host.js test/work-memory-review-selector.test.js test/work-memory-mcp-tool-host.test.js
git commit -m "feat: select review interaction mode"
```

---

### Task 4: Markdown Roundtrip Export And Apply

**Files:**
- Create: `src/work-memory/markdown-roundtrip.js`
- Modify: `src/work-memory/memory-service.js`
- Modify: `src/work-memory/mcp-tool-host.js`
- Modify: `src/index.js`
- Test: `test/work-memory-markdown-roundtrip.test.js`

- [ ] **Step 1: Write failing roundtrip tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildEditableReviewMarkdown,
  parseEditedReviewMarkdown,
} = require("../src/work-memory/markdown-roundtrip");

test("editable markdown includes stable operation markers", () => {
  const markdown = buildEditableReviewMarkdown({
    events: [{ id: "evt_1", summary: "字段少，维度多", status: "draft" }],
    decisions: [],
    memoryItems: [],
  });

  assert.match(markdown, /<!-- wmc:event id="evt_1" -->/);
  assert.match(markdown, /action: keep_draft/);
});

test("edited markdown parses user review operations", () => {
  const operations = parseEditedReviewMarkdown(`
<!-- wmc:event id="evt_1" -->
action: confirm
note: 这个可以进长期上下文
`);

  assert.deepEqual(operations, [{
    targetType: "event",
    targetId: "evt_1",
    action: "confirm",
    note: "这个可以进长期上下文",
  }]);
});
```

- [ ] **Step 2: Run failing test**

Run: `node --test test/work-memory-markdown-roundtrip.test.js`  
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement markdown generator**

Use explicit markers only:

```markdown
<!-- wmc:event id="evt_1" -->
- summary: 字段少，维度多
- status: draft
- action: keep_draft
- note:
```

Do not infer facts from free prose outside markers.

- [ ] **Step 4: Implement parser**

Parser rules:

- Recognize markers `<!-- wmc:<type> id="<id>" -->`.
- Parse following `action:` and `note:` lines until next marker.
- Allow actions: `confirm`, `ignore`, `keep_draft`, `needs_clarification`, `delete`, `disable`.
- Ignore unmarked prose.

- [ ] **Step 5: Expose service, MCP, and CLI**

Add:

- `service.exportEditableMarkdown({ date } = {})`
- `service.applyEditedMarkdown({ markdown })`
- MCP tools `work_memory_md_export`, `work_memory_md_apply`
- CLI commands `md-export`, `md-apply --file PATH`

- [ ] **Step 6: Run tests**

Run: `npm run test:work-memory`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/work-memory/markdown-roundtrip.js src/work-memory/memory-service.js src/work-memory/mcp-tool-host.js src/index.js test/work-memory-markdown-roundtrip.test.js
git commit -m "feat: support markdown review roundtrip"
```

---

### Task 5: Conservative Resume Mode

**Files:**
- Create: `src/work-memory/resume-engine.js`
- Modify: `src/work-memory/memory-service.js`
- Modify: `src/work-memory/mcp-tool-host.js`
- Test: `test/work-memory-resume-engine.test.js`

- [ ] **Step 1: Write failing resume tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildResumeSuggestion } = require("../src/work-memory/resume-engine");

test("conservative resume shows facts and pending items without next-step advice", () => {
  const result = buildResumeSuggestion({
    mode: "conservative",
    events: [
      { id: "evt_1", kind: "interruption", summary: "临时中断", status: "buffered", created_at: "2026-05-02T10:00:00+08:00" },
      { id: "evt_2", kind: "note", summary: "整理包模板先标准版", status: "draft" },
    ],
    threads: [{ id: "thr_1", title: "整理包", status: "active", recent_summary: "标准版优先" }],
  });

  assert.match(result.markdown, /上次停在/);
  assert.match(result.markdown, /整理包模板先标准版/);
  assert.doesNotMatch(result.markdown, /可以从这里接/);
});
```

- [ ] **Step 2: Run failing test**

Run: `node --test test/work-memory-resume-engine.test.js`  
Expected: FAIL because resume engine does not exist.

- [ ] **Step 3: Implement resume engine**

Modes:

- `off`: return empty markdown and `enabled: false`.
- `conservative`: include latest interruption, active thread facts, pending confirmations.
- `proactive`: include conservative content plus `suggested_next_steps` only when explicit thread open loops exist.

- [ ] **Step 4: Expose service and MCP**

Add `service.resume({ mode, since } = {})` and MCP tool `work_memory_resume`.

- [ ] **Step 5: Run tests**

Run: `node --test test/work-memory-resume-engine.test.js test/work-memory-mcp-tool-host.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/work-memory/resume-engine.js src/work-memory/memory-service.js src/work-memory/mcp-tool-host.js test/work-memory-resume-engine.test.js
git commit -m "feat: build conservative resume summaries"
```

---

### Task 6: Decision Patch From Uploaded Materials

**Files:**
- Create: `src/work-memory/decision-patch.js`
- Modify: `src/work-memory/json-store.js`
- Modify: `src/work-memory/schema.js`
- Modify: `src/work-memory/memory-service.js`
- Modify: `src/work-memory/mcp-tool-host.js`
- Test: `test/work-memory-decision-patch.test.js`

- [ ] **Step 1: Write failing decision patch tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildDecisionPatch } = require("../src/work-memory/decision-patch");

test("decision patch separates material facts from proposed updates", () => {
  const patch = buildDecisionPatch({
    decision: { id: "dec_1", title: "MCP first", decision: "先做 MCP" },
    material: {
      id: "mat_1",
      title: "review note",
      text: "用户补充：Cyberboss adapter 必须可选安装。",
    },
    now: "2026-05-02T12:00:00+08:00",
  });

  assert.equal(patch.decision_id, "dec_1");
  assert.equal(patch.material_id, "mat_1");
  assert.match(patch.material_facts[0], /Cyberboss adapter/);
  assert.equal(patch.status, "draft");
});
```

- [ ] **Step 2: Run failing test**

Run: `node --test test/work-memory-decision-patch.test.js`  
Expected: FAIL because decision patch module does not exist.

- [ ] **Step 3: Implement decision patch model**

Persist fields:

```js
{
  id,
  decision_id,
  material_id,
  material_title,
  material_facts,
  proposed_context_additions,
  proposed_rationale_additions,
  followup_questions,
  status: "draft",
  created_at,
  updated_at
}
```

Keep extraction deterministic: line-based material facts only, no LLM inference.

- [ ] **Step 4: Add store support**

Add `decision-patches.json`, `listDecisionPatches()`, `appendDecisionPatch()`, `replaceDecisionPatches()`.

- [ ] **Step 5: Expose service and MCP**

Add `service.createDecisionPatch({ decisionId, material })` and MCP tool `work_memory_decision_patch`.

- [ ] **Step 6: Run tests**

Run: `node --test test/work-memory-decision-patch.test.js test/work-memory-json-store.test.js test/work-memory-mcp-tool-host.test.js`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/work-memory/decision-patch.js src/work-memory/json-store.js src/work-memory/schema.js src/work-memory/memory-service.js src/work-memory/mcp-tool-host.js test/work-memory-decision-patch.test.js test/work-memory-json-store.test.js
git commit -m "feat: draft decision patches from materials"
```

---

### Task 7: Long-Term Memory Review Commands

**Files:**
- Create: `src/work-memory/memory-review.js`
- Modify: `src/work-memory/memory-service.js`
- Modify: `src/work-memory/mcp-tool-host.js`
- Modify: `src/index.js`
- Test: `test/work-memory-memory-review.test.js`

- [ ] **Step 1: Write failing memory review tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { applyMemoryReviewOperation } = require("../src/work-memory/memory-review");

test("memory review update preserves user editability", () => {
  const result = applyMemoryReviewOperation({
    memoryItems: [{ id: "mem_1", summary: "旧描述", user_editable: true }],
    operation: { action: "update", memoryId: "mem_1", summary: "新描述" },
    now: "2026-05-02T12:00:00+08:00",
  });

  assert.equal(result.memoryItems[0].summary, "新描述");
  assert.equal(result.memoryItems[0].user_editable, true);
});

test("memory review can disable a memory item without deleting history", () => {
  const result = applyMemoryReviewOperation({
    memoryItems: [{ id: "mem_1", summary: "偏好 A", user_editable: true }],
    operation: { action: "disable", memoryId: "mem_1" },
    now: "2026-05-02T12:00:00+08:00",
  });

  assert.equal(result.memoryItems[0].disabled, true);
});
```

- [ ] **Step 2: Run failing test**

Run: `node --test test/work-memory-memory-review.test.js`  
Expected: FAIL because memory review module does not exist.

- [ ] **Step 3: Implement operations**

Supported operations:

- `list`
- `update`
- `delete`
- `disable`
- `enable`

All operations return `{ memoryItems, applied }`. `delete` removes the item from the active list; `disable` keeps it with `disabled: true`.

- [ ] **Step 4: Expose service, MCP, and CLI**

Add:

- `service.reviewMemory({ operation })`
- MCP tool `work_memory_memory_review`
- CLI commands `memory-list`, `memory-update --id ID --summary TEXT`, `memory-disable --id ID`, `memory-delete --id ID`

- [ ] **Step 5: Run tests**

Run: `npm run test:work-memory`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/work-memory/memory-review.js src/work-memory/memory-service.js src/work-memory/mcp-tool-host.js src/index.js test/work-memory-memory-review.test.js
git commit -m "feat: add memory review operations"
```

---

### Task 8: v0.2 Documentation And Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/commands.md`
- Modify: `docs/work-memory-compiler-dev-plan.md`
- Modify: `package.json`

- [ ] **Step 1: Update docs**

Document:

- v0.2 CLI commands.
- v0.2 MCP tools.
- The fact that Review UI is only recommended in v0.2, not started.
- Local-first state files including `decision-patches.json`.

- [ ] **Step 2: Update syntax check**

Ensure `npm run check` covers every new source file:

```json
"check:work-memory": "node --check ./src/index.js && node --check ./bin/work-memory-compiler.js && node --check ./src/work-memory/*.js && node --check ./src/integrations/cyberboss/work-memory-adapter.js"
```

If shell glob behavior is a concern on Windows, keep explicit file paths and add every new file.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm run test:work-memory
npm run check
npm audit --omit=dev --json
npm pack --dry-run --json
```

Expected:

- All focused tests pass.
- Syntax check passes.
- Audit has zero vulnerabilities.
- Pack output contains only WMC publish files and docs.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/commands.md docs/work-memory-compiler-dev-plan.md package.json package-lock.json
git commit -m "docs: document work memory compiler v0.2"
```

---

## Self-Review

- Spec coverage: covers confirmation budget scheduling, periodic review status, md document generation and apply, review templates foundation, conservative resume, Decision Patch, and long-term memory review commands.
- Intentional gaps: no daemon, no UI server, no public tunnel, no LLM inference, and no advanced custom schema editor in v0.2.
- Type consistency: public service methods use camelCase; persisted state remains snake_case.
