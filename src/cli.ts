#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { toMarkdown } from "./report.js";
import { runManifest } from "./runner.js";
import type { Manifest } from "./types.js";

function usage(): never { throw new Error("Usage: agent-proof run <manifest.json> [--out <directory>]"); }

async function main(): Promise<void> {
  const [, , command, manifestPath, ...rest] = process.argv;
  if (command !== "run" || !manifestPath) usage();
  const outIndex = rest.indexOf("--out");
  if (outIndex !== -1 && (!rest[outIndex + 1] || rest.length !== 2)) usage();
  if (outIndex === -1 && rest.length > 0) usage();
  const manifestFile = resolve(manifestPath);
  const outputDirectory = resolve(outIndex === -1 ? "evidence" : rest[outIndex + 1]);
  const manifest = JSON.parse(await readFile(manifestFile, "utf8")) as Manifest;
  const report = await runManifest(manifest, dirname(manifestFile));
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDirectory, "evidence.json"), `${JSON.stringify(report, null, 2)}\n`),
    writeFile(resolve(outputDirectory, "evidence.md"), toMarkdown(report)),
  ]);
  process.stdout.write(`Wrote ${resolve(outputDirectory, "evidence.json")} and evidence.md\n`);
  process.exitCode = report.passed ? 0 : 1;
}

main().catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 2; });
