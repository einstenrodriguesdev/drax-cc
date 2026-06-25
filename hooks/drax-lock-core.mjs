// ─────────────────────────────────────────────────────────────────────────────
// DRAX VALIDATION-PHASE SEQUENTIAL EXECUTION LOCK — TEMPORARY / REMOVABLE
//
// Shared core for the temporary sequential execution lock. The lock gates DRAX
// sub-agent dispatch to STRICTLY ONE-AT-A-TIME during agent-by-agent validation.
//
// It is intentionally removable/disableable:
//   • disable: set "validationSequentialLockEnabled": false in drax-lock.config.json
//     (the PreToolUse/PostToolUse hooks then pass through silently, no checks).
//   • remove: delete the PreToolUse/PostToolUse entries from hooks/hooks.json and
//     these files; nothing else in the runtime depends on them.
//
// It is meant to be REPLACED by controlled parallelism once agents are validated.
// It ONLY gates WHICH agent may run and WHEN — it never judges output quality.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Plugin root = parent of the hooks/ directory that holds this file.
export const PLUGIN_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// ── Config ───────────────────────────────────────────────────────────────────
// Fail-closed: if the config file is missing or unreadable, the lock is ENABLED
// (this is a safety mechanism; absence of config should not silently disable it).
// Only an explicit `false` disables it.
export function lockEnabled() {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, "drax-lock.config.json"), "utf8"));
    return cfg.validationSequentialLockEnabled !== false;
  } catch {
    return true;
  }
}

// ── Workspace discovery (mirrors hooks/session-start.mjs: cwd, then parent) ────
export function findWorkspace(baseCwd) {
  for (const base of [baseCwd, path.dirname(baseCwd)]) {
    const ws = path.join(base, "drax-workspace");
    try {
      if (fs.existsSync(ws) && fs.statSync(ws).isDirectory()) return ws;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function safeJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

// ── DRAX agent identity (derived from the REAL repo, never guessed) ────────────
// Reads every agents/**/agent.md `name:` frontmatter at runtime, so the set of
// DRAX sub-agents always tracks what actually ships in this plugin.
export function draxAgentNames() {
  const dir = path.join(PLUGIN_ROOT, "agents");
  const names = new Set();
  const walk = (d) => {
    let entries = [];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "agent.md") {
        try {
          const txt = fs.readFileSync(p, "utf8");
          const m = txt.match(/^name:\s*(.+?)\s*$/m);
          if (m) names.add(m[1].trim());
        } catch {
          /* ignore */
        }
      }
    }
  };
  walk(dir);
  return names;
}

// subagent_type may arrive plain ("cmo") or plugin-namespaced ("drax:cmo").
export function normalizeSubagent(subagentType) {
  if (typeof subagentType !== "string") return null;
  const t = subagentType.trim().toLowerCase();
  const stripped = t.includes(":") ? t.slice(t.lastIndexOf(":") + 1) : t;
  return stripped || null;
}

// A DRAX dispatch = a Task/Agent tool call whose subagent_type is one of the
// real DRAX agent roles in this repo.
export function isDraxDispatch(toolName, toolInput) {
  if (toolName !== "Task" && toolName !== "Agent") return null;
  const agent = normalizeSubagent(toolInput && toolInput.subagent_type);
  if (!agent) return null;
  return draxAgentNames().has(agent) ? agent : null;
}

// ── Brand slug (from STATE.json productName; DRAX → "drax") ─────────────────────
export function brandSlug(state) {
  const name = (state && state.productName) || "brand";
  return (
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "brand"
  );
}

// ── Slice model ────────────────────────────────────────────────────────────────
// currentSlice = the first slice whose completion flag is not yet set in STATE.
// Flag names are the REAL flags the skills write (see DRAX_SYSTEM.md §8):
//   slice1 branding  -> brandingLoopComplete
//   slice2 site pkg  -> siteBuildPackageComplete
//   slice3 build     -> siteBuildComplete
//   slice4 secure    -> securityComplete
export const SLICE_PRECONDITION = {
  // slice -> the STATE flag that must be true to ENTER it (slice 1 has none)
  2: "brandingLoopComplete",
  3: "siteBuildPackageComplete",
  4: "siteBuildComplete",
};

export function computeCurrentSlice(state) {
  const s = state || {};
  if (!s.brandingLoopComplete) return 1;
  if (!s.siteBuildPackageComplete) return 2;
  if (!s.siteBuildComplete) return 3;
  return 4;
}

// ── Protocol artifact map (grounded in DRAX_SYSTEM.md §8 + the slice skills) ────
// (slice, agent) -> ordered list of the protocol-defined artifact paths that
// agent materializes in that slice, relative to drax-workspace/. ${brand} is the
// productName slug. This is the protocol definition — not memory/inference: the
// expectedArtifact for a dispatch is resolved from this table at dispatch time.
//
// Resolution within a (slice, agent) cell: expectedArtifact = the FIRST path that
// does not yet exist on disk; if all already exist (e.g. an augmenting agent such
// as the CLO's slice-1 legal-risk read on NAME_CLEARANCE.md), the LAST path is used.
export const ARTIFACT_MAP = {
  1: {
    "brand-strategist": ["marketing/branding/NAME_CLEARANCE.md", "marketing/branding/BRANDING.md"],
    clo: ["marketing/branding/NAME_CLEARANCE.md"], // augments clearance with legal-risk read
    cmo: ["marketing/branding/BRANDING_DECISION.md"],
    cto: ["marketing/branding/BRAND_METRICS_AND_TRIGGERS.md"],
    ceo: ["init/SCENARIO.md"],
  },
  2: {
    cmo: ["marketing/${brand}-site/SITE_BRIEF.md", "marketing/${brand}-site/SITE_BUILD_PACKAGE.md"],
    clo: ["legal/${brand}-site/LEGAL_REQUIREMENTS.md", "legal/COMPLIANCE_BASELINE.md"],
    "legal-counsel": ["legal/${brand}-site/LEGAL_PAGES.md"],
    "content-strategist": ["marketing/${brand}-site/SITEMAP.md"],
    "ux-designer": ["marketing/${brand}-site/WIREFRAMES.md", "design/${brand}-site/DESIGN_TOKENS.md"],
    "copywriter-performance": ["marketing/${brand}-site/COPY_DECK.md"],
    "seo-manager": ["marketing/${brand}-site/KEYWORD_MAP.md"],
    "design-cto": ["design/${brand}-site/DESIGN_DECISION.md"],
    cto: ["marketing/${brand}-site/CONVERSION_INSTRUMENTATION.md"],
  },
  3: {
    cto: [
      "technology/${brand}-site/BUILD_READINESS.md",
      "technology/${brand}-site/BUILD_PLAN.md",
      "technology/${brand}-site/VERIFICATION_REPORT.md", // Step 3.5 live-verification gate verdict
    ],
    "senior-frontend-engineer": ["technology/${brand}-site/BUILD_PLAN.md"], // builds real site against the plan
    "qa-engineer": ["technology/${brand}-site/QA_REPORT.md"],
    "devops-engineer": ["technology/${brand}-site/DEPLOY_PLAN.md"],
  },
  4: {
    ciso: ["cybersecurity/${brand}-site/SECURITY_DECISION.md"],
    "security-engineer": ["cybersecurity/${brand}-site/VPS_HARDENING.md"],
    "penetration-tester": ["cybersecurity/${brand}-site/PENTEST_REPORT.md"],
    "soc-analyst": ["cybersecurity/${brand}-site/SOC_RUNBOOK.md"],
  },
};

// Resolve the expected artifact (workspace-relative path) for a dispatch.
// Returns { inSlice: boolean, expectedArtifact: string|null }.
export function resolveExpectedArtifact(slice, agent, wsRoot, slug) {
  const cell = ARTIFACT_MAP[slice] && ARTIFACT_MAP[slice][agent];
  if (!cell || cell.length === 0) return { inSlice: false, expectedArtifact: null };
  const paths = cell.map((p) => p.replace(/\$\{brand\}/g, slug));
  const firstMissing = paths.find((p) => {
    try {
      return !fs.existsSync(path.join(wsRoot, p));
    } catch {
      return true;
    }
  });
  return { inSlice: true, expectedArtifact: firstMissing || paths[paths.length - 1] };
}

// ── Lock file I/O (one lock per run, atomic writes only) ───────────────────────
export function lockPath(wsRoot) {
  return path.join(wsRoot, "init", "EXECUTION_LOCK.json");
}

export function readLock(wsRoot) {
  return safeJson(lockPath(wsRoot)); // null => treat as IDLE
}

// Atomic write: write to EXECUTION_LOCK.json.tmp, then rename onto the target.
// The target file is NEVER written directly.
export function writeLockAtomic(wsRoot, lock) {
  const dir = path.join(wsRoot, "init");
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
  const target = lockPath(wsRoot);
  const tmp = target + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(lock, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, target);
}

export function nowIso() {
  return new Date().toISOString();
}

// Active runId for a run: prefer an explicit STATE.runId, else fall back to the
// stable STATE.createdAt (a new run rewrites STATE with a fresh createdAt, which
// lets the lock detect "lock belongs to a different run").
export function activeRunId(state) {
  if (!state) return null;
  return state.runId || state.createdAt || null;
}

export function idleLock(runId) {
  return {
    runId: runId || null,
    currentSlice: null,
    currentAgent: null,
    currentStep: null,
    expectedArtifact: null,
    status: "IDLE",
    lastCompletedAgent: null,
    lastCompletedArtifact: null,
    awaitingConfirmation: false,
    lockedAt: null,
    lockedBy: "claude-code",
    lastConfirmedAt: null,
  };
}
