import { randomUUID } from "node:crypto";
import type { RocketiumReporterConfig } from "./types.js";

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readInt(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function resolveConfig(
  options: Partial<RocketiumReporterConfig> = {},
): RocketiumReporterConfig {
  const outputDir =
    emptyToUndefined(options.outputDir) ??
    emptyToUndefined(process.env.REPORTER_OUTPUT_DIR) ??
    emptyToUndefined(process.env.ROCKETIUM_REPORTER_OUTPUT_DIR);

  const apiUrl =
    emptyToUndefined(options.apiUrl) ??
    emptyToUndefined(process.env.REPORTER_API_URL) ??
    emptyToUndefined(process.env.ROCKETIUM_REPORTER_API_URL);

  if (!outputDir && !apiUrl) {
    throw new Error(
      "Rocketium reporter: set REPORTER_API_URL or REPORTER_OUTPUT_DIR",
    );
  }

  const projectId =
    emptyToUndefined(options.projectId) ??
    emptyToUndefined(process.env.REPORTER_PROJECT_ID) ??
    emptyToUndefined(process.env.ROCKETIUM_REPORTER_PROJECT_ID);

  if (!projectId) {
    throw new Error(
      "Rocketium reporter: projectId is required (set REPORTER_PROJECT_ID or pass projectId in reporter options)",
    );
  }

  const ciBuildId =
    emptyToUndefined(options.ciBuildId) ??
    emptyToUndefined(process.env.REPORTER_CI_BUILD_ID) ??
    emptyToUndefined(process.env.GITHUB_RUN_ID) ??
    `local-${randomUUID()}`;

  const shardNumber =
    options.shardNumber ??
    readInt(process.env.REPORTER_SHARD_NUMBER) ??
    readInt(process.env.SHARD_NUMBER) ??
    1;

  const expectedShardCount =
    options.expectedShardCount ??
    readInt(process.env.REPORTER_EXPECTED_SHARD_COUNT) ??
    readInt(process.env.EXPECTED_SHARD_COUNT);

  const machineId =
    options.machineId ??
    process.env.REPORTER_MACHINE_ID ??
    process.env.HOSTNAME ??
    randomUUID();

  const tags =
    options.tags ??
    (process.env.REPORTER_TAGS ? process.env.REPORTER_TAGS.split(",").map((t) => t.trim()) : undefined);

  return {
    apiUrl: apiUrl?.replace(/\/$/, ""),
    apiKey:
      emptyToUndefined(options.apiKey) ??
      emptyToUndefined(process.env.REPORTER_API_KEY) ??
      emptyToUndefined(process.env.ROCKETIUM_REPORTER_API_KEY),
    projectId,
    ciBuildId,
    shardNumber,
    expectedShardCount,
    machineId,
    tags,
    uploadArtifacts: options.uploadArtifacts ?? process.env.REPORTER_UPLOAD_ARTIFACTS !== "false",
    debug: options.debug ?? process.env.REPORTER_DEBUG === "true",
    outputDir,
  };
}
