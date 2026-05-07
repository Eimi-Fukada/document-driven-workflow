import { cpSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const epicGateCommand = process.env.WORKFLOW_EPIC_GATE_COMMAND || "npm run gate:epic";

const args = process.argv.slice(2);
const epicId = args[0];

if (!epicId) {
  console.error("Missing epic id.");
  console.error("Usage: npm run epic:new -- <epic-id>");
  process.exit(1);
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(epicId)) {
  console.error("Invalid epic id. Use lowercase letters, numbers, and hyphens only.");
  process.exit(1);
}

const epicDir = path.join(repoRoot, "docs", "epics", epicId);
if (existsSync(epicDir)) {
  console.error(`Epic already exists: docs/epics/${epicId}`);
  process.exit(1);
}

const templateDir = path.join(repoRoot, "docs", "workflow", "templates", "epic");
const files = [
  ["source.md", "00-source.md"],
  ["brief.md", "01-epic-brief.md"],
  ["requirement-inventory.md", "02-requirement-inventory.md"],
  ["scope-breakdown.md", "03-scope-breakdown.md"],
  ["risk-map.md", "04-risk-map.md"],
  ["release-plan.md", "05-release-plan.md"],
  ["acceptance-map.md", "06-acceptance-map.md"],
  ["progress-board.md", "07-progress-board.md"],
  ["retrospective.md", "08-retrospective.md"],
];

mkdirSync(epicDir, { recursive: true });

for (const [template, target] of files) {
  cpSync(path.join(templateDir, template), path.join(epicDir, target));
}

console.log(`Created epic document package: docs/epics/${epicId}`);
console.log("");
console.log("Next step:");
console.log(`1. Fill docs/epics/${epicId}/00-source.md through 07-progress-board.md`);
console.log(`2. Run: ${epicGateCommand} -- -EpicPath docs/epics/${epicId}`);
