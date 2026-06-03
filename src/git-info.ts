import { execSync } from "node:child_process";
import type { CiInfo, GitInfo } from "./types.js";

function runGit(args: string): string | null {
  try {
    return execSync(`git ${args}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

export function collectGitInfo(): GitInfo {
  return {
    branch:
      process.env.GITHUB_HEAD_REF ??
      process.env.GITHUB_REF_NAME ??
      runGit("rev-parse --abbrev-ref HEAD"),
    sha: process.env.GITHUB_SHA ?? runGit("rev-parse HEAD"),
    authorName: runGit("log -1 --format=%an"),
    authorEmail: runGit("log -1 --format=%ae"),
    commitMessage: runGit("log -1 --format=%s"),
    remoteOrigin: runGit("config --get remote.origin.url"),
  };
}

export function collectCiInfo(ciBuildId: string): CiInfo {
  const repository = process.env.GITHUB_REPOSITORY ?? null;
  const workflowRunId = process.env.GITHUB_RUN_ID ?? null;

  return {
    ciBuildId,
    workflowRunId,
    workflowRunUrl:
      repository && workflowRunId
        ? `https://github.com/${repository}/actions/runs/${workflowRunId}`
        : null,
    repository,
    prTitle: process.env.GITHUB_PR_TITLE ?? null,
    prNumber: process.env.GITHUB_PR_NUMBER
      ? Number.parseInt(process.env.GITHUB_PR_NUMBER, 10)
      : null,
  };
}
