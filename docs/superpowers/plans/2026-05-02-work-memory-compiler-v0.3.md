# Work Memory Compiler v0.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Review UI and advanced configuration layer for deep work-memory review, batch operations, decision editing, long-term memory management, dashboard views, and explicit optional sharing.

**Architecture:** v0.3 adds a local HTTP UI on top of the v0.2 service API. The UI remains local-first and disabled by default; public sharing requires explicit config and should be implemented as a separate adapter, not as a default behavior. The core service continues to own all state transitions.

**Tech Stack:** Node.js 22, CommonJS, built-in `node:http`, static HTML/CSS/JS assets, `node:test`, JSON persistence. Avoid frontend build tooling for the first UI so the package remains small and easy to install.

---

## Preconditions

Start v0.3 only after v0.2 is merged and verified. v0.3 depends on:

- `service.exportEditableMarkdown()`
- `service.applyEditedMarkdown()`
- `service.resume()`
- `service.createDecisionPatch()`
- `service.reviewMemory()`
- `service.reviewSelectMode()`

## File Structure

- Create `src/work-memory/ui-server.js`: local HTTP server lifecycle and route dispatch.
- Create `src/work-memory/ui-routes.js`: JSON API handlers using `WorkMemoryService`.
- Create `src/work-memory/ui-assets.js`: serve static assets from package files.
- Create `src/work-memory/review-operations.js`: batch confirm/ignore/merge/note operations shared by UI and MCP.
- Create `src/work-memory/custom-schema.js`: validate user-defined event fields and safe schema config.
- Create `src/work-memory/dashboard.js`: build dashboard JSON for UI and agent-readable export.
- Create `public/review-ui/index.html`
- Create `public/review-ui/app.js`
- Create `public/review-ui/styles.css`
- Modify `src/work-memory/memory-service.js`: add UI-facing service methods.
- Modify `src/work-memory/mcp-tool-host.js`: expose dashboard and batch operation tools.
- Modify `src/index.js`: add `ui` and `dashboard` CLI commands.
- Modify `package.json`: include `public/review-ui/**` in package files and check scripts.
- Add tests under `test/work-memory-*.test.js`.

## v0.3 Tool API

Add standalone MCP tools:

- `work_memory_batch_review`
- `work_memory_dashboard`
- `work_memory_custom_schema_get`
- `work_memory_custom_schema_set`

Cyberboss adapter exposes prefixed equivalents automatically.

---

### Task 1: Local UI Server Skeleton

**Files:**
- Create: `src/work-memory/ui-server.js`
- Create: `src/work-memory/ui-routes.js`
- Create: `public/review-ui/index.html`
- Create: `public/review-ui/app.js`
- Create: `public/review-ui/styles.css`
- Modify: `src/index.js`
- Modify: `package.json`
- Test: `test/work-memory-ui-server.test.js`

- [ ] **Step 1: Write failing server tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { startReviewUiServer } = require("../src/work-memory/ui-server");
const { WorkMemoryService } = require("../src/work-memory");

test("review ui server serves health and index locally", async (t) => {
  const server = await startReviewUiServer({
    host: "127.0.0.1",
    port: 0,
    service: new WorkMemoryService({
      stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-ui-")),
    }),
  });
  t.after(() => server.close());

  const health = await fetch(`${server.url}/api/health`).then((res) => res.json());
  const html = await fetch(`${server.url}/`).then((res) => res.text());

  assert.equal(health.ok, true);
  assert.match(html, /Work Memory Compiler/);
});
```

- [ ] **Step 2: Run failing test**

Run: `node --test test/work-memory-ui-server.test.js`  
Expected: FAIL because UI server does not exist.

- [ ] **Step 3: Implement local HTTP server**

Use `node:http`. Bind default host to `127.0.0.1`, default port to `37671`, and return:

```js
{
  url: "http://127.0.0.1:37671",
  close: () => Promise<void>
}
```

- [ ] **Step 4: Implement static index**

The first screen is the review workspace, not a marketing page. Include tabs/buttons for:

- Review
- Decisions
- Memory
- Dashboard
- Settings

- [ ] **Step 5: Add CLI command**

Add:

```bash
work-memory-compiler ui --host 127.0.0.1 --port 37671
```

The command starts the server and prints the local URL.

- [ ] **Step 6: Run tests**

Run: `node --test test/work-memory-ui-server.test.js`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/work-memory/ui-server.js src/work-memory/ui-routes.js public/review-ui src/index.js package.json test/work-memory-ui-server.test.js
git commit -m "feat: add local review ui server"
```

---

### Task 2: Review Queue API And Batch Operations

**Files:**
- Create: `src/work-memory/review-operations.js`
- Modify: `src/work-memory/ui-routes.js`
- Modify: `src/work-memory/memory-service.js`
- Modify: `src/work-memory/mcp-tool-host.js`
- Test: `test/work-memory-review-operations.test.js`
- Test: `test/work-memory-ui-routes.test.js`

- [ ] **Step 1: Write failing operation tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { applyBatchReviewOperations } = require("../src/work-memory/review-operations");

test("batch review confirms ignores and annotates events", () => {
  const result = applyBatchReviewOperations({
    events: [
      { id: "evt_1", status: "draft", meta: {} },
      { id: "evt_2", status: "draft", meta: {} },
    ],
    operations: [
      { targetType: "event", targetId: "evt_1", action: "confirm", note: "确认进入记录" },
      { targetType: "event", targetId: "evt_2", action: "ignore" },
    ],
    now: "2026-05-02T12:00:00+08:00",
  });

  assert.equal(result.events[0].status, "committed");
  assert.equal(result.events[0].meta.review_note, "确认进入记录");
  assert.equal(result.events[1].status, "ignored");
});
```

- [ ] **Step 2: Run failing test**

Run: `node --test test/work-memory-review-operations.test.js`  
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement batch operations**

Supported actions:

- event: `confirm`, `ignore`, `keep_draft`, `needs_clarification`, `annotate`
- thread: `merge`, `archive`, `park`
- memory: `update`, `delete`, `disable`
- decision: `update`, `link_material`, `mark_superseded`

- [ ] **Step 4: Add API routes**

Add routes:

- `GET /api/review-queue`
- `POST /api/review-operations`

Request body:

```json
{
  "operations": [
    { "targetType": "event", "targetId": "evt_1", "action": "confirm" }
  ]
}
```

- [ ] **Step 5: Expose MCP tool**

Add `work_memory_batch_review`.

- [ ] **Step 6: Run tests**

Run: `node --test test/work-memory-review-operations.test.js test/work-memory-ui-routes.test.js test/work-memory-mcp-tool-host.test.js`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/work-memory/review-operations.js src/work-memory/ui-routes.js src/work-memory/memory-service.js src/work-memory/mcp-tool-host.js test/work-memory-review-operations.test.js test/work-memory-ui-routes.test.js
git commit -m "feat: support batch review operations"
```

---

### Task 3: Decision Editor And Material Linking

**Files:**
- Modify: `src/work-memory/schema.js`
- Modify: `src/work-memory/memory-service.js`
- Modify: `src/work-memory/ui-routes.js`
- Modify: `public/review-ui/app.js`
- Test: `test/work-memory-decision-editor.test.js`

- [ ] **Step 1: Write failing decision editor tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { WorkMemoryService } = require("../src/work-memory");

test("service updates decision rationale and links material", () => {
  const service = new WorkMemoryService({ stateDir: fs.mkdtempSync(path.join(os.tmpdir(), "wmc-decisions-")) });
  service.store.appendDecision({
    id: "dec_1",
    title: "MCP first",
    decision: "先做 MCP",
    rationale: [],
    linked_materials: [],
  });

  const result = service.updateDecision({
    decisionId: "dec_1",
    patch: {
      rationale: ["standalone users can install it first"],
      linked_materials: ["mat_1"],
    },
  });

  assert.deepEqual(result.decision.rationale, ["standalone users can install it first"]);
  assert.deepEqual(result.decision.linked_materials, ["mat_1"]);
});
```

- [ ] **Step 2: Run failing test**

Run: `node --test test/work-memory-decision-editor.test.js`  
Expected: FAIL because `updateDecision` does not exist.

- [ ] **Step 3: Implement decision update**

Allow updates only for these fields:

- `title`
- `decision`
- `context`
- `rationale`
- `alternatives_considered`
- `tradeoffs`
- `linked_materials`
- `followup_questions`
- `status`

- [ ] **Step 4: Add routes and UI controls**

Routes:

- `GET /api/decisions`
- `PATCH /api/decisions/:id`

UI:

- Editable decision fields.
- Material links visible by ID/title.
- Save and revert buttons.

- [ ] **Step 5: Run tests**

Run: `node --test test/work-memory-decision-editor.test.js test/work-memory-ui-routes.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/work-memory/schema.js src/work-memory/memory-service.js src/work-memory/ui-routes.js public/review-ui/app.js test/work-memory-decision-editor.test.js
git commit -m "feat: edit decision records in review ui"
```

---

### Task 4: Long-Term Memory Management View

**Files:**
- Modify: `src/work-memory/ui-routes.js`
- Modify: `public/review-ui/app.js`
- Modify: `public/review-ui/styles.css`
- Test: `test/work-memory-ui-routes.test.js`

- [ ] **Step 1: Write failing memory route tests**

```js
test("memory routes list and disable memory items", async () => {
  const server = await startReviewUiServer({ host: "127.0.0.1", port: 0, service });
  t.after(() => server.close());

  await fetch(`${server.url}/api/memory`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "disable", memoryId: "mem_1" }),
  });

  const memory = await fetch(`${server.url}/api/memory`).then((res) => res.json());
  assert.equal(memory.items[0].disabled, true);
});
```

- [ ] **Step 2: Run failing test**

Run: `node --test test/work-memory-ui-routes.test.js`  
Expected: FAIL because memory routes do not exist.

- [ ] **Step 3: Add routes**

Routes:

- `GET /api/memory`
- `POST /api/memory`

Use `service.reviewMemory()`.

- [ ] **Step 4: Add UI**

Memory view must support:

- View current memories.
- Edit summary.
- Disable/enable.
- Delete.
- Show confidence and review policy.

- [ ] **Step 5: Run tests**

Run: `node --test test/work-memory-ui-routes.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/work-memory/ui-routes.js public/review-ui/app.js public/review-ui/styles.css test/work-memory-ui-routes.test.js
git commit -m "feat: manage long-term memory in review ui"
```

---

### Task 5: Dashboard And Agent-Readable Export View

**Files:**
- Create: `src/work-memory/dashboard.js`
- Modify: `src/work-memory/memory-service.js`
- Modify: `src/work-memory/mcp-tool-host.js`
- Modify: `src/work-memory/ui-routes.js`
- Modify: `src/index.js`
- Test: `test/work-memory-dashboard.test.js`

- [ ] **Step 1: Write failing dashboard tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildDashboard } = require("../src/work-memory/dashboard");

test("dashboard summarizes dirty buffer threads decisions and memory", () => {
  const dashboard = buildDashboard({
    events: [{ id: "evt_1", status: "draft" }],
    threads: [{ id: "thr_1", status: "active" }],
    decisions: [{ id: "dec_1", status: "draft" }],
    memoryItems: [{ id: "mem_1", disabled: false }],
  });

  assert.equal(dashboard.counts.dirtyItems, 1);
  assert.equal(dashboard.counts.activeThreads, 1);
  assert.equal(dashboard.counts.draftDecisions, 1);
  assert.equal(dashboard.counts.activeMemoryItems, 1);
});
```

- [ ] **Step 2: Run failing test**

Run: `node --test test/work-memory-dashboard.test.js`  
Expected: FAIL because dashboard module does not exist.

- [ ] **Step 3: Implement dashboard builder**

Return:

```js
{
  counts: {},
  reviewStatus: {},
  scheduleStatus: {},
  openLoops: [],
  recentEvents: [],
  agentExport: {}
}
```

- [ ] **Step 4: Expose dashboard**

Add:

- `service.dashboard()`
- MCP tool `work_memory_dashboard`
- CLI command `dashboard`
- route `GET /api/dashboard`

- [ ] **Step 5: Run tests**

Run: `node --test test/work-memory-dashboard.test.js test/work-memory-mcp-tool-host.test.js test/work-memory-ui-routes.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/work-memory/dashboard.js src/work-memory/memory-service.js src/work-memory/mcp-tool-host.js src/work-memory/ui-routes.js src/index.js test/work-memory-dashboard.test.js
git commit -m "feat: add work memory dashboard"
```

---

### Task 6: Custom Event Schema Configuration

**Files:**
- Create: `src/work-memory/custom-schema.js`
- Modify: `src/work-memory/defaults.js`
- Modify: `src/work-memory/memory-service.js`
- Modify: `src/work-memory/mcp-tool-host.js`
- Modify: `public/review-ui/app.js`
- Test: `test/work-memory-custom-schema.test.js`

- [ ] **Step 1: Write failing schema config tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { validateCustomEventSchema } = require("../src/work-memory/custom-schema");

test("custom event schema accepts small safe field definitions", () => {
  const schema = validateCustomEventSchema({
    fields: [
      { id: "project", label: "Project", type: "string", required: false },
      { id: "risk", label: "Risk", type: "enum", options: ["low", "medium", "high"] },
    ],
  });

  assert.equal(schema.fields.length, 2);
});

test("custom event schema rejects executable or oversized fields", () => {
  assert.throws(() => validateCustomEventSchema({
    fields: [{ id: "script", label: "Script", type: "javascript" }],
  }), /unsupported field type/);
});
```

- [ ] **Step 2: Run failing test**

Run: `node --test test/work-memory-custom-schema.test.js`  
Expected: FAIL because custom schema module does not exist.

- [ ] **Step 3: Implement validator**

Supported field types only:

- `string`
- `number`
- `boolean`
- `enum`
- `date`

Limits:

- maximum 20 fields
- field IDs must match `/^[a-z][a-z0-9_]{0,40}$/`
- enum options maximum 20 strings

- [ ] **Step 4: Expose config API**

Add:

- `service.getCustomEventSchema()`
- `service.setCustomEventSchema(schema)`
- MCP tools `work_memory_custom_schema_get`, `work_memory_custom_schema_set`
- UI settings editor

- [ ] **Step 5: Run tests**

Run: `node --test test/work-memory-custom-schema.test.js test/work-memory-mcp-tool-host.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/work-memory/custom-schema.js src/work-memory/defaults.js src/work-memory/memory-service.js src/work-memory/mcp-tool-host.js public/review-ui/app.js test/work-memory-custom-schema.test.js
git commit -m "feat: configure custom event fields"
```

---

### Task 7: Explicit Sharing Guardrails

**Files:**
- Modify: `src/work-memory/ui-server.js`
- Modify: `src/work-memory/defaults.js`
- Modify: `src/index.js`
- Test: `test/work-memory-ui-server.test.js`

- [ ] **Step 1: Write failing guardrail tests**

```js
test("ui server refuses non-local host unless sharing is explicitly enabled", async () => {
  await assert.rejects(async () => {
    await startReviewUiServer({
      host: "0.0.0.0",
      port: 0,
      allowPublicBind: false,
      service,
    });
  }, /public bind requires allowPublicBind/);
});
```

- [ ] **Step 2: Run failing test**

Run: `node --test test/work-memory-ui-server.test.js`  
Expected: FAIL because guardrail does not exist.

- [ ] **Step 3: Implement guardrail**

Default behavior:

- Allow `127.0.0.1`, `localhost`, and `::1`.
- Reject `0.0.0.0` and external hostnames unless `allowPublicBind: true`.
- CLI requires explicit `--allow-public-bind` for non-local host.

- [ ] **Step 4: Run tests**

Run: `node --test test/work-memory-ui-server.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/work-memory/ui-server.js src/work-memory/defaults.js src/index.js test/work-memory-ui-server.test.js
git commit -m "feat: guard review ui public binding"
```

---

### Task 8: v0.3 Documentation, Browser QA, And Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/commands.md`
- Modify: `docs/work-memory-compiler-dev-plan.md`
- Modify: `package.json`

- [ ] **Step 1: Update docs**

Document:

- `work-memory-compiler ui`
- `work-memory-compiler dashboard`
- local-only default
- explicit public bind flag
- v0.3 MCP tools
- UI routes and expected state directory

- [ ] **Step 2: Run automated verification**

Run:

```bash
npm run test:work-memory
npm run check
npm audit --omit=dev --json
npm pack --dry-run --json
```

Expected:

- all tests pass
- check includes UI source files
- no vulnerabilities
- pack includes `public/review-ui/**` but not test files

- [ ] **Step 3: Run browser QA**

Start:

```bash
WORK_MEMORY_COMPILER_STATE_DIR=$(mktemp -d) node ./bin/work-memory-compiler.js ui --port 0
```

Use browser QA to verify:

- first screen is the usable review workspace
- tabs do not overlap on mobile width
- dashboard JSON loads
- review queue renders empty state
- memory tab renders empty state

- [ ] **Step 4: Commit**

```bash
git add README.md docs/commands.md docs/work-memory-compiler-dev-plan.md package.json package-lock.json
git commit -m "docs: document work memory compiler v0.3"
```

---

## Self-Review

- Spec coverage: covers local Review UI, port configuration, note supplement, batch operations, decision editing/material linking, memory management view, custom event structure, dashboard, and agent-readable export view.
- Intentional gaps: public tunnel provider integration is not implemented by default; only explicit local/public bind guardrails are planned. Hosted UI remains out of scope.
- Type consistency: v0.3 UI calls service methods, not store internals. Core state remains local JSON.
