import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Preview builds served from a sub-path (e.g. a review link) set ASSET_PREFIX
  assetPrefix: process.env.ASSET_PREFIX || undefined,
  images: {
    unoptimized: true,
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  // Note: remark-frontmatter cannot be used with Turbopack due to serialization limitations
  // MDX frontmatter is kept for editing convenience - see prose styles to handle display
});

export default withMDX(nextConfig);
