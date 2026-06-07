import type { TestResult } from "@playwright/test/reporter";
import type { ReporterClient } from "./client.js";
import type { ArtifactUploadMeta, RocketiumReporterConfig, TestStatus } from "./types.js";

function mapStatus(status: TestResult["status"]): TestStatus {
  return status;
}

export async function uploadTestArtifacts(
  client: ReporterClient,
  config: RocketiumReporterConfig,
  params: {
    testId: string;
    specPath: string;
    result: TestResult;
  },
): Promise<void> {
  if (!config.uploadArtifacts || params.result.status === "passed") return;

  for (const attachment of params.result.attachments) {
    if (!attachment.path) continue;

    const meta: ArtifactUploadMeta = {
      ciBuildId: config.ciBuildId!,
      shardNumber: config.shardNumber!,
      machineId: config.machineId!,
      testId: params.testId,
      specPath: params.specPath,
      name: attachment.name,
      contentType: attachment.contentType ?? guessContentType(attachment.name),
    };

    await client.uploadArtifact(attachment.path, meta);
  }
}

function guessContentType(name: string): string {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webm")) return "video/webm";
  if (name.endsWith(".mp4")) return "video/mp4";
  if (name.endsWith(".md")) return "text/markdown";
  if (name.endsWith(".zip")) return "application/zip";
  return "application/octet-stream";
}

export { mapStatus };
