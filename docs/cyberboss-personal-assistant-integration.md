# Cyberboss Personal Assistant Integration

This repo should stay standalone. For `cyberboss-personal-assistant`, install Work Memory Compiler as a dependency and mount the Cyberboss adapter as an extra project-tool host.

## Recommended Path

1. Add the dependency in `cyberboss-personal-assistant`:

```bash
npm install git+ssh://git@github.com/TouchingFishOnline/work-memory-compiler.git#codex/review-schedule
```

After merge, replace the branch ref with the published package or a stable tag.

2. Add optional config fields in Cyberboss:

```js
workMemoryStateDir: process.env.CYBERBOSS_WORK_MEMORY_STATE_DIR || path.join(stateDir, "work-memory")
```

The WMC adapter already falls back to `<config.stateDir>/work-memory`, so this field is mostly for explicit operator control.

3. Mount the adapter in Cyberboss tool creation:

```js
const { createCyberbossWorkMemoryAdapter } = require("work-memory-compiler/cyberboss-adapter");

services.workMemoryTools = createCyberbossWorkMemoryAdapter({
  config,
});
```

Then include it in `createExtraToolHosts()`:

```js
if (services.workMemoryTools) {
  hosts.push(services.workMemoryTools);
}
```

4. Add static tool names for Codex auto-approval:

```js
const { CYBERBOSS_WORK_MEMORY_TOOL_NAMES } = require("work-memory-compiler/cyberboss-adapter");

const STATIC_EXTRA_TOOL_NAMES = [
  ...new WhereaboutsToolHost({ service: null }).listTools().map((tool) => tool.name),
  ...CYBERBOSS_WORK_MEMORY_TOOL_NAMES,
];
```

5. Add smoke tests:

- `ProjectToolHost.listTools()` includes `cyberboss_work_memory_capture`.
- `ProjectToolHost.invokeTool("cyberboss_work_memory_capture", { text: "..." })` writes under `<CYBERBOSS_STATE_DIR>/work-memory`.
- Codex MCP config auto-approves `cyberboss_work_memory_capture`.

## Why This Path

- No WMC source is copied into Cyberboss.
- Existing Cyberboss runtime and WeChat bridge keep owning the host lifecycle.
- WMC keeps its own JSON state and MCP server shape.
- Cyberboss users get the same module through prefixed `cyberboss_work_memory_*` tools.

## Running UI Alongside Cyberboss

The Review UI is separate from Cyberboss startup:

```bash
CYBERBOSS_WORK_MEMORY_STATE_DIR=~/.cyberboss/work-memory work-memory-compiler ui
```

Keep it localhost by default. Use `--allow-public-bind` only when the operator explicitly wants to share the UI beyond the local machine.
