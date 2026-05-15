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
  mode = "standard",
  stackPreset = "next-fullstack",
  epicId = "none",
  sourcePath = "none",
  approval = "pending",
  approvalSource = "none",
} = {}) {
  return normalizeManifest({
    type: "feature",
    mode,
    id,
    epic_id: epicId,
    stack_preset: stackPreset,
    approval,
    approval_source: approvalSource,
    source_path: sourcePath,
  });
}

export function createEpicManifest({ id, sourcePath = "00-source.md" } = {}) {
  return normalizeManifest({
    type: "epic",
    mode: "epic",
    id,
    epic_id: "none",
    stack_preset: "none",
    source_path: sourcePath,
  });
}

export function approveManifest(data, { approvedBy = "user", approvedAt = new Date().toISOString() } = {}) {
  return normalizeManifest({
    ...data,
    approval: data.approval === "inherited" ? "inherited" : "approved",
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
    readiness: "ready",
    status: "ready",
    unresolved_questions: "0",
    blocking_issues: "0",
    assumptions_accepted: "true",
    approved_by: "inherited",
    approved_at: "inherited",
  });
}
