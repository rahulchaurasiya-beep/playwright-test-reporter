import { FileSinkClient } from "./file-sink-client.js";
import { ReporterApiClient } from "./api-client.js";
import type { RocketiumReporterConfig } from "./types.js";

export type ReporterClient = ReporterApiClient | FileSinkClient;

export function createReporterClient(config: RocketiumReporterConfig): ReporterClient {
  return config.outputDir ? new FileSinkClient(config) : new ReporterApiClient(config);
}

export function isFileSinkClient(client: ReporterClient): client is FileSinkClient {
  return client instanceof FileSinkClient;
}
