import { cpSync, existsSync, mkdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseAgentOption, runAgent } from "../../shared/agent-runner.mjs";
import { createWorkflowContext } from "../../shared/workflow-context.mjs";
import { recordProductTrace } from "../../shared/product-artifacts.mjs";
import { createEpicManifest, readManifest, writeManifest } from "../../shared/workflow-manifest.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const epicArg = args[0];
const force = args.includes("--force");
const agent = parseAgentOption(args);
const workflow = createWorkflowContext(args);

if (!epicArg) {
  console.error("Missing epic path.");
  console.error("Usage: npm run epic:hydrate -- docs/epics/<epic-id>");
  process.exit(1);
}

const epicPath = workflow.resolveTarget(epicArg);
const epicId = path.basename(epicPath);
const sourcePath = path.join(epicPath, "00-source.md");

if (!existsSync(sourcePath)) {
  console.error(`Missing source file: ${workflow.relativeToTarget(sourcePath)}`);
  console.error("Create the epic first and put raw product material in 00-source.md.");
  process.exit(1);
}

const source = readFileSync(sourcePath, "utf8").trim();
if (source.length < 80) {
  console.error("Epic source is too short. Add the original product material before hydration.");
  process.exit(1);
}

const templateDir = path.join(workflow.templateRoot, "epic");
const files = [
  "01-epic-brief.md",
  "02-requirement-inventory.md",
  "03-scope-breakdown.md",
  "04-risk-map.md",
  "05-release-plan.md",
  "06-acceptance-map.md",
  "07-progress-board.md",
  "08-retrospective.md",
];

mkdirSync(epicPath, { recursive: true });
writeManifest(
  epicPath,
  createEpicManifest({
    ...readManifest(epicPath),
    id: epicId,
    sourcePath: workflow.relativeToTarget(sourcePath),
  }),
);
recordProductTrace(workflow, { type: "epic", id: epicId, sourcePath: workflow.relativeToTarget(sourcePath) });

let created = 0;
let skipped = 0;

for (const file of files) {
  const targetPath = path.join(epicPath, file);
  if (existsSync(targetPath) && !force) {
    skipped += 1;
    continue;
  }

  cpSync(path.join(templateDir, file), targetPath);
  created += 1;
}

console.log(`Epic hydration scaffold ready: ${workflow.relativeToTarget(epicPath)}`);
console.log(`Created files: ${created}`);
console.log(`Skipped existing files: ${skipped}`);
console.log("");
console.log(`Running hydrate agent: ${agent}`);

const relativeEpicPath = workflow.relativeToTarget(epicPath);
const prompt = `Use document-driven-workflow.

Task: hydrate the Epic document package at ${relativeEpicPath}.

Instructions:
- Read ${relativeEpicPath}/00-source.md.
- Complete ${relativeEpicPath}/01-epic-brief.md through ${relativeEpicPath}/07-progress-board.md as reviewable Epic draft documents.
- Write the main human-facing content in Chinese. Keep file names, command names, IDs, status values, and script-matched headings in English where the template already uses them.
- Do not modify ${relativeEpicPath}/00-source.md.
- Do not change ${relativeEpicPath}/00-workflow.yaml approval, readiness, or status.
- Keep docs/product/requirement-ledger.md and docs/product/traceability.md aligned with the Epic scope when concrete IDs are known.
- Preserve the user's original product meaning.
- Mark inferred items explicitly as assumptions.
- Remove unresolved template placeholders from the completed draft documents when the source supports a concrete answer.
- If source material is insufficient for a field, write a concise assumption or a review question instead of inventing facts.
- Do not implement code.

Finish in Chinese by summarizing which Epic files were hydrated and what the user must review.`;

runAgent({ agent, cwd: workflow.targetRoot, prompt });
