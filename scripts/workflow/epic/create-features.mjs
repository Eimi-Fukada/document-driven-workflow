import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseAgentOption, runAgent } from "../../shared/agent-runner.mjs";
import { createWorkflowContext, isWorkflowOptionWithValue, parseOption as parseSharedOption } from "../../shared/workflow-context.mjs";
import { recordProductTrace } from "../../shared/product-artifacts.mjs";
import { createFeatureManifest, inheritApproval, readManifest, writeManifest } from "../../shared/workflow-manifest.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const epicArg = args[0];
const force = args.includes("--force");
const agent = parseAgentOption(args);
const workflow = createWorkflowContext(args);

function parseFeatureIds() {
  const fromOption = parseSharedOption(args, "features", "", { startIndex: 1 });
  const optionIds = fromOption
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const positional = [];
  for (let i = 1; i < args.length; i += 1) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      if (isWorkflowOptionWithValue(arg)) {
        i += 1;
      }
      continue;
    }
    positional.push(arg);
  }

  return [...optionIds, ...positional];
}

const stackPreset = parseSharedOption(args, "stack", "next-fullstack", { startIndex: 1 });
const validStacks = new Set(["next-fullstack", "flutter-fastapi", "flutter-express", "legacy-existing"]);

if (!epicArg) {
  console.error("Missing epic path.");
  console.error("Usage: npm run epic:features -- docs/epics/<epic-id> --features feature-a,feature-b --stack next-fullstack");
  process.exit(1);
}

if (!validStacks.has(stackPreset)) {
  console.error(`Invalid stack preset: ${stackPreset}`);
  console.error("Allowed values: next-fullstack, flutter-fastapi, flutter-express, legacy-existing");
  process.exit(1);
}

const featureIds = parseFeatureIds();
if (featureIds.length === 0) {
  console.error("Missing feature ids.");
  console.error("Pass feature ids as positional args or with --features feature-a,feature-b.");
  process.exit(1);
}

for (const featureId of featureIds) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(featureId)) {
    console.error(`Invalid feature id: ${featureId}. Use lowercase letters, numbers, and hyphens only.`);
    process.exit(1);
  }
}

const epicPath = workflow.resolveTarget(epicArg);
const epicId = path.basename(epicPath);
const epicManifest = readManifest(epicPath);

if (!existsSync(epicPath)) {
  console.error(`Epic path not found: ${workflow.relativeToTarget(epicPath)}`);
  process.exit(1);
}

const requiredEpicFiles = [
  "00-source.md",
  "01-epic-brief.md",
  "02-requirement-inventory.md",
  "03-scope-breakdown.md",
  "04-risk-map.md",
  "05-release-plan.md",
  "06-acceptance-map.md",
  "07-progress-board.md",
];

for (const file of requiredEpicFiles) {
  const full = path.join(epicPath, file);
  if (!existsSync(full)) {
    console.error(`Missing Epic file: ${workflow.relativeToTarget(full)}`);
    process.exit(1);
  }
}

const templateDir = path.join(workflow.templateRoot, "feature");
const templateFiles = [
  "00-intake-review.md",
  "01-prd.md",
  "02-ui-spec.md",
  "03-technical-contract.md",
  "04-acceptance-criteria.md",
  "05-readiness-review.md",
  "06-implementation-plan.md",
  "08-context-pack.md",
];

function applyTechnicalPreset(featureDir) {
  const intakePath = path.join(featureDir, "00-intake-review.md");
  let intake = readFileSync(intakePath, "utf8");
  intake = intake
    .replace("- Feature ID:", `- Feature ID: ${path.basename(featureDir)}`)
    .replace("- Related Epic:", `- Related Epic: ${epicId}`)
    .replace("- Stack Preset:", `- Stack Preset: ${stackPreset}`);
  writeFileSync(intakePath, intake, "utf8");

  const technicalPath = path.join(featureDir, "03-technical-contract.md");
  let technical = readFileSync(technicalPath, "utf8");
  const projectMode = stackPreset === "legacy-existing" ? "legacy" : "greenfield";
  const legacyBaseline = stackPreset === "legacy-existing" ? "docs/legacy/BASELINE.md" : "none";
  const compatibilityContract = stackPreset === "legacy-existing" ? "docs/legacy/COMPATIBILITY_CONTRACT.md" : "none";
  const usesAppRouter = stackPreset === "next-fullstack" ? "yes" : "not-applicable";

  technical = technical
    .replace(/^- Stack Preset:.*$/m, `- Stack Preset: ${stackPreset}`)
    .replace(/^- Project Mode:.*$/m, `- Project Mode: ${projectMode}`)
    .replace(/^- Legacy Baseline:.*$/m, `- Legacy Baseline: ${legacyBaseline}`)
    .replace(/^- Compatibility Contract:.*$/m, `- Compatibility Contract: ${compatibilityContract}`)
    .replace(/^- .*Next\.js App Router.*$/m, `- Next.js App Router: ${usesAppRouter}`)
    .replace(/^- .*Next\.js Pages Router.*$/m, "- Next.js Pages Router: no");

  writeFileSync(technicalPath, technical, "utf8");
}

let created = 0;
let skipped = 0;
const featurePaths = [];

for (const featureId of featureIds) {
  const featureDir = path.join(workflow.targetRoot, "docs", "features", featureId);
  mkdirSync(featureDir, { recursive: true });
  featurePaths.push(featureDir);

  let manifest = createFeatureManifest({
    id: featureId,
    mode: "standard",
    stackPreset,
    epicId,
    sourcePath: "00-source.md",
  });
  if (epicManifest?.approval === "approved" && epicManifest?.readiness === "ready") {
    manifest = inheritApproval(manifest, workflow.relativeToTarget(epicPath));
  }
  writeManifest(featureDir, manifest);
  recordProductTrace(workflow, {
    type: "feature",
    id: featureId,
    epicId,
    sourcePath: workflow.relativeToTarget(epicPath),
  });

  const sourcePath = path.join(featureDir, "00-source.md");
  if (!existsSync(sourcePath) || force) {
    writeFileSync(
      sourcePath,
      `# Feature Source

- Epic ID: ${epicId}
- Epic Path: ${workflow.relativeToTarget(epicPath)}
- Feature ID: ${featureId}

本 Feature 必须从 Epic 文档包中推导。保留 Epic 范围、风险、依赖和验收映射。
`,
      "utf8",
    );
  }

  for (const file of templateFiles) {
    const targetPath = path.join(featureDir, file);
    if (existsSync(targetPath) && !force) {
      skipped += 1;
      continue;
    }

    cpSync(path.join(templateDir, file), targetPath);
    created += 1;
  }

  applyTechnicalPreset(featureDir);
}

function writeAgentPlan(featureIdsToPlan) {
  const planPath = path.join(epicPath, "09-agent-plan.md");
  if (existsSync(planPath) && !force) {
    return;
  }

  const rows = featureIdsToPlan
    .map((featureId, index) => `| ${featureId} | Agent ${index + 1} | Parallel if dependencies are clear | docs/features/${featureId}/08-context-pack.md | docs/features/${featureId} and files approved by 06-implementation-plan.md | Auth/payment/deployment/data migration unless explicitly approved | Run Feature gate, project tests, and update 07-verification-report.md | Review file overlap before merge |`)
    .join("\n");

  writeFileSync(
    planPath,
    `# Agent Plan

- Epic ID: ${epicId}

## Parallelization Rule

只有当 Feature 边界、依赖、允许文件、禁止文件和验证命令都清楚时，才使用多 agent 并行。

## Assignment Matrix

| Feature ID | Suggested Agent | Parallelization | Required Context | Allowed Scope | Forbidden Scope | Verification | Merge Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## User Review

Agent 分工只是建议。批准只记录在 \`00-workflow.yaml\`。
`,
    "utf8",
  );
}

writeAgentPlan(featureIds);

console.log(`Feature packages prepared from Epic: ${workflow.relativeToTarget(epicPath)}`);
console.log(`Feature count: ${featureIds.length}`);
console.log(`Created files: ${created}`);
console.log(`Skipped existing files: ${skipped}`);
console.log(`Stack preset: ${stackPreset}`);
console.log("");
console.log(`Running Epic-to-Feature agent: ${agent}`);

const relativeEpicPath = workflow.relativeToTarget(epicPath);
const relativeFeaturePaths = featurePaths.map((featurePath) => workflow.relativeToTarget(featurePath));
const prompt = `Use document-driven-workflow.

Task: generate Feature draft documents from Epic ${relativeEpicPath}.

Epic source:
- ${requiredEpicFiles.map((file) => `${relativeEpicPath}/${file}`).join("\n- ")}

Feature packages to complete:
- ${relativeFeaturePaths.join("\n- ")}

Instructions:
- Read the full Epic package first.
- For each Feature package, complete 00-intake-review.md through 08-context-pack.md.
- Write the main human-facing content in Chinese. Keep file names, command names, IDs, status values, and script-matched headings in English where the template already uses them.
- Do not modify the Epic files.
- Do not change approval, readiness, or status in any Feature 00-workflow.yaml.
- Keep docs/product/requirement-ledger.md and docs/product/traceability.md aligned with the generated Feature IDs when concrete REQ/AC IDs are known.
- Keep each Feature independently developable and testable.
- Preserve Epic scope, risks, dependencies, and acceptance mapping.
- Mark inferred items explicitly as assumptions.
- If a Feature ID is not clearly supported by the Epic, write review questions in that Feature instead of inventing scope.
- Do not implement code.

Finish in Chinese by summarizing every Feature package generated and what the user must review.`;

runAgent({ agent, cwd: workflow.targetRoot, prompt });
