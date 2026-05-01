# Commands

## Work Memory Compiler Commands

Standalone CLI:

- `work-memory-compiler help`
- `work-memory-compiler capture --text "这个点别丢"`
- `work-memory-compiler snapshot`
- `work-memory-compiler review-pack`
- `work-memory-compiler review-status`
- `work-memory-compiler export`
- `work-memory-compiler mcp`

Development form:

- `node ./bin/work-memory-compiler.js help`
- `node ./bin/work-memory-compiler.js capture --text "这个点别丢"`
- `node ./bin/work-memory-compiler.js snapshot`
- `node ./bin/work-memory-compiler.js review-pack`
- `node ./bin/work-memory-compiler.js review-status`
- `node ./bin/work-memory-compiler.js export`
- `node ./bin/work-memory-compiler.js mcp`

Standalone MCP tools:

- `work_memory_capture`
- `work_memory_thread_snapshot`
- `work_memory_review_pack`
- `work_memory_review_status`
- `work_memory_commit`
- `work_memory_export`
- `work_memory_config_get`
- `work_memory_config_set`

Cyberboss add-on project tools:

- `cyberboss_work_memory_capture`
- `cyberboss_work_memory_thread_snapshot`
- `cyberboss_work_memory_review_pack`
- `cyberboss_work_memory_review_status`
- `cyberboss_work_memory_commit`
- `cyberboss_work_memory_export`
- `cyberboss_work_memory_config_get`
- `cyberboss_work_memory_config_set`

---

## Design Principles

`Cyberboss` does not hard-code one shared string format across terminal commands, WeChat commands, and different agent runtimes.

It defines stable internal actions first, then lets each channel expose its own entrypoints:

- core action: stable internal meaning
- terminal command: terminal entrypoint
- weixin command: WeChat entrypoint

This keeps the core naming stable when new runtimes or channels are added later.

The runtime can be `codex` or `claudecode`, but the documented command surface stays the same.

## Current Action Groups

### Lifecycle & Diagnostics

- `app.login`
- `app.accounts`
- `app.start`
- `app.shared_start`
- `app.shared_open`
- `app.shared_status`
- `app.doctor`

### Workspace & Thread

- `workspace.bind`
- `workspace.status`
- `thread.new`
- `thread.reread`
- `thread.compact`
- `thread.switch`
- `thread.stop`
- `system.checkin_range`
- `channel.chunk_min`

### Approvals & Control

- `approval.accept_once`
- `approval.accept_workspace`
- `approval.reject_once`

### Capabilities

- `model.inspect`
- `model.select`
- `channel.send_file`
- `timeline.write`
- `reminder.create`
- `diary.append`
- `app.star`
- `app.help`

## Current Terminal Commands

The intentionally small public set is:

- `npm run login`
- `npm run accounts`
- `npm run shared:start`
- `npm run shared:open`
- `npm run shared:status`
- `npm run doctor`
- `npm run help`

## Project Tools

Models no longer use local capability CLI commands for diary, reminders, timeline, screenshots, or file sending.

Those capabilities are exposed as project-native structured tools:

- `cyberboss_channel_send_file`
- `cyberboss_diary_append`
- `cyberboss_reminder_create`
- `cyberboss_system_send`
- `cyberboss_timeline_write`
- `cyberboss_timeline_build`
- `cyberboss_timeline_serve`
- `cyberboss_timeline_dev`
- `cyberboss_timeline_screenshot`

Notes:
- These tools are bound to the Cyberboss project and routed through the repo's internal tool host.
- Claude Code loads them through workspace-local `.mcp.json` injected by Cyberboss and passed to Claude at startup with `--mcp-config`.
- Codex loads them through the runtime-side Cyberboss MCP bridge configured at spawn time.
- The public human terminal surface stays intentionally small: lifecycle commands plus shared bridge scripts.

## Current WeChat Commands

- `/bind`
- `/status`
- `/new`
- `/reread`
- `/compact`
- `/stop`
- `/switch <threadId>`
- `/checkin <min>-<max>`
- `/chunk <number>`
- `/yes`
- `/always`
- `/no`
- `/model`
- `/model <id>`
- `/star`
- `/help`

Notes:

- `/status` covers thread, workspace, and context details
- there is no separate `/context` command; use `/status` and read the `📦 context` line
- `/compact` asks the current thread to compact its context and reports start / finish back to WeChat
- file sending is still available, but no longer exposed as a WeChat command
