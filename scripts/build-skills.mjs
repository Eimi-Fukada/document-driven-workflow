import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { copyDirectoryRecursive, resetTarget } from "./file-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

export function buildSkills({ quiet = false } = {}) {
  const source = path.join(repoRoot, "skills", "document-driven-workflow");
  const target = path.join(repoRoot, "dist", "skills", "document-driven-workflow");

  if (!existsSync(source)) {
    console.error(`Missing skill source: ${source}`);
    process.exit(1);
  }

  resetTarget(target);
  copyDirectoryRecursive(source, target);

  if (!quiet) {
    console.log(`Built skill: ${target}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  buildSkills();
}
