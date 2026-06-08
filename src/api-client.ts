import { readFileSync } from "node:fs";
import { basename } from "node:path";
import type {
  ArtifactUploadMeta,
  RocketiumReporterConfig,
  RunStartPayload,
  ShardFinishPayload,
  TestEndPayload,
} from "./types.js";

export class ReporterApiClient {
  private readonly config: RocketiumReporterConfig;

  constructor(config: RocketiumReporterConfig) {
    this.config = config;
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.config.apiKey) headers.Authorization = `Bearer ${this.config.apiKey}`;
    return headers;
  }

  private log(message: string, detail?: unknown): void {
    if (!this.config.debug) return;
    if (detail !== undefined) {
      console.log(`[rocketium-reporter] ${message}`, detail);
      return;
    }
    console.log(`[rocketium-reporter] ${message}`);
  }

  private url(path: string): string {
    if (!this.config.apiUrl) throw new Error("ReporterApiClient requires apiUrl");
    return `${this.config.apiUrl}${path}`;
  }

  async startRun(payload: RunStartPayload): Promise<void> {
    await this.post("/api/v1/runs/start", payload);
    this.log("run started", { ciBuildId: payload.ciBuildId, shard: payload.shardNumber });
  }

  async reportTest(payload: TestEndPayload): Promise<void> {
    await this.post("/api/v1/runs/tests", payload);
    this.log("test reported", { testId: payload.testId, status: payload.status });
  }

  async finishShard(payload: ShardFinishPayload): Promise<void> {
    await this.post("/api/v1/runs/shard/finish", payload);
    this.log("shard finished", payload.summary);
  }

  async uploadArtifact(filePath: string, meta: ArtifactUploadMeta): Promise<void> {
    const form = new FormData();
    const buffer = readFileSync(filePath);

    form.append("ciBuildId", meta.ciBuildId);
    form.append("shardNumber", String(meta.shardNumber));
    form.append("machineId", meta.machineId);
    form.append("testId", meta.testId);
    form.append("retryIndex", String(meta.retryIndex));
    form.append("specPath", meta.specPath);
    form.append("name", meta.name);
    form.append("contentType", meta.contentType);
    form.append("file", new Blob([buffer], { type: meta.contentType }), basename(filePath));

    const headers: Record<string, string> = {};
    if (this.config.apiKey) headers.Authorization = `Bearer ${this.config.apiKey}`;

    const response = await fetch(this.url("/api/v1/runs/artifacts"), {
      method: "POST",
      headers,
      body: form,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Artifact upload failed (${response.status}): ${body}`);
    }

    this.log("artifact uploaded", { name: meta.name, testId: meta.testId });
  }

  private async post(path: string, body: unknown): Promise<void> {
    const response = await fetch(this.url(path), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Reporter API ${path} failed (${response.status}): ${text}`);
    }
  }
}
