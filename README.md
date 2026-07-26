# Agent Proof

Agent Proof is a small TypeScript CLI that turns an engineering verification plan into reviewable evidence. It is designed for teams using coding agents who still want the normal discipline: a human selects the checks, reviews the changes, and can inspect the exact verification result.

It does not call an AI service, send code anywhere, or require a secret. Its output is local JSON and Markdown evidence, suitable for a pull request, release checklist, or audit trail.

## What it proves

For every requested check, Agent Proof records the command and arguments, working directory, status, exit code, duration, stdout, and stderr. It also produces an overall pass/fail result. This is evidence that AI-assisted work was verified; it is not a substitute for human review, security assessment, or a sandbox.

## Safety model

- Commands are executed with Node's `execFile`, with `shell: false`. Arguments are passed as an array, so manifest values are never interpolated into a shell command.
- A check runs only when its executable name appears exactly in `allowedCommands`.
- Each check has a timeout (30 seconds by default) and a 1 MiB process buffer.
- Output is redacted before writing reports. Built-in patterns cover common `api_key=`, token, password, secret, `sk_`, and `ghp_` values; add exact project-specific values under `redact`.
- Output is truncated to 12,000 characters by default. Choose allowlisted commands and manifests you trust: this tool deliberately executes the verification checks the reviewer has approved.

## Quick start

```bash
npm install
npm run example
cat evidence/evidence.md
```

Or run a manifest directly:

```bash
npx agent-proof run examples/manifest.json --out evidence
```

The CLI exits `0` only if every check passes; failed, timed-out, or disallowed checks produce reports and exit `1`. Invalid invocation or manifest parsing errors exit `2`.

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

Keep allowlists narrow. For example, use `npm` rather than a broad shell command, and do not place credentials in command arguments or environment output. `cwd`, if provided, is resolved by Node relative to the process running Agent Proof.

## Reports

The selected output directory receives:

- `evidence.json` — machine-readable evidence report.
- `evidence.md` — a reviewer-friendly report with each command's result and captured output.

## Development

```bash
npm run lint
npm run typecheck
npm test
```

The test suite covers passing and failing checks, timeouts, disallowed commands, and redaction/truncation. GitHub Actions runs the same verification on pushes and pull requests.

## License

MIT. See [LICENSE](LICENSE).
