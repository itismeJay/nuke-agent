import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev indicator out of the bottom-left corner so it doesn't overlap
  // the app sidebar's account menu.
  devIndicators: {
    position: "bottom-right",
  },
  experimental: {
    // Résumé uploads go through a Server Action as multipart FormData. The
    // default 1 MB body cap is too small; the bucket + server-side validation
    // enforce the real 10 MB limit.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
