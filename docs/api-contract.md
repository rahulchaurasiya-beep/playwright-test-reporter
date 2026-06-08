# Backend API contract

The reporter sends data to four endpoints. Implement these on your backend to match the Currents UI data model.

Base URL: `REPORTER_API_URL` (e.g. `https://api.example.com`)

Auth (optional): `Authorization: Bearer {REPORTER_API_KEY}`

---

## POST `/api/v1/runs/start`

Called once per shard when Playwright `onBegin` fires.

```json
{
  "projectId": "R7g5kj",
  "ciBuildId": "123456789",
  "shardNumber": 5,
  "expectedShardCount": 29,
  "machineId": "runner-abc",
  "tags": ["staging"],
  "git": {
    "branch": "feature/foo",
    "sha": "abc123",
    "authorName": "Jane",
    "authorEmail": "jane@example.com",
    "commitMessage": "fix: archive test",
    "remoteOrigin": "git@github.com:org/repo.git"
  },
  "ci": {
    "ciBuildId": "123456789",
    "workflowRunId": "123456789",
    "workflowRunUrl": "https://github.com/org/repo/actions/runs/123456789",
    "repository": "org/repo",
    "prTitle": null,
    "prNumber": null
  },
  "playwrightVersion": "1.59.1",
  "startedAt": "2026-06-03T12:00:00.000Z"
}
```

**Backend:** upsert `Run` by `ciBuildId`, create `RunShard` for `shardNumber`.

---

## POST `/api/v1/runs/tests`

Called after each test (`onTestEnd`).

```json
{
  "ciBuildId": "123456789",
  "shardNumber": 5,
  "machineId": "runner-abc",
  "specPath": "/path/to/e2e/foo/archive.spec.ts",
  "projectName": "staging-e2e",
  "title": ["Archive", "test archive operations"],
  "testId": "abc-def-123",
  "order": 3,
  "status": "failed",
  "durationMs": 45000,
  "startedAt": "2026-06-03T12:01:00.000Z",
  "endedAt": "2026-06-03T12:01:45.000Z",
  "retryIndex": 0,
  "error": {
    "message": "Timeout 30000ms exceeded",
    "stack": "...",
    "snippet": "..."
  }
}
```

**Backend:** upsert `SpecResult` (by run + shard + specPath), insert `TestResult`.

---

## POST `/api/v1/runs/artifacts`

Multipart form. Called for each attachment on failed tests.

Fields:

| Field | Type |
|-------|------|
| ciBuildId | string |
| shardNumber | number |
| machineId | string |
| testId | string |
| retryIndex | number |
| specPath | string |
| name | string |
| contentType | string |
| file | binary |

**Backend:** store file (S3/disk), link to `TestResult` as `Artifact`.

---

## POST `/api/v1/runs/shard/finish`

Called when shard completes (`onEnd`).

```json
{
  "ciBuildId": "123456789",
  "shardNumber": 5,
  "machineId": "runner-abc",
  "endedAt": "2026-06-03T12:30:00.000Z",
  "summary": {
    "passed": 10,
    "failed": 1,
    "skipped": 0,
    "timedOut": 0,
    "interrupted": 0,
    "total": 11
  }
}
```

**Backend:** mark shard finished. When `finishedShards >= expectedShardCount`, compute run-level status and duration.

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `REPORTER_API_URL` | Backend base URL (required) |
| `REPORTER_PROJECT_ID` | Project id (required) |
| `REPORTER_API_KEY` | Bearer token (optional) |
| `REPORTER_CI_BUILD_ID` | Defaults to `GITHUB_RUN_ID` |
| `REPORTER_SHARD_NUMBER` | Shard id (default `1`) |
| `REPORTER_EXPECTED_SHARD_COUNT` | e.g. `29` for staging |
| `REPORTER_UPLOAD_ARTIFACTS` | `false` to disable uploads |
| `REPORTER_DEBUG` | `true` for verbose logs |
