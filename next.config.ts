import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: without this, Turbopack walks up past the repo and
  // picks up an unrelated lockfile from the home directory.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;
