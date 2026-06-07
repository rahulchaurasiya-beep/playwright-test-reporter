import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import type {
  ArtifactUploadMeta,
  RocketiumReporterConfig,
  RunStartPayload,
  ShardFinishPayload,
  TestEndPayload,
} from "./types.js";

export class FileSinkClient {
  private readonly config: RocketiumReporterConfig;
  private readonly runDir: string;

  constructor(config: RocketiumReporterConfig) {
    if (!config.outputDir) throw new Error("FileSinkClient requires outputDir");
    this.config = config;
    this.runDir = join(config.outputDir, config.ciBuildId!);
    mkdirSync(join(this.runDir, "tests"), { recursive: true });
    mkdirSync(join(this.runDir, "artifacts"), { recursive: true });
  }

  getRunDirectory(): string {
    return this.runDir;
  }

  async startRun(payload: RunStartPayload): Promise<void> {
    writeFileSync(
      join(this.runDir, "run-start.json"),
      JSON.stringify({ endpoint: "/api/v1/runs/start", payload }, null, 2),
    );
  }

  async reportTest(payload: TestEndPayload): Promise<void> {
    const file = join(
      this.runDir,
      "tests",
      `${String(payload.order).padStart(3, "0")}-${payload.testId}.json`,
    );
    writeFileSync(file, JSON.stringify({ endpoint: "/api/v1/runs/tests", payload }, null, 2));
  }

  async finishShard(payload: ShardFinishPayload): Promise<void> {
    writeFileSync(
      join(this.runDir, "shard-finish.json"),
      JSON.stringify({ endpoint: "/api/v1/runs/shard/finish", payload }, null, 2),
    );
  }

  async uploadArtifact(filePath: string, meta: ArtifactUploadMeta): Promise<void> {
    const dest = join(this.runDir, "artifacts", `${meta.testId}-${basename(filePath)}`);
    if (existsSync(filePath)) copyFileSync(filePath, dest);
  }
}
