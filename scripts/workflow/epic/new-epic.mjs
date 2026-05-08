import { cpSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createWorkflowContext } from "../../shared/workflow-context.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const epicGateCommand = process.env.WORKFLOW_EPIC_GATE_COMMAND || "npm run gate:epic";

const args = process.argv.slice(2);
const epicId = args[0];
const workflow = createWorkflowContext(args);

if (!epicId) {
  console.error("Missing epic id.");
  console.error("Usage: npm run epic:new -- <epic-id>");
  process.exit(1);
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(epicId)) {
  console.error("Invalid epic id. Use lowercase letters, numbers, and hyphens only.");
  process.exit(1);
}

const epicDir = path.join(workflow.targetRoot, "docs", "epics", epicId);
if (existsSync(epicDir)) {
  console.error(`Epic already exists: docs/epics/${epicId}`);
  process.exit(1);
}

const templateDir = path.join(workflow.templateRoot, "epic");
const files = [
  "00-source.md",
  "01-epic-brief.md",
  "02-requirement-inventory.md",
  "03-scope-breakdown.md",
  "04-risk-map.md",
  "05-release-plan.md",
  "06-acceptance-map.md",
  "07-progress-board.md",
  "08-retrospective.md",
];

mkdirSync(epicDir, { recursive: true });

for (const file of files) {
  cpSync(path.join(templateDir, file), path.join(epicDir, file));
}

console.log(`Created epic document package: docs/epics/${epicId}`);
console.log("");
console.log("Next step:");
console.log(`1. Fill docs/epics/${epicId}/00-source.md through 07-progress-board.md`);
console.log(`2. Run the Epic gate for docs/epics/${epicId}`);
