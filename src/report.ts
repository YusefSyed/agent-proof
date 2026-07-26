import type { EvidenceReport } from "./types.js";

const fenceSafe = (text: string) => text.replaceAll("```", "`\u200b``");

export function toMarkdown(report: EvidenceReport): string {
  const lines = ["# Agent Proof evidence report", "", `**Task:** ${report.task}`, `**Generated:** ${report.generatedAt}`, `**Overall result:** ${report.passed ? "PASSED" : "FAILED"}`, ""];
  for (const check of report.checks) {
    lines.push(`## ${check.id}: ${check.status.toUpperCase()}`, "", `- Command: \`${[check.command, ...check.args].join(" ")}\``, `- Exit code: ${check.exitCode ?? "n/a"}`, `- Duration: ${check.durationMs} ms`, `- Working directory: \`${check.cwd}\``, "", "### stdout", "", "```text", fenceSafe(check.stdout || "(empty)"), "```", "", "### stderr", "", "```text", fenceSafe(check.stderr || "(empty)"), "```", "");
  }
  return lines.join("\n");
}
