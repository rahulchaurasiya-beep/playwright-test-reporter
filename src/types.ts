export type TestStatus = "passed" | "failed" | "skipped" | "timedOut" | "interrupted";

export type RunStatus = "passed" | "failed" | "running";

export type GitInfo = {
  branch: string | null;
  sha: string | null;
  authorName: string | null;
  authorEmail: string | null;
  commitMessage: string | null;
  remoteOrigin: string | null;
};

export type CiInfo = {
  ciBuildId: string;
  workflowRunId: string | null;
  workflowRunUrl: string | null;
  repository: string | null;
  prTitle: string | null;
  prNumber: number | null;
};

export type RocketiumReporterConfig = {
  apiUrl?: string;
  apiKey?: string;
  projectId: string;
  ciBuildId?: string;
  shardNumber?: number;
  expectedShardCount?: number;
  machineId?: string;
  tags?: string[];
  uploadArtifacts?: boolean;
  debug?: boolean;
  outputDir?: string;
};

export type RunStartPayload = {
  projectId: string;
  ciBuildId: string;
  shardNumber: number;
  expectedShardCount?: number;
  machineId: string;
  tags?: string[];
  git: GitInfo;
  ci: CiInfo;
  playwrightVersion: string;
  startedAt: string;
};

export type TestEndPayload = {
  ciBuildId: string;
  shardNumber: number;
  machineId: string;
  specPath: string;
  projectName: string;
  title: string[];
  testId: string;
  order: number;
  status: TestStatus;
  durationMs: number;
  startedAt: string;
  endedAt: string;
  retryIndex: number;
  error: {
    message: string;
    stack: string | null;
    snippet: string | null;
  } | null;
};

export type ShardFinishPayload = {
  ciBuildId: string;
  shardNumber: number;
  machineId: string;
  endedAt: string;
  summary: {
    passed: number;
    failed: number;
    skipped: number;
    timedOut: number;
    interrupted: number;
    total: number;
  };
};

export type ArtifactUploadMeta = {
  ciBuildId: string;
  shardNumber: number;
  machineId: string;
  testId: string;
  retryIndex: number;
  specPath: string;
  name: string;
  contentType: string;
};
