const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

test("work-memory-compiler help prints standalone product name", () => {
  const bin = path.resolve(__dirname, "..", "bin", "work-memory-compiler.js");
  const result = spawnSync(process.execPath, [bin, "help"], { encoding: "utf8" });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Work Memory Compiler/);
  assert.match(result.stdout, /mcp/);
  assert.match(result.stdout, /schedule-status/);
});

test("work-memory-compiler capture writes to configured state dir", () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "wmc-cli-"));
  const bin = path.resolve(__dirname, "..", "bin", "work-memory-compiler.js");
  const result = spawnSync(process.execPath, [bin, "capture", "--text", "这个点别丢"], {
    encoding: "utf8",
    env: { ...process.env, WORK_MEMORY_COMPILER_STATE_DIR: stateDir },
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /记下了/);
  const events = JSON.parse(fs.readFileSync(path.join(stateDir, "events.json"), "utf8"));
  assert.equal(events.length, 1);
});

test("work-memory-compiler snapshot reads captured state", () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "wmc-cli-"));
  const bin = path.resolve(__dirname, "..", "bin", "work-memory-compiler.js");
  const capture = spawnSync(process.execPath, [bin, "capture", "--text", "这个点别丢"], {
    encoding: "utf8",
    env: { ...process.env, WORK_MEMORY_COMPILER_STATE_DIR: stateDir },
  });
  assert.equal(capture.status, 0);

  const snapshot = spawnSync(process.execPath, [bin, "snapshot"], {
    encoding: "utf8",
    env: { ...process.env, WORK_MEMORY_COMPILER_STATE_DIR: stateDir },
  });

  assert.equal(snapshot.status, 0);
  assert.match(snapshot.stdout, /当前线程截图/);
});

test("work-memory-compiler schedule-status prints json", () => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "wmc-cli-"));
  const bin = path.resolve(__dirname, "..", "bin", "work-memory-compiler.js");
  const result = spawnSync(process.execPath, [bin, "schedule-status"], {
    encoding: "utf8",
    env: { ...process.env, WORK_MEMORY_COMPILER_STATE_DIR: stateDir },
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /"due"/);
});
