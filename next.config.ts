import { execSync } from "node:child_process";
import type { NextConfig } from "next";

function commitSha(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Build-time constant for <meta name="commit"> (compiler.defineServer; the `env` key is legacy).
  compiler: { defineServer: { "process.env.COMMIT_SHA": commitSha() } },
};

export default nextConfig;
