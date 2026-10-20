/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Preview builds served from a sub-path (e.g. a review link) set ASSET_PREFIX
  assetPrefix: process.env.ASSET_PREFIX || undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
