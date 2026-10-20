// Public files as relative paths, so the site works at the domain root and inside a
// preview served from a sub-path (built with ASSET_PREFIX=./app)
export const asset = (p: string) => p.replace(/^\/+/, "");
