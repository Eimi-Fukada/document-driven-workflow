import { cpSync, existsSync, mkdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseAgentOption, runAgent } from "../../shared/agent-runner.mjs";
import { createWorkflowContext, parseOption as parseSharedOption } from "../../shared/workflow-context.mjs";
import { recordProductTrace } from "../../shared/product-artifacts.mjs";
import { createFeatureManifest, readManifest, writeManifest } from "../../shared/workflow-manifest.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const featureArg = args[0];
const force = args.includes("--force");
const agent = parseAgentOption(args);
const workflow = createWorkflowContext(args);
const mode = args.includes("--light") ? "light" : parseSharedOption(args, "mode", "standard", { startIndex: 1 });
const validModes = new Set(["light", "standard", "strict"]);

if (!validModes.has(mode)) {
  console.error(`Invalid feature hydrate mode: ${mode}`);
  console.error("Allowed values: light, standard, strict");
  process.exit(1);
}

if (!featureArg) {
  console.error("Missing feature path.");
  console.error("Usage: npm run feature:hydrate -- docs/features/<feature-id>");
  process.exit(1);
}

const featurePath = workflow.resolveTarget(featureArg);
const featureId = path.basename(featurePath);
const sourceCandidates = [
  path.join(featurePath, "00-source.md"),
  path.join(featurePath, "01-prd.md"),
];

const sourcePath = sourceCandidates.find((candidate) => existsSync(candidate));
if (!sourcePath) {
  console.error(`Missing source file: ${workflow.relativeToTarget(path.join(featurePath, "00-source.md"))}`);
  console.error("Put raw feature material in 00-source.md or 01-prd.md before hydration.");
  process.exit(1);
}

const source = readFileSync(sourcePath, "utf8").trim();
if (source.length < 50) {
  console.error("Feature source is too short. Add product material before hydration.");
  process.exit(1);
}

const templateDir = path.join(workflow.templateRoot, "feature");
const standardFiles = [
  "00-intake-review.md",
  "01-prd.md",
  "02-ui-spec.md",
  "03-technical-contract.md",
  "04-acceptance-criteria.md",
  "05-readiness-review.md",
  "06-implementation-plan.md",
  "08-context-pack.md",
];
const files = mode === "light" ? ["01-light-feature.md"] : standardFiles;

mkdirSync(featurePath, { recursive: true });

const existingManifest = readManifest(featurePath);
const stackPreset = existingManifest?.stack_preset || parseSharedOption(args, "stack", "next-fullstack", { startIndex: 1 });
const epicId = existingManifest?.epic_id || parseSharedOption(args, "epic", "none", { startIndex: 1 });
writeManifest(
  featurePath,
  createFeatureManifest({
    ...existingManifest,
    id: existingManifest?.id || featureId,
    mode,
    stackPreset,
    epicId,
    sourcePath: workflow.relativeToTarget(sourcePath),
  }),
);
recordProductTrace(workflow, {
  type: "feature",
  id: featureId,
  epicId,
  sourcePath: workflow.relativeToTarget(sourcePath),
});

let created = 0;
let skipped = 0;

for (const file of files) {
  const targetPath = path.join(featurePath, file);
  if (existsSync(targetPath) && !force) {
    skipped += 1;
    continue;
  }

  cpSync(path.join(templateDir, file), targetPath);
  created += 1;
}

console.log(`Feature hydration scaffold ready: ${workflow.relativeToTarget(featurePath)}`);
console.log(`Feature mode: ${mode}`);
console.log(`Created files: ${created}`);
console.log(`Skipped existing files: ${skipped}`);
console.log("");
console.log(`Running hydrate agent: ${agent}`);

const relativeFeaturePath = workflow.relativeToTarget(featurePath);
const relativeSourcePath = workflow.relativeToTarget(sourcePath);
const prompt = `Use document-driven-workflow.

Task: hydrate the Feature document package at ${relativeFeaturePath}.

Instructions:
- Read ${relativeSourcePath}.
- Complete ${mode === "light" ? `${relativeFeaturePath}/01-light-feature.md as a reviewable Light Feature draft` : `${relativeFeaturePath}/00-intake-review.md through ${relativeFeaturePath}/08-context-pack.md as reviewable Feature draft documents`}.
- Write the main human-facing content in Chinese. Keep file names, command names, IDs, status values, and script-matched headings in English where the template already uses them.
- Do not modify ${relativeSourcePath} if it is 00-source.md.
- Do not change ${relativeFeaturePath}/00-workflow.yaml approval, readiness, or status.
- Keep ${relativeFeaturePath}/00-intake-review.md and ${relativeFeaturePath}/08-context-pack.md consistent if those files exist.
- Use light mode only for low-risk, single-scope changes; if the source touches auth, payment, permission, database, task state, deployment, migration, legacy onboarding, or multiple modules, write that the Feature must be upgraded to standard or Epic flow.
- Preserve the user's original product meaning.
- Mark inferred items explicitly as assumptions.
- Remove unresolved template placeholders from the completed draft documents when the source supports a concrete answer.
- If source material is insufficient for a field, write a concise assumption or a review question instead of inventing facts.
- Do not implement code.

Finish in Chinese by summarizing which Feature files were hydrated and what the user must review.`;

runAgent({ agent, cwd: workflow.targetRoot, prompt });
