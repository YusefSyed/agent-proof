export interface Check {
  id: string;
  command: string;
  args?: string[];
  cwd?: string;
  timeoutMs?: number;
}

export interface Manifest {
  version: 1;
  task: string;
  allowedCommands: string[];
  checks: Check[];
  redact?: string[];
  maxOutputChars?: number;
}

export interface CheckResult {
  id: string;
  command: string;
  args: string[];
  cwd: string;
  status: "passed" | "failed" | "timed_out" | "disallowed";
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
}

export interface EvidenceReport {
  schemaVersion: 1;
  task: string;
  generatedAt: string;
  passed: boolean;
  checks: CheckResult[];
}
