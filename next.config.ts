import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output standalone برای self-host؛ روی Vercel نادیده گرفته می‌شود.
  output: "standalone",
  // هیچ suppression پنهان: خطاهای واقعی TypeScript نباید مخفی شوند.
  reactStrictMode: true,
  allowedDevOrigins: ["21.0.4.231"],
};

export default nextConfig;
