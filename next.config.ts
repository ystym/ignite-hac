import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep manual UI review screenshots free of the development-only overlay.
  devIndicators: false,
  serverExternalPackages: ["unpdf"],
  images: {
    // Sample assets and user-uploaded originals are served from this machine.
    // Disabling the optimizer avoids a native sharp dependency and keeps the
    // hackathon demo self-contained.
    unoptimized: true,
  },
};

export default nextConfig;
