import { copyFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { copyDirectoryRecursive, ensureDir, resetTarget } from "../shared/file-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const skillName = "document-driven-workflow";
const referenceFiles = [
  "USER_GUIDE.md",
  "USAGE.md",
  "WORKFLOW.md",
  "AUTOMATION.md",
  "LANGUAGE_POLICY.md",
  "MODE_ROUTER.md",
  "EXECUTION_PROTOCOL.md",
  "EXECUTION_DISCIPLINE.md",
  "PRODUCT_TRACEABILITY.md",
  "EPIC_WORKFLOW.md",
  "GATES.md",
  "LEGACY_ADOPTION.md",
  "STACK_POLICY.md",
  "POSITIONING.md",
  "MAESTRO_INTEGRATION.md",
];

function copyRequiredFile(source, target) {
  if (!existsSync(source)) {
    console.error(`Missing required build input: ${source}`);
    process.exit(1);
  }

  ensureDir(path.dirname(target));
  copyFileSync(source, target);
}

export function buildSkills({ quiet = false } = {}) {
  const source = path.join(repoRoot, "skills", skillName);
  const target = path.join(repoRoot, "dist", "skills", skillName);

  if (!existsSync(source)) {
    console.error(`Missing skill source: ${source}`);
    process.exit(1);
  }

  resetTarget(target);
  copyRequiredFile(path.join(source, "SKILL.md"), path.join(target, "SKILL.md"));

  for (const file of referenceFiles) {
    copyRequiredFile(
      path.join(repoRoot, "docs", "workflow", file),
      path.join(target, "references", file),
    );
  }

  copyDirectoryRecursive(
    path.join(repoRoot, "docs", "workflow", "presets"),
    path.join(target, "references", "presets"),
  );
  copyDirectoryRecursive(
    path.join(repoRoot, "docs", "workflow", "templates"),
    path.join(target, "templates"),
  );
  copyDirectoryRecursive(
    path.join(repoRoot, "scripts", "workflow"),
    path.join(target, "scripts", "workflow"),
  );
  copyDirectoryRecursive(
    path.join(repoRoot, "scripts", "shared"),
    path.join(target, "scripts", "shared"),
  );

  if (!quiet) {
    console.log(`Built skill: ${target}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  buildSkills();
}
