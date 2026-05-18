import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createWorkflowContext, parseOption as parseSharedOption } from "../../shared/workflow-context.mjs";
import { recordProductTrace } from "../../shared/product-artifacts.mjs";
import { createFeatureManifest, writeManifest } from "../../shared/workflow-manifest.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const featureId = args[0];
const workflow = createWorkflowContext(args);

const stackPreset = parseSharedOption(args, "stack", "next-fullstack", { startIndex: 1 });
const epicId = parseSharedOption(args, "epic", "none", { startIndex: 1 });
const mode = parseSharedOption(args, "mode", "standard", { startIndex: 1 });
const validStacks = new Set(["next-fullstack", "flutter-fastapi", "flutter-express", "legacy-existing"]);
const validModes = new Set(["light", "standard", "strict"]);

if (!featureId) {
  console.error("Missing feature id.");
  console.error("Usage: npm run feature:new -- <feature-id> --stack next-fullstack [--mode light|standard|strict]");
  process.exit(1);
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(featureId)) {
  console.error("Invalid feature id. Use lowercase letters, numbers, and hyphens only.");
  process.exit(1);
}

if (!validStacks.has(stackPreset)) {
  console.error(`Invalid stack preset: ${stackPreset}`);
  console.error("Allowed values: next-fullstack, flutter-fastapi, flutter-express, legacy-existing");
  process.exit(1);
}

if (!validModes.has(mode)) {
  console.error(`Invalid feature mode: ${mode}`);
  console.error("Allowed values: light, standard, strict");
  process.exit(1);
}

if (epicId !== "none" && !/^[a-z0-9][a-z0-9-]*$/.test(epicId)) {
  console.error("Invalid epic id. Use lowercase letters, numbers, and hyphens only.");
  process.exit(1);
}

const featureDir = path.join(workflow.targetRoot, "docs", "features", featureId);
if (existsSync(featureDir)) {
  console.error(`Feature already exists: docs/features/${featureId}`);
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

mkdirSync(featureDir, { recursive: true });
writeManifest(featureDir, createFeatureManifest({ id: featureId, mode, stackPreset, epicId }));
recordProductTrace(workflow, { type: "feature", id: featureId, epicId, sourcePath: `docs/features/${featureId}` });

for (const file of files) {
  cpSync(path.join(templateDir, file), path.join(featureDir, file));
}

if (mode === "light") {
  const lightFeaturePath = path.join(featureDir, "01-light-feature.md");
  let lightFeature = readFileSync(lightFeaturePath, "utf8");
  lightFeature = lightFeature
    .replace("- Stack Preset: unset", `- Stack Preset: ${stackPreset}`)
    .replace("- Epic ID: none", `- Epic ID: ${epicId}`);
  writeFileSync(lightFeaturePath, lightFeature, "utf8");
} else {
  const intakePath = path.join(featureDir, "00-intake-review.md");
  let intake = readFileSync(intakePath, "utf8");
  intake = intake
    .replace("- Feature ID:", `- Feature ID: ${featureId}`)
    .replace("- Related Epic:", `- Related Epic: ${epicId}`)
    .replace("- Stack Preset:", `- Stack Preset: ${stackPreset}`);
  writeFileSync(intakePath, intake, "utf8");

  const technicalContractPath = path.join(featureDir, "03-technical-contract.md");
  let technicalContract = readFileSync(technicalContractPath, "utf8");

  const projectMode = stackPreset === "legacy-existing" ? "legacy" : "greenfield";
  const legacyBaseline = stackPreset === "legacy-existing" ? "docs/legacy/BASELINE.md" : "none";
  const compatibilityContract =
    stackPreset === "legacy-existing" ? "docs/legacy/COMPATIBILITY_CONTRACT.md" : "none";
  const usesAppRouter = stackPreset === "next-fullstack" ? "yes" : "not-applicable";

  technicalContract = technicalContract
    .replace("- Stack Preset: unset", `- Stack Preset: ${stackPreset}`)
    .replace("- Project Mode: greenfield", `- Project Mode: ${projectMode}`)
    .replace("- Legacy Baseline: none", `- Legacy Baseline: ${legacyBaseline}`)
    .replace("- Compatibility Contract: none", `- Compatibility Contract: ${compatibilityContract}`)
    .replace(/^- Next\.js App Router:.*$/m, `- Next.js App Router: ${usesAppRouter}`)
    .replace(/^- Next\.js Pages Router:.*$/m, "- Next.js Pages Router: no");

  writeFileSync(technicalContractPath, technicalContract, "utf8");
}

if (mode !== "light" && epicId !== "none") {
  const prdPath = path.join(featureDir, "01-prd.md");
  let prd = readFileSync(prdPath, "utf8");
  prd = prd.replace(
    "## 基本信息",
    `## 基本信息\n\n- Epic ID: ${epicId}\n- Epic Path: docs/epics/${epicId}`,
  );
  writeFileSync(prdPath, prd, "utf8");
}

console.log(`Created feature document package: docs/features/${featureId}`);
console.log(`Stack preset: ${stackPreset}`);
console.log(`Feature mode: ${mode}`);
if (epicId !== "none") {
  console.log(`Epic: ${epicId}`);
}
console.log("");
console.log("Next step:");
if (mode === "light") {
  console.log(`1. Fill docs/features/${featureId}/01-light-feature.md`);
} else {
  console.log(`1. Fill docs/features/${featureId}/00-intake-review.md through 08-context-pack.md`);
}
console.log(`2. User reviews and explicitly approves the Feature`);
console.log(`3. Run workflow:continue for docs/features/${featureId} with --user-approved`);
