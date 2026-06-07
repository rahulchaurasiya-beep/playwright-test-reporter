import { createRequire } from "node:module";
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import { createReporterClient, isFileSinkClient } from "./client.js";
import { uploadTestArtifacts, mapStatus } from "./artifacts.js";
import { resolveConfig } from "./config.js";
import { collectCiInfo, collectGitInfo } from "./git-info.js";
import type { RocketiumReporterConfig, TestEndPayload } from "./types.js";

const require = createRequire(import.meta.url);
const playwrightVersion: string = require("@playwright/test/package.json").version;

type TestTiming = {
  startedAt: string;
  order: number;
};

export default class RocketiumReporter implements Reporter {
  private config!: RocketiumReporterConfig;
  private client!: ReturnType<typeof createReporterClient>;
  private runStartedAt!: string;
  private testOrder = 0;
  private testTimings = new Map<string, TestTiming>();
  private summary = {
    passed: 0,
    failed: 0,
    skipped: 0,
    timedOut: 0,
    interrupted: 0,
    total: 0,
  };
  private errors: string[] = [];

  constructor(options: Partial<RocketiumReporterConfig> = {}) {
    this.config = resolveConfig(options);
    this.client = createReporterClient(this.config);
  }

  printsToStdio(): boolean {
    return false;
  }

  async onBegin(_config: FullConfig, _suite: Suite): Promise<void> {
    this.runStartedAt = new Date().toISOString();

    try {
      await this.client.startRun({
        projectId: this.config.projectId,
        ciBuildId: this.config.ciBuildId!,
        shardNumber: this.config.shardNumber!,
        expectedShardCount: this.config.expectedShardCount,
        machineId: this.config.machineId!,
        tags: this.config.tags,
        git: collectGitInfo(),
        ci: collectCiInfo(this.config.ciBuildId!),
        playwrightVersion,
        startedAt: this.runStartedAt,
      });
    } catch (error) {
      this.recordError("Failed to start run", error);
    }
  }

  onTestBegin(test: TestCase): void {
    this.testTimings.set(test.id, {
      startedAt: new Date().toISOString(),
      order: ++this.testOrder,
    });
  }

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    const timing = this.testTimings.get(test.id);
    const startedAt = timing?.startedAt ?? new Date(Date.now() - result.duration).toISOString();
    const endedAt = new Date().toISOString();
    const order = timing?.order ?? this.testOrder;

    this.incrementSummary(result.status);

    const payload: TestEndPayload = {
      ciBuildId: this.config.ciBuildId!,
      shardNumber: this.config.shardNumber!,
      machineId: this.config.machineId!,
      specPath: test.location.file,
      projectName: test.parent.project()?.name ?? "unknown",
      title: test.titlePath(),
      testId: test.id,
      order,
      status: mapStatus(result.status),
      durationMs: result.duration,
      startedAt,
      endedAt,
      retryIndex: result.retry,
      error: result.error
        ? {
            message: result.error.message ?? "Unknown error",
            stack: result.error.stack ?? null,
            snippet: result.error.snippet ?? null,
          }
        : null,
    };

    try {
      await this.client.reportTest(payload);
      await uploadTestArtifacts(this.client, this.config, {
        testId: test.id,
        specPath: test.location.file,
        result,
      });
    } catch (error) {
      this.recordError(`Failed to report test "${test.title}"`, error);
    }
  }

  async onEnd(_result: FullResult): Promise<void> {
    try {
      await this.client.finishShard({
        ciBuildId: this.config.ciBuildId!,
        shardNumber: this.config.shardNumber!,
        machineId: this.config.machineId!,
        endedAt: new Date().toISOString(),
        summary: { ...this.summary },
      });
    } catch (error) {
      this.recordError("Failed to finish shard", error);
    }

    for (const message of this.errors) {
      console.error(`[rocketium-reporter] ${message}`);
    }

    if (isFileSinkClient(this.client)) {
      console.log(`[rocketium-reporter] Payloads saved to: ${this.client.getRunDirectory()}`);
    }
  }

  private incrementSummary(status: TestResult["status"]): void {
    this.summary.total += 1;
    if (status === "passed") this.summary.passed += 1;
    else if (status === "failed") this.summary.failed += 1;
    else if (status === "skipped") this.summary.skipped += 1;
    else if (status === "timedOut") this.summary.timedOut += 1;
    else if (status === "interrupted") this.summary.interrupted += 1;
  }

  private recordError(context: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.errors.push(`${context}: ${message}`);
  }
}

/**
 * Playwright reporter tuple helper (same pattern as currentsReporter).
 *
 * @example
 * reporter: process.env.CI
 *   ? [rocketiumReporter(), ["html", { open: "never" }], ["list"]]
 *   : [["html", { open: "never" }], ["list"]]
 */
export function rocketiumReporter(
  config?: Partial<RocketiumReporterConfig>,
): [string, Partial<RocketiumReporterConfig>] {
  return ["playwright-rocketium-reporter", config ?? {}];
}

export type { RocketiumReporterConfig } from "./types.js";
