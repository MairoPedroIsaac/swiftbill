import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lint is run separately (npm run lint); type errors still fail the build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
