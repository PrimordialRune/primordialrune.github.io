// After `next build`: drop the legacy-browser polyfill <script noModule>. Modern browsers never
// load it, and Next writes it with an absolute /_next/ path that ignores ASSET_PREFIX.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "out";
for (const f of readdirSync(dir).filter((n) => n.endsWith(".html"))) {
  const p = join(dir, f);
  const html = readFileSync(p, "utf8");
  const next = html.replace(/<script\b[^>]*\bnoModule\b[^>]*><\/script>/g, "");
  if (next !== html) writeFileSync(p, next);
}
