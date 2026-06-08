# playwright-rocketium-reporter

Playwright reporter that streams E2E results to your backend — a self-hosted alternative to `@currents/playwright`.

## Features (v1.0.0)

- Run / shard / spec / test hierarchy matching Currents UI
- Git + GitHub Actions metadata
- Failure artifact upload (screenshots, videos, error-context.md)
- Multi-shard grouping via `ciBuildId` + `shardNumber`
- Per-attempt `retryIndex` on each test result (retries reported separately; shard summary uses the final attempt only)
- Same reporter tuple pattern as Currents

## Install

```bash
pnpm add playwright-rocketium-reporter
# or link locally while developing:
pnpm add file:../playwright-rocketium-reporter
```

## Playwright config

```typescript
import { defineConfig } from "@playwright/test";
import { rocketiumReporter } from "playwright-rocketium-reporter";

export default defineConfig({
  reporter:
    process.env.CI && !process.env.DISABLE_REPORTER
      ? [rocketiumReporter(), ["html", { open: "never" }], ["list"]]
      : [["html", { open: "never" }], ["list"]],
});
```

## Environment variables

Set **either** `REPORTER_API_URL` (stream to backend) **or** `REPORTER_OUTPUT_DIR` (write JSON payloads to disk). `REPORTER_PROJECT_ID` is always required.

| Variable | Required | Description |
|----------|----------|-------------|
| `REPORTER_API_URL` | one of API URL / output dir | Backend base URL. Alias: `ROCKETIUM_REPORTER_API_URL` |
| `REPORTER_OUTPUT_DIR` | one of API URL / output dir | Local directory for file-sink mode (no HTTP). Writes run data under `{outputDir}/{ciBuildId}/`. Alias: `ROCKETIUM_REPORTER_OUTPUT_DIR` |
| `REPORTER_PROJECT_ID` | yes | Project identifier. Alias: `ROCKETIUM_REPORTER_PROJECT_ID` |
| `REPORTER_API_KEY` | no | Bearer token. Alias: `ROCKETIUM_REPORTER_API_KEY` |
| `REPORTER_CI_BUILD_ID` | no | Build/run id. Defaults to `GITHUB_RUN_ID`, then `local-{uuid}` |
| `REPORTER_SHARD_NUMBER` | no | Matrix shard (default `1`). Fallback: `SHARD_NUMBER` |
| `REPORTER_EXPECTED_SHARD_COUNT` | no | e.g. `29`. Fallback: `EXPECTED_SHARD_COUNT` |
| `REPORTER_MACHINE_ID` | no | Machine identifier. Fallback: `HOSTNAME`, then random UUID |
| `REPORTER_TAGS` | no | Comma-separated tags (e.g. `staging,smoke`) |
| `REPORTER_UPLOAD_ARTIFACTS` | no | Set `false` to skip |
| `REPORTER_DEBUG` | no | Set `true` for logs |

### File-sink mode (`REPORTER_OUTPUT_DIR`)

When `outputDir` is set (via env or reporter options), the reporter uses `FileSinkClient` instead of the HTTP API. Each run is written to:

```
{REPORTER_OUTPUT_DIR}/{ciBuildId}/
  run-start.json
  shard-finish.json
  tests/
    001-{testId}-r0.json
    001-{testId}-r1.json   # one file per retry attempt
  artifacts/
    {testId}-r0-{filename}
```

Useful for local debugging or offline ingestion without a running backend.

### Retries (`retryIndex`)

Each Playwright retry emits a separate `onTestEnd` event. The reporter sends `retryIndex` (0-based, from `result.retry`) on every `/api/v1/runs/tests` payload so the backend/UI can mark flaky tests. Intermediate failed attempts are still reported (with artifacts when enabled), but the shard `summary` counts only the **final** attempt per test.

```typescript
// via env
process.env.REPORTER_OUTPUT_DIR = "./reporter-output";
process.env.REPORTER_PROJECT_ID = "rocketium-staging";

// or via reporter options
reporter: [rocketiumReporter({ outputDir: "./reporter-output", projectId: "rocketium-staging" })],
```

## GitHub Actions (staging shard)

Add to your test job:

```yaml
env:
  REPORTER_API_URL: ${{ secrets.REPORTER_API_URL }}
  REPORTER_PROJECT_ID: rocketium-staging
  REPORTER_API_KEY: ${{ secrets.REPORTER_API_KEY }}
  REPORTER_CI_BUILD_ID: ${{ github.run_id }}
  REPORTER_SHARD_NUMBER: ${{ matrix.shard }}
  REPORTER_EXPECTED_SHARD_COUNT: 29
```

## Backend API

See [docs/api-contract.md](./docs/api-contract.md) for endpoint payloads.

## Development

```bash
pnpm install
pnpm build
pnpm type-check
```

## License

ISC