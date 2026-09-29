/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output => tiny production image (only the files `next start` needs).
  output: "standalone",
  images: {
    // Media (student photos etc.) is served by nginx off the backend volume.
    remotePatterns: [{ protocol: "http", hostname: "**" }],
  },
};

module.exports = nextConfig;
