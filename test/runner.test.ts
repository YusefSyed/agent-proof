import assert from "node:assert/strict";
import test from "node:test";
import { runCheck } from "../src/runner.js";
import type { Manifest } from "../src/types.js";

const base: Manifest = { version: 1, task: "test", allowedCommands: ["node"], checks: [] };

test("records a passing command", async () => {
  const result = await runCheck({ id: "pass", command: "node", args: ["-e", "console.log('ok')"] }, base, process.cwd());
  assert.equal(result.status, "passed");
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /ok/);
});

test("records a failing command and its exit code", async () => {
  const result = await runCheck({ id: "fail", command: "node", args: ["-e", "console.error('broken'); process.exit(7)"] }, base, process.cwd());
  assert.equal(result.status, "failed");
  assert.equal(result.exitCode, 7);
  assert.match(result.stderr, /broken/);
});

test("times out a command", async () => {
  const result = await runCheck({ id: "timeout", command: "node", args: ["-e", "setTimeout(() => {}, 1000)"], timeoutMs: 20 }, base, process.cwd());
  assert.equal(result.status, "timed_out");
  assert.equal(result.exitCode, null);
});

test("does not run commands outside the allowlist", async () => {
  const result = await runCheck({ id: "blocked", command: "echo", args: ["should-not-run"] }, base, process.cwd());
  assert.equal(result.status, "disallowed");
  assert.match(result.stderr, /not in allowedCommands/);
});

test("redacts configured secrets and truncates output", async () => {
  const manifest: Manifest = { ...base, redact: ["private-value"], maxOutputChars: 20 };
  const result = await runCheck({ id: "redact", command: "node", args: ["-e", "console.log('private-value api_key=also-secret sk-proj-example123456 12345678901234567890')"] }, manifest, process.cwd());
  assert.equal(result.status, "passed");
  assert.doesNotMatch(result.stdout, /private-value|also-secret|sk-proj-example123456/);
  assert.match(result.stdout, /REDACTED|TRUNCATED/);
});
