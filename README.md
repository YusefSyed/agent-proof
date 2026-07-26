# Agent Proof

[![CI](https://github.com/YusefSyed/agent-proof/actions/workflows/ci.yml/badge.svg)](https://github.com/YusefSyed/agent-proof/actions/workflows/ci.yml)

Agent Proof is a small TypeScript CLI for recording the checks run after an agent-assisted code change. A reviewer chooses the commands; Agent Proof runs them and writes local JSON and Markdown reports.

It has no runtime dependencies, does not call an AI service and does not send code anywhere.

## What it records

For each check, the report includes:

- command and arguments
- working directory
- status and exit code
- duration
- captured stdout and stderr
- overall pass/fail status

The report proves only that those commands ran in that environment. It does not prove that the implementation is correct or replace code review, security analysis or product testing.

## Safety boundaries

- Uses Node's `execFile` with `shell: false`; arguments are never interpolated into a shell command.
- Runs a command only when its executable appears exactly in `allowedCommands`.
- Applies a 30-second timeout and 1 MiB process buffer by default.
- Redacts common credential formats and exact project-specific values before writing reports.
- Truncates captured output to 12,000 characters by default.

Agent Proof is not a sandbox. Use it only with trusted manifests, commands, working directories and environments. Do not place credentials in arguments or intentionally print an environment containing secrets.

## Quick start

```bash
npm ci
npm run example
cat evidence/evidence.md
```

To run a manifest directly:

```bash
npm run build
node dist/src/cli.js run examples/manifest.json --out evidence
```

## Manifest

`examples/manifest.json` is a complete starting point.

```json
{
  "version": 1,
  "task": "Verify the local TypeScript project before review",
  "allowedCommands": ["npm", "node"],
  "redact": ["a-value-that-must-never-appear-in-evidence"],
  "maxOutputChars": 12000,
  "checks": [
    {
      "id": "typecheck",
      "command": "npm",
      "args": ["run", "typecheck"],
      "timeoutMs": 60000
    }
  ]
}
```

Keep allowlists narrow. `cwd`, when provided, is resolved by Node relative to the process running Agent Proof.

## Reports

The selected output directory receives:

- `evidence.json` — machine-readable evidence report.
- `evidence.md` — a reviewer-friendly report with each command's result and captured output.

The CLI exits `0` when every check passes, `1` when a check fails, times out or is disallowed, and `2` for invalid input or invocation.

## Development

```bash
npm ci
npm run typecheck
npm test
npm audit
```

The test suite covers passing and failing checks, timeouts, disallowed commands, and redaction/truncation. GitHub Actions runs the same verification on pushes and pull requests.

## License

MIT. See [LICENSE](LICENSE).
