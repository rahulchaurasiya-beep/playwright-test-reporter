import type { RocketiumReporterConfig } from "@rocketium/playwright-reporter";

const config: RocketiumReporterConfig = {
  apiUrl: process.env.REPORTER_API_URL || "http://localhost:3000",
  projectId: process.env.REPORTER_PROJECT_ID || "rocketium-staging",
  // apiKey, ciBuildId, shardNumber — usually set via env in CI
};

export default config;
