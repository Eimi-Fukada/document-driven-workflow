import { existsSync, readFileSync, readdirSync } from "fs";
import path from "path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

const roots = [
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  "docs/workflow",
  "skills/document-driven-workflow",
  "scripts/workflow",
  "scripts/shared",
];

if (existsSync(path.join(repoRoot, "dist", "skills", "document-driven-workflow"))) {
  roots.push("dist/skills/document-driven-workflow");
}

const textExtensions = new Set([".md", ".yaml", ".yml", ".json", ".mjs", ".js", ".ps1"]);
const mojibakePatterns = [
  /锛/,
  /銆/,
  /鐨/,
  /浣/,
  /鏂/,
  /绋/,
  /妗/,
  /闂/,
  /椤/,
  /瑙/,
  /楠/,
  /绾/,
  /蹇/,
  /â€/,
  /Ã./,
  /Â./,
];

const requiredReadablePhrases = [
  {
    file: "docs/workflow/USER_GUIDE.md",
    phrases: ["这套工作流", "使用入口", "一次确认"],
  },
  {
    file: "docs/workflow/templates/feature/REVIEW.md",
    phrases: ["Feature 审核摘要", "风险选择", "验收表"],
  },
  {
    file: "docs/workflow/templates/epic/REVIEW.md",
    phrases: ["Epic 审核摘要", "Feature 拆分建议", "验收地图"],
  },
  {
    file: "dist/skills/document-driven-workflow/references/USER_GUIDE.md",
    optional: true,
    phrases: ["这套工作流", "使用入口", "一次确认"],
  },
  {
    file: "dist/skills/document-driven-workflow/templates/feature/REVIEW.md",
    optional: true,
    phrases: ["Feature 审核摘要", "风险选择", "验收表"],
  },
];

function walk(root) {
  const fullRoot = path.join(repoRoot, root);
  if (!existsSync(fullRoot)) {
    return [];
  }
  const statFiles = [];
  const entries = readdirSync(fullRoot, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(fullRoot, entry.name);
    const rel = path.relative(repoRoot, full).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      statFiles.push(...walk(rel));
    } else if (entry.isFile() && textExtensions.has(path.extname(entry.name))) {
      statFiles.push(rel);
    }
  }
  return statFiles;
}

function collectFiles() {
  const files = new Set();
  for (const root of roots) {
    const full = path.join(repoRoot, root);
    if (!existsSync(full)) {
      continue;
    }
    const rel = root.replaceAll("\\", "/");
    if (readdirSync(path.dirname(full), { withFileTypes: true }).some((entry) => entry.name === path.basename(full) && entry.isFile())) {
      files.add(rel);
    } else {
      for (const file of walk(rel)) {
        files.add(file);
      }
    }
  }
  return [...files].sort();
}

const failures = [];

for (const file of collectFiles()) {
  const full = path.join(repoRoot, file);
  const content = readFileSync(full, "utf8");
  if (content.includes("\uFFFD")) {
    failures.push(`${file}: contains UTF-8 replacement character`);
  }
  for (const pattern of mojibakePatterns) {
    if (pattern.test(content)) {
      failures.push(`${file}: contains likely mojibake pattern ${pattern}`);
      break;
    }
  }
}

for (const item of requiredReadablePhrases) {
  const full = path.join(repoRoot, item.file);
  if (!existsSync(full)) {
    if (!item.optional) {
      failures.push(`${item.file}: required readable file is missing`);
    }
    continue;
  }
  const content = readFileSync(full, "utf8");
  for (const phrase of item.phrases) {
    if (!content.includes(phrase)) {
      failures.push(`${item.file}: missing readable phrase '${phrase}'`);
    }
  }
}

if (failures.length) {
  console.error("Encoding check failed:");
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log("Encoding check passed.");
