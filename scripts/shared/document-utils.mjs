import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import path from "path";

export function readText(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

export function writeText(filePath, content) {
  writeFileSync(filePath, content, "utf8");
}

export function stripHtmlComments(content) {
  return content.replace(/<!--[\s\S]*?-->/g, "");
}

export function replaceLine(content, label, value) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^(-\\s*${escaped}:\\s*).*$`, "m");
  if (pattern.test(content)) {
    return content.replace(pattern, `$1${value}`);
  }
  return content;
}

export function hasLine(content, label, value) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^-\\s*${escaped}:\\s*${escapedValue}\\s*$`, "m").test(stripHtmlComments(content));
}

export function listDirs(rootPath) {
  if (!existsSync(rootPath)) {
    return [];
  }

  return readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootPath, entry.name));
}

export function detectWorkflowDoc(subjectPath) {
  const lightPath = path.join(subjectPath, "01-light-feature.md");
  const readinessPath = path.join(subjectPath, "05-readiness-review.md");
  const epicBriefPath = path.join(subjectPath, "01-epic-brief.md");

  if (existsSync(lightPath)) {
    return { type: "light-feature", gateFile: lightPath };
  }

  if (existsSync(readinessPath)) {
    return { type: "feature", gateFile: readinessPath };
  }

  if (existsSync(epicBriefPath)) {
    return { type: "epic", gateFile: epicBriefPath };
  }

  return { type: "unknown", gateFile: "" };
}
