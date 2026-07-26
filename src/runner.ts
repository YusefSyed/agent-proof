import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Check, CheckResult, EvidenceReport, Manifest } from "./types.js";

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_OUTPUT_CHARS = 12_000;
const BUILT_IN_REDACTIONS = [
  /(?:api[_-]?key|token|password|secret)\s*[=:]\s*[^\s"']+/gi,
  /(?:sk|ghp)_[A-Za-z0-9_-]{8,}/g,
];

function redact(value: string, custom: string[]): string {
  let result = value;
  for (const pattern of BUILT_IN_REDACTIONS) result = result.replace(pattern, "[REDACTED]");
  for (const secret of custom.filter(Boolean)) result = result.replaceAll(secret, "[REDACTED]");
  return result;
}

function truncate(value: string, maxChars: number): string {
  return value.length <= maxChars ? value : `${value.slice(0, maxChars)}\n[TRUNCATED ${value.length - maxChars} characters]`;
}

function safeOutput(value: unknown, manifest: Manifest): string {
  const output = typeof value === "string" ? value : "";
  return truncate(redact(output, manifest.redact ?? []), manifest.maxOutputChars ?? DEFAULT_MAX_OUTPUT_CHARS);
}

function validate(manifest: Manifest): void {
  if (manifest.version !== 1 || !manifest.task || !Array.isArray(manifest.allowedCommands) || !Array.isArray(manifest.checks)) {
    throw new Error("Invalid manifest: version, task, allowedCommands, and checks are required.");
  }
  for (const check of manifest.checks) {
    if (!check.id || !check.command || (check.args && !check.args.every((arg) => typeof arg === "string"))) {
      throw new Error("Invalid check: id, command, and string args are required.");
    }
  }
}

export async function runCheck(check: Check, manifest: Manifest, baseCwd: string): Promise<CheckResult> {
  const started = performance.now();
  const args = check.args ?? [];
  const cwd = check.cwd ?? baseCwd;
  const resultBase = { id: check.id, command: check.command, args, cwd };
  if (!manifest.allowedCommands.includes(check.command)) {
    return { ...resultBase, status: "disallowed", exitCode: null, durationMs: Math.round(performance.now() - started), stdout: "", stderr: `Command '${check.command}' is not in allowedCommands.` };
  }
  try {
    const output = await execFileAsync(check.command, args, {
      cwd,
      timeout: check.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
      windowsHide: true,
      shell: false,
    });
    return { ...resultBase, status: "passed", exitCode: 0, durationMs: Math.round(performance.now() - started), stdout: safeOutput(output.stdout, manifest), stderr: safeOutput(output.stderr, manifest) };
  } catch (error: unknown) {
    const failure = error as NodeJS.ErrnoException & { code?: number | string; killed?: boolean; stdout?: string; stderr?: string };
    const timedOut = failure.killed === true;
    return {
      ...resultBase,
      status: timedOut ? "timed_out" : "failed",
      exitCode: typeof failure.code === "number" ? failure.code : null,
      durationMs: Math.round(performance.now() - started),
      stdout: safeOutput(failure.stdout, manifest),
      stderr: safeOutput(failure.stderr || failure.message, manifest),
    };
  }
}

export async function runManifest(manifest: Manifest, baseCwd: string): Promise<EvidenceReport> {
  validate(manifest);
  const checks = [];
  for (const check of manifest.checks) checks.push(await runCheck(check, manifest, baseCwd));
  return { schemaVersion: 1, task: manifest.task, generatedAt: new Date().toISOString(), passed: checks.every((check) => check.status === "passed"), checks };
}
