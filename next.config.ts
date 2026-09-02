import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev indicator out of the bottom-left corner so it doesn't overlap
  // the app sidebar's account menu.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
