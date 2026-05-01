# Work Memory Compiler Dev Plan

Work Memory Compiler is a standalone, local-first work memory module that can also be mounted into Cyberboss.

The implementation is split into three layers:

1. Core library: owns Event, Dirty Buffer, Thread Snapshot, Review Pack, Commit, Export, config, and JSON persistence.
2. Standalone MCP server: exposes `work_memory_*` tools for agents.
3. Cyberboss adapter: exposes prefixed `cyberboss_work_memory_*` tools for existing Cyberboss project-tool flows.

## MVP Commands

```bash
work-memory-compiler capture --text "这个点别丢"
work-memory-compiler snapshot
work-memory-compiler review-pack
work-memory-compiler export
work-memory-compiler mcp
```

During local development:

```bash
node ./bin/work-memory-compiler.js capture --text "这个点别丢"
node ./bin/work-memory-compiler.js snapshot
node ./bin/work-memory-compiler.js review-pack
node ./bin/work-memory-compiler.js export
node ./bin/work-memory-compiler.js mcp
```

## State Directory

Standalone state defaults to:

```text
~/.work-memory-compiler
```

Override it with:

```bash
WORK_MEMORY_COMPILER_STATE_DIR=/path/to/state node ./bin/work-memory-compiler.js capture --text "这个点别丢"
```

When loaded as a Cyberboss adapter, state resolution is:

1. explicit adapter `stateDir`
2. `WORK_MEMORY_COMPILER_STATE_DIR`
3. `config.workMemoryStateDir`
4. `<cyberboss stateDir>/work-memory`
5. standalone default

## MCP Config

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

MVP tools:

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
- `work_memory_commit`
- `work_memory_export`
- `work_memory_config_get`
- `work_memory_config_set`

## Cyberboss Add-on Path

Existing Cyberboss users can use Work Memory Compiler in two ways:

1. Add the standalone MCP server to their agent runtime.
2. Enable the Cyberboss adapter and use the prefixed project tools:

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
- `cyberboss_work_memory_commit`
- `cyberboss_work_memory_export`
- `cyberboss_work_memory_config_get`
- `cyberboss_work_memory_config_set`

The adapter wraps the standalone core. Cyberboss is a host, not the source of truth.

## Current MVP Status

Implemented:

- Local JSON store.
- Core schema normalization.
- Low-friction capture and quick events.
- Thread snapshot and review pack generation.
- Commit decisions and agent-readable export.
- Standalone CLI commands.
- Standalone MCP server.
- Cyberboss adapter.
- v0.2 seed: confirmation-budget risk checks and review status.
- v0.2: periodic schedule status, review mode selection, markdown roundtrip, conservative resume, Decision Patch drafts, and long-term memory review commands.

## Roadmap Plans

- [v0.2 implementation plan](./superpowers/plans/2026-05-02-work-memory-compiler-v0.2.md): confirmation budget scheduling, periodic review status, review mode selection, markdown roundtrip, conservative resume, Decision Patch, and long-term memory review commands.
- [v0.3 implementation plan](./superpowers/plans/2026-05-02-work-memory-compiler-v0.3.md): local Review UI, batch review operations, decision editor, long-term memory management view, dashboard, custom event schema, and explicit sharing guardrails.

Remaining For v0.3:

- Review UI and long-term memory management view.
- Batch review operations.
- Decision editor and material linking UI.
- Custom event schema and dashboard.
