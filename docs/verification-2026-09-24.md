# Verification record - 2026-09-24

Checks run in a fresh clone using the committed dependency lock:

| Command | Result |
| --- | --- |
| `npm ci` | Locked dependencies installed |
| `npm run typecheck` | Passed |
| `npm test` | 5 tests passed |
| `npm audit --omit=dev` | 0 production-dependency vulnerabilities reported |

The tests cover passing and failing checks, timeouts, disallowed commands, and
redaction/truncation. These results describe this checkout and environment;
the dependency audit excludes development dependencies.

Distribution remains source-only: clone the repository and follow the
[README](../README.md). The package is not published to npm.
