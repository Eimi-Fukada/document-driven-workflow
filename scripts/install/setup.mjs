import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildSkills } from "../build/build-skills.mjs";
import { copyDirectoryRecursive, ensureDir, resetTarget } from "../shared/file-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

function parseHost(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--host") {
      return argv[i + 1] || "all";
    }
    if (arg.startsWith("--host=")) {
      return arg.split("=")[1] || "all";
    }
  }
  return "all";
}

const host = parseHost(args);
const validHosts = new Set(["all", "claude", "codex"]);

if (!validHosts.has(host)) {
  console.error(`Unknown --host value: ${host}. Use claude, codex, or all.`);
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, "..", "..");
const skillSource = path.join(repoRoot, "dist", "skills", "document-driven-workflow");

buildSkills({ quiet: true });

if (!existsSync(skillSource)) {
  console.error(`Generated skill directory not found: ${skillSource}`);
  process.exit(1);
}

const homeDir = process.env.USERPROFILE || process.env.HOME;
if (!homeDir) {
  console.error("Could not determine home directory from USERPROFILE or HOME.");
  process.exit(1);
}

function installSkill(hostName, targetRoot) {
  ensureDir(targetRoot);
  const target = path.join(targetRoot, "document-driven-workflow");
  resetTarget(target);
  copyDirectoryRecursive(skillSource, target);
  console.log(`[${hostName}] installed: document-driven-workflow`);
}

if (host === "all" || host === "claude") {
  installSkill("claude", path.join(homeDir, ".claude", "skills"));
}

if (host === "all" || host === "codex") {
  installSkill("codex", path.join(homeDir, ".codex", "skills"));
}

console.log("");
console.log("Setup complete.");
console.log("Restart Claude Code or Codex to load the updated workflow skill.");
