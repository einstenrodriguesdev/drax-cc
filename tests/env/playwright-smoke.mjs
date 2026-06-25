// Smoke test: prove the runtime can do what the DRAX qa-engineer live gate needs.
//   1. boot a tiny HTTP server serving real HTML (with a correct viewport meta)
//   2. drive a real headless browser (render check + console-error capture + screenshot)
//   3. assert the live <meta viewport> on the RAW served HTML (the mobile blind spot)
import http from "node:http";
import fs from "node:fs";
import { chromium } from "playwright";

const HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DRAX probe</title>
</head>
<body><h1 id="hero">It renders</h1></body>
</html>`;

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(HTML);
});

const results = {};
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const url = `http://127.0.0.1:${port}/`;

try {
  // (3) raw-HTML viewport assertion — independent of the browser's forced viewport
  const raw = await (await fetch(url)).text();
  const m = raw.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i);
  results.rawViewport = m ? m[1] : null;
  results.viewportHasInitialScale1 = !!m && /initial-scale=1\b/.test(m[1]);

  // (2) real browser
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => msg.type() === "error" && consoleErrors.push(msg.text()));
  const resp = await page.goto(url, { waitUntil: "networkidle" });
  results.httpStatus = resp.status();
  results.h1Text = await page.textContent("#hero");
  results.consoleErrors = consoleErrors;
  await page.screenshot({ path: "smoke-screenshot.png" });
  results.screenshotBytes = fs.statSync("smoke-screenshot.png").size;
  results.browserVersion = browser.version();
  await browser.close();
} finally {
  server.close();
}

const pass =
  results.httpStatus === 200 &&
  results.h1Text === "It renders" &&
  results.consoleErrors.length === 0 &&
  results.viewportHasInitialScale1 === true &&
  results.screenshotBytes > 0;

console.log(JSON.stringify({ pass, ...results }, null, 2));
process.exit(pass ? 0 : 1);
