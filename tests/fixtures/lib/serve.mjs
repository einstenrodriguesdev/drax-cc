// Fixture static server. Usage: node serve.mjs <seedDir> [port]
// Serves <seedDir>/dist (run build.mjs first). Prints "LISTENING <url>" once ready so a
// harness can parse the URL; default port 0 = ephemeral (safe for parallel runs).
// Stays up until killed (SIGTERM/SIGINT).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const seedDir = process.argv[2];
const port = Number(process.argv[3] ?? process.env.PORT ?? 0);
if (!seedDir) {
  console.error("usage: node serve.mjs <seedDir> [port]");
  process.exit(2);
}
const dist = path.join(seedDir, "dist");

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".svg": "image/svg+xml" };

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent((req.url || "/").split("?")[0]);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.join(dist, rel);
  if (!file.startsWith(dist) || !fs.existsSync(file)) {
    res.writeHead(404, { "content-type": "text/plain" });
    return res.end("not found");
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`LISTENING http://127.0.0.1:${server.address().port}`);
});
for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => server.close(() => process.exit(0)));
