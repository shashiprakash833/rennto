import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,

  allowedDevOrigins: ["192.168.88.17", "192.168.88.42", "192.168.29.207", "localhost"],
  devIndicators: false,
};

export default nextConfig;
