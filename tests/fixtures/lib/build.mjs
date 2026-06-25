// Fixture build step. Usage: node build.mjs <seedDir>
// Reads <seedDir>/meta.json. If expectBuild==="fail", throws a realistic compile-style
// error (the known-bad-build fault). Otherwise copies <seedDir>/src -> <seedDir>/dist.
// Pure node, zero deps — `npm install` on a seed is a noop, so this is fast/deterministic.
import fs from "node:fs";
import path from "node:path";

const seedDir = process.argv[2];
if (!seedDir) {
  console.error("usage: node build.mjs <seedDir>");
  process.exit(2);
}
const meta = JSON.parse(fs.readFileSync(path.join(seedDir, "meta.json"), "utf8"));

if (meta.expectBuild === "fail") {
  // Simulate a build/compile failure (the kind senior-frontend-engineer's `npm run build`
  // would surface). Exit non-zero so the build half of the gate catches it.
  console.error("[build] ERROR: ./src/app.js:12 — Unexpected token, expected \";\" (build aborted)");
  process.exit(1);
}

const src = path.join(seedDir, "src");
const dist = path.join(seedDir, "dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
  if (entry.isFile()) fs.copyFileSync(path.join(src, entry.name), path.join(dist, entry.name));
}
console.log(`[build] OK — ${seedDir} -> dist/`);
