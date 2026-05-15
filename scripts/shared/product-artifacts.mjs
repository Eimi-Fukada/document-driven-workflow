import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const PRODUCT_FILES = [
  ["requirement-ledger.md", "requirement-ledger.md"],
  ["traceability.md", "traceability.md"],
  [path.join("snapshots", "README.md"), path.join("snapshots", "README.md")],
];

function copyIfMissing(source, target, { force = false } = {}) {
  if (existsSync(target) && !force) {
    return false;
  }

  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, readFileSync(source, "utf8"), "utf8");
  return true;
}

function appendLineIfMissing(filePath, needle, line) {
  const current = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
  if (current.includes(needle)) {
    return false;
  }

  const prefix = current.endsWith("\n") || current.length === 0 ? "" : "\n";
  writeFileSync(filePath, `${current}${prefix}${line}\n`, "utf8");
  return true;
}

function sourceIdFor(type, id) {
  const prefix = type === "epic" ? "SRC-EPIC" : "SRC-FEATURE";
  return `${prefix}-${id.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`;
}

function requirementIdFor(type, id) {
  const prefix = type === "epic" ? "EREQ" : "REQ";
  return `${prefix}-PENDING-${id.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`;
}

export function productArtifactPaths(workflow) {
  const root = path.join(workflow.targetRoot, "docs", "product");
  return {
    root,
    ledger: path.join(root, "requirement-ledger.md"),
    traceability: path.join(root, "traceability.md"),
    snapshots: path.join(root, "snapshots"),
  };
}

export function ensureProductArtifacts(workflow, { force = false } = {}) {
  const productRoot = path.join(workflow.targetRoot, "docs", "product");
  const productTemplateRoot = path.join(workflow.templateRoot, "product");
  const created = [];
  const skipped = [];

  for (const [sourceName, targetName] of PRODUCT_FILES) {
    const source = path.join(productTemplateRoot, sourceName);
    const target = path.join(productRoot, targetName);
    const didCreate = copyIfMissing(source, target, { force });
    (didCreate ? created : skipped).push(path.relative(workflow.targetRoot, target).replaceAll("\\", "/"));
  }

  return { created, skipped };
}

export function recordProductTrace(workflow, { type, id, epicId = "none", sourcePath = "none" }) {
  ensureProductArtifacts(workflow);

  const paths = productArtifactPaths(workflow);
  const subjectPath = type === "epic" ? `docs/epics/${id}` : `docs/features/${id}`;
  const sourceId = sourceIdFor(type, id);
  const requirementId = requirementIdFor(type, id);
  const epicPath = type === "epic" ? subjectPath : epicId !== "none" ? `docs/epics/${epicId}` : "none";
  const featurePath = type === "feature" ? subjectPath : "none";
  const sourceLabel = sourcePath === "none" ? subjectPath : sourcePath;

  appendLineIfMissing(
    paths.ledger,
    subjectPath,
    `| ${sourceId} | ${sourceLabel} | ${type} | ${subjectPath} | accepted | Captured by document-driven-workflow. |`,
  );

  appendLineIfMissing(
    paths.traceability,
    subjectPath,
    `| ${requirementId} | ${sourceId} | ${epicPath} | ${featurePath} | pending | pending | pending | pending |`,
  );

  return { sourceId, requirementId };
}
