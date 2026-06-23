#!/usr/bin/env node
// drax-cc SessionStart hook — detection only, never mutates the workspace.
// Looks for an existing drax-workspace/ in the current directory AND its parent
// (the founder often runs from one level above the project), reports the drax
// version that last ran and the current scenario, and points to /drax-init.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Absolute path to this plugin's bundled assets (DRAX_SYSTEM.md, agents/, skills/).
// Agents/skills refer to this as {{DRAX_ASSETS}}; resolved from this file's location
// so it works at any install path.
const DRAX_ASSETS = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function emit(context) {
  const prefix =
    `DRAX_ASSETS=${DRAX_ASSETS}\n` +
    `(In any drax-cc agent or skill, the marker {{DRAX_ASSETS}} resolves to the path above. ` +
    `Read the constitution at {{DRAX_ASSETS}}/DRAX_SYSTEM.md and the init protocol at ` +
    `{{DRAX_ASSETS}}/skills/drax-init/SKILL.md. Runtime state lives under ./drax-workspace/.)\n\n`;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: (prefix + context).slice(0, 9000),
      },
    })
  );
}

function safeJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

// Return the workspace dir (cwd first, then parent) or null.
function findWorkspace(cwd) {
  for (const base of [cwd, path.dirname(cwd)]) {
    const ws = path.join(base, "drax-workspace");
    try {
      if (fs.existsSync(ws) && fs.statSync(ws).isDirectory()) return ws;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function main() {
  const cwd = process.cwd();
  const ws = findWorkspace(cwd);

  if (!ws) {
    emit(
      "No drax-workspace found here. Run /drax-init (or /drax) to open a run — the CEO will detect, " +
        "report, fix the scenario, and name the first activation."
    );
    return;
  }

  const where = path.dirname(ws) === cwd ? "current directory" : "parent directory";
  const state = safeJson(path.join(ws, "init", "STATE.json"));
  const docs = (() => {
    try {
      return fs
        .readdirSync(ws)
        .filter((f) => f.endsWith(".md") && fs.statSync(path.join(ws, f)).isFile()).length;
    } catch {
      return 0;
    }
  })();

  let context = `drax-cc workspace detected in the ${where} (./drax-workspace).`;
  if (state) {
    context += `\nVersion that ran here: ${state.draxVersion ?? "unversioned/legacy"}.`;
    if (state.productName) context += ` Product/brand: ${state.productName}.`;
    if (state.scenario) context += ` Scenario: ${state.scenario}.`;
    if (state.objective) context += ` Objective: ${state.objective}.`;
    if (state.firstActivation) context += ` First activation: ${state.firstActivation}.`;
    context += `\nResume the run with /drax (or /drax-init).`;
  } else {
    context +=
      `\nNo init/STATE.json — likely a legacy/older tree (${docs} markdown docs present). ` +
      `Run /drax-init: the CEO will report it and offer to continue (reuse files, non-destructive) or start new.`;
  }

  emit(context);
}

try {
  main();
} catch (err) {
  emit(`drax-cc SessionStart detection skipped: ${err?.message ?? "unknown error"}.`);
}
