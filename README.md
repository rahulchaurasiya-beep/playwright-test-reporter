# @rahul_rc34/playwright-reporter

Playwright reporter that streams E2E results to your backend — a self-hosted alternative to `@currents/playwright`.

## Features (v0.1)

- Run / shard / spec / test hierarchy matching Currents UI
- Git + GitHub Actions metadata
- Failure artifact upload (screenshots, videos, error-context.md)
- Multi-shard grouping via `ciBuildId` + `shardNumber`
- Same reporter tuple pattern as Currents

## Install

```bash
pnpm add @rahul_rc34/playwright-reporter
# or link locally while developing:
pnpm add file:../rocketium-playwright-reporter
```

## Playwright config

```typescript
import { defineConfig } from "@playwright/test";
import { rocketiumReporter } from "@rahul_rc34/playwright-reporter";

export default defineConfig({
  reporter:
    process.env.CI && !process.env.DISABLE_REPORTER
      ? [rocketiumReporter(), ["html", { open: "never" }], ["list"]]
      : [["html", { open: "never" }], ["list"]],
});
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REPORTER_API_URL` | yes | Backend base URL |
| `REPORTER_PROJECT_ID` | yes | Project identifier |
| `REPORTER_API_KEY` | no | Bearer token |
| `REPORTER_CI_BUILD_ID` | no | Defaults to `GITHUB_RUN_ID` |
| `REPORTER_SHARD_NUMBER` | no | Matrix shard (default `1`) |
| `REPORTER_EXPECTED_SHARD_COUNT` | no | e.g. `29` |
| `REPORTER_UPLOAD_ARTIFACTS` | no | Set `false` to skip |
| `REPORTER_DEBUG` | no | Set `true` for logs |

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
