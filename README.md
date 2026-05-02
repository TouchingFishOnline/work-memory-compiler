# Work Memory Compiler

A local-first work memory compiler for agents and Cyberboss.

Work Memory Compiler captures low-friction work fragments, keeps a dirty buffer, generates thread snapshots and review packs, and exports agent-readable work memory. It is designed to run on its own, as an MCP server, or as a Cyberboss add-on.

## Install

```bash
npm install
```

During local development, run the CLI through Node:

```bash
node ./bin/work-memory-compiler.js help
```

After global installation or linking, use either binary:

```bash
work-memory-compiler help
wmc help
```

## CLI

```bash
work-memory-compiler capture --text "这个点别丢"
work-memory-compiler snapshot
work-memory-compiler review-pack
work-memory-compiler review-status
work-memory-compiler schedule-status
work-memory-compiler review-select-mode
work-memory-compiler md-export
work-memory-compiler md-apply --file review.md
work-memory-compiler resume
work-memory-compiler memory-list
work-memory-compiler dashboard
work-memory-compiler ui
work-memory-compiler export
work-memory-compiler mcp
```

Default state lives at:

```text
~/.work-memory-compiler
```

Override it with:

```bash
WORK_MEMORY_COMPILER_STATE_DIR=/path/to/state work-memory-compiler capture --text "这个点别丢"
```

## MCP

Example `.mcp.json`:

```json
{
  "mcpServers": {
    "work_memory_compiler": {
      "command": "work-memory-compiler",
      "args": ["mcp"],
      "env": {
        "WORK_MEMORY_COMPILER_STATE_DIR": "~/.work-memory-compiler"
      }
    }
  }
}
```

MCP tools:

- `work_memory_capture`
- `work_memory_thread_snapshot`
- `work_memory_review_pack`
- `work_memory_review_status`
- `work_memory_schedule_status`
- `work_memory_review_select_mode`
- `work_memory_md_export`
- `work_memory_md_apply`
- `work_memory_resume`
- `work_memory_decision_patch`
- `work_memory_memory_review`
- `work_memory_batch_review`
- `work_memory_dashboard`
- `work_memory_custom_schema_get`
- `work_memory_custom_schema_set`
- `work_memory_commit`
- `work_memory_export`
- `work_memory_config_get`
- `work_memory_config_set`

## Cyberboss Add-on

The Cyberboss adapter exposes the same core through prefixed project tools:

- `cyberboss_work_memory_capture`
- `cyberboss_work_memory_thread_snapshot`
- `cyberboss_work_memory_review_pack`
- `cyberboss_work_memory_review_status`
- `cyberboss_work_memory_schedule_status`
- `cyberboss_work_memory_review_select_mode`
- `cyberboss_work_memory_md_export`
- `cyberboss_work_memory_md_apply`
- `cyberboss_work_memory_resume`
- `cyberboss_work_memory_decision_patch`
- `cyberboss_work_memory_memory_review`
- `cyberboss_work_memory_batch_review`
- `cyberboss_work_memory_dashboard`
- `cyberboss_work_memory_custom_schema_get`
- `cyberboss_work_memory_custom_schema_set`
- `cyberboss_work_memory_commit`
- `cyberboss_work_memory_export`
- `cyberboss_work_memory_config_get`
- `cyberboss_work_memory_config_set`

Import it with:

```js
const { createCyberbossWorkMemoryAdapter } = require("work-memory-compiler/cyberboss-adapter");
```

The adapter wraps the standalone core. Cyberboss is a host, not the source of truth.

## Review UI

Start the local Review UI:

```bash
work-memory-compiler ui
```

The UI binds to `127.0.0.1:37671` by default. To share it outside localhost, pass an explicit host and `--allow-public-bind`:

```bash
work-memory-compiler ui --host 0.0.0.0 --allow-public-bind
```

## Library

```js
const { WorkMemoryService } = require("work-memory-compiler");

const service = new WorkMemoryService();
service.capture({ text: "这个点别丢", source: "cli" });
console.log(service.threadSnapshot().markdown);
```

## Docs

- [PRD](./docs/work_memory_compiler_prd_v_0_1.md)
- [Dev plan](./docs/work-memory-compiler-dev-plan.md)
- [Cyberboss Personal Assistant integration](./docs/cyberboss-personal-assistant-integration.md)
