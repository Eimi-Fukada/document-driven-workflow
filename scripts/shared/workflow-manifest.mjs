import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export const MANIFEST_FILE = "00-workflow.yaml";

const orderedKeys = [
  "schema_version",
  "type",
  "mode",
  "id",
  "epic_id",
  "approval",
  "approval_source",
  "route_decision",
  "risk_level",
  "hard_risk_blockers",
  "expected_runtime",
  "execution_slicing",
  "readiness",
  "status",
  "stack_preset",
  "unresolved_questions",
  "blocking_issues",
  "assumptions_accepted",
  "approved_by",
  "approved_at",
  "source_path",
];

export function manifestPath(subjectPath) {
  return path.join(subjectPath, MANIFEST_FILE);
}

export function parseManifest(content) {
  const data = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!match) {
      continue;
    }

    data[match[1]] = match[2].trim();
  }

  return data;
}

export function readManifest(subjectPath) {
  const filePath = manifestPath(subjectPath);
  if (!existsSync(filePath)) {
    return null;
  }

  return parseManifest(readFileSync(filePath, "utf8"));
}

export function writeManifest(subjectPath, data) {
  const normalized = normalizeManifest(data);
  const used = new Set();
  const lines = [
    "# Workflow Control",
    "# Single source of truth for readiness, approval, routing, and gate state.",
    "# Allowed approval: pending | approved | inherited",
    "# Allowed route_decision: ai_draft | user_confirmed",
    "# Allowed risk_level: low | medium | high | unset",
    "# Allowed hard_risk_blockers: none | comma-separated objective blocker IDs",
    "# Allowed expected_runtime: under_30m | 30_90m | over_90m | unset",
    "# Allowed execution_slicing: not_required | recommended | required",
    "# Allowed readiness: not_ready | ready",
    "# Allowed status: draft | ready | in_progress | verified | released",
    "",
  ];

  for (const key of orderedKeys) {
    if (Object.prototype.hasOwnProperty.call(normalized, key)) {
      lines.push(`${key}: ${normalized[key]}`);
      used.add(key);
    }
  }

  for (const key of Object.keys(normalized).sort()) {
    if (!used.has(key)) {
      lines.push(`${key}: ${normalized[key]}`);
    }
  }

  writeFileSync(manifestPath(subjectPath), `${lines.join("\n")}\n`, "utf8");
}

export function normalizeManifest(data) {
  return {
    schema_version: "1",
    approval: "pending",
    approval_source: "none",
    route_decision: "ai_draft",
    risk_level: "unset",
    hard_risk_blockers: "none",
    expected_runtime: "unset",
    execution_slicing: "not_required",
    readiness: "not_ready",
    status: "draft",
    stack_preset: "next-fullstack",
    unresolved_questions: "0",
    blocking_issues: "0",
    assumptions_accepted: "false",
    approved_by: "none",
    approved_at: "none",
    source_path: "none",
    ...data,
  };
}

export function createFeatureManifest({
  id,
  mode,
  stackPreset,
  stack_preset,
  epicId,
  epic_id,
  sourcePath,
  source_path,
  approval,
  approvalSource,
  approval_source,
  routeDecision,
  route_decision,
  riskLevel,
  risk_level,
  hardRiskBlockers,
  hard_risk_blockers,
  expectedRuntime,
  expected_runtime,
  executionSlicing,
  execution_slicing,
} = {}) {
  const resolvedMode = mode || "standard";
  const defaultRiskLevel = resolvedMode === "light" ? "low" : resolvedMode === "strict" ? "high" : "medium";
  const defaultExpectedRuntime = resolvedMode === "light" ? "under_30m" : "30_90m";
  const defaultExecutionSlicing = resolvedMode === "strict" ? "recommended" : "not_required";
  const resolvedStackPreset = stackPreset || stack_preset || "next-fullstack";
  const resolvedEpicId = epicId || epic_id || "none";
  const resolvedSourcePath = sourcePath || source_path || "none";
  const resolvedApproval = approval || "pending";
  const resolvedApprovalSource = approvalSource || approval_source || "none";
  const resolvedRouteDecision = routeDecision || route_decision || "ai_draft";

  return normalizeManifest({
    type: "feature",
    mode: resolvedMode,
    id,
    epic_id: resolvedEpicId,
    stack_preset: resolvedStackPreset,
    approval: resolvedApproval,
    approval_source: resolvedApprovalSource,
    route_decision: resolvedRouteDecision,
    risk_level: riskLevel || risk_level || defaultRiskLevel,
    hard_risk_blockers: hardRiskBlockers || hard_risk_blockers || "none",
    expected_runtime: expectedRuntime || expected_runtime || defaultExpectedRuntime,
    execution_slicing: executionSlicing || execution_slicing || defaultExecutionSlicing,
    source_path: resolvedSourcePath,
  });
}

export function createEpicManifest({ id, sourcePath = "00-source.md" } = {}) {
  return normalizeManifest({
    type: "epic",
    mode: "epic",
    id,
    epic_id: "none",
    stack_preset: "none",
    route_decision: "ai_draft",
    risk_level: "medium",
    hard_risk_blockers: "none",
    expected_runtime: "over_90m",
    execution_slicing: "required",
    source_path: sourcePath,
  });
}

export function approveManifest(data, { approvedBy = "user", approvedAt = new Date().toISOString() } = {}) {
  return normalizeManifest({
    ...data,
    approval: data.approval === "inherited" ? "inherited" : "approved",
    route_decision: "user_confirmed",
    readiness: "ready",
    status: "ready",
    unresolved_questions: "0",
    blocking_issues: "0",
    assumptions_accepted: "true",
    approved_by: approvedBy,
    approved_at: approvedAt,
  });
}

export function inheritApproval(data, approvalSource) {
  return normalizeManifest({
    ...data,
    approval: "inherited",
    approval_source: approvalSource,
    route_decision: "ai_draft",
    readiness: "ready",
    status: "ready",
    unresolved_questions: "0",
    blocking_issues: "0",
    assumptions_accepted: "true",
    approved_by: "inherited",
    approved_at: "inherited",
  });
}

export function hardRiskBlockers(data) {
  return String(data?.hard_risk_blockers || "none")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item && item !== "none");
}

export function validateRouteDecision(data) {
  const failures = [];
  const allowedRiskLevels = new Set(["low", "medium", "high"]);
  const allowedExpectedRuntime = new Set(["under_30m", "30_90m", "over_90m"]);
  const allowedExecutionSlicing = new Set(["not_required", "recommended", "required"]);
  const blockers = hardRiskBlockers(data);

  if (data.route_decision !== "user_confirmed") {
    failures.push("route_decision must be user_confirmed before implementation.");
  }
  if (!allowedRiskLevels.has(String(data.risk_level || ""))) {
    failures.push("risk_level must be low, medium, or high before approval.");
  }
  if (!allowedExpectedRuntime.has(String(data.expected_runtime || ""))) {
    failures.push("expected_runtime must be under_30m, 30_90m, or over_90m before approval.");
  }
  if (!allowedExecutionSlicing.has(String(data.execution_slicing || ""))) {
    failures.push("execution_slicing must be not_required, recommended, or required before approval.");
  }
  if (blockers.length > 0 && data.type === "feature" && data.mode !== "strict") {
    failures.push("objective hard risk blockers require Strict mode before implementation.");
  }
  if (data.mode === "light" && data.risk_level !== "low") {
    failures.push("Light mode requires risk_level: low.");
  }

  return failures;
}
