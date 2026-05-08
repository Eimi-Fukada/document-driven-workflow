import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseAgentOption, runAgent } from "../../shared/agent-runner.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const epicArg = args[0];
const force = args.includes("--force");
const agent = parseAgentOption(args);

function parseOption(name, fallback) {
  for (let i = 1; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === `--${name}`) {
      return args[i + 1] || fallback;
    }
    if (arg.startsWith(`--${name}=`)) {
      return arg.split("=")[1] || fallback;
    }
  }
  return fallback;
}

function parseFeatureIds() {
  const fromOption = parseOption("features", "");
  const optionIds = fromOption
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const positional = [];
  for (let i = 1; i < args.length; i += 1) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      if (["--features", "--stack", "--agent"].includes(arg)) {
        i += 1;
      }
      continue;
    }
    positional.push(arg);
  }

  return [...optionIds, ...positional];
}

const stackPreset = parseOption("stack", "next-fullstack");
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

const epicPath = path.isAbsolute(epicArg) ? epicArg : path.join(repoRoot, epicArg);
const epicId = path.basename(epicPath);

if (!existsSync(epicPath)) {
  console.error(`Epic path not found: ${path.relative(repoRoot, epicPath)}`);
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
    console.error(`Missing Epic file: ${path.relative(repoRoot, full)}`);
    process.exit(1);
  }
}

const templateDir = path.join(repoRoot, "docs", "workflow", "templates", "feature");
const templateFiles = [
  ["prd.md", "01-prd.md"],
  ["ui-spec.md", "02-ui-spec.md"],
  ["technical-contract.md", "03-technical-contract.md"],
  ["acceptance.md", "04-acceptance-criteria.md"],
  ["readiness-review.md", "05-readiness-review.md"],
  ["implementation-plan.md", "06-implementation-plan.md"],
];

function applyTechnicalPreset(featureDir) {
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

function writeHydrationMarker(featureDir, featureId) {
  const markerPath = path.join(featureDir, "HYDRATION.md");
  const marker = `# Feature Hydration Notes

- Hydration Status: Draft
- Review Status: Draft
- User Approval: Pending

<!--
Allowed Status Values

- Hydration Status: Draft / Reviewed
- Review Status: Draft / Reviewed
- User Approval: Pending / Approved

Common approved state after user review:

\`\`\`text
- Hydration Status: Reviewed
- Review Status: Reviewed
- User Approval: Approved
\`\`\`
-->

## Source

- Epic ID: ${epicId}
- Epic Path: ${path.relative(repoRoot, epicPath).replaceAll("\\", "/")}
- Feature ID: ${featureId}

## AI Instructions

Read the Epic package, then complete \`01-prd.md\` through \`06-implementation-plan.md\` for this Feature.

Rules:

- Preserve the Epic meaning and scope.
- Keep this Feature independently developable and testable.
- Mark inferred items explicitly as assumptions.
- Do not set User Approval to Approved.
- Do not set Implementation Plan Status to Approved.
- Do not set Readiness to Ready until the user has reviewed the draft.
- The development gate must fail until the user approves the hydrated documents.
`;

  if (!existsSync(markerPath) || force) {
    writeFileSync(markerPath, marker, "utf8");
  }
}

let created = 0;
let skipped = 0;
const featurePaths = [];

for (const featureId of featureIds) {
  const featureDir = path.join(repoRoot, "docs", "features", featureId);
  mkdirSync(featureDir, { recursive: true });
  featurePaths.push(featureDir);

  const sourcePath = path.join(featureDir, "00-source.md");
  if (!existsSync(sourcePath) || force) {
    writeFileSync(
      sourcePath,
      `# Feature Source

- Epic ID: ${epicId}
- Epic Path: ${path.relative(repoRoot, epicPath).replaceAll("\\", "/")}
- Feature ID: ${featureId}

This Feature must be derived from the Epic package. Preserve Epic scope, risks, dependencies, and acceptance mapping.
`,
      "utf8",
    );
  }

  for (const [template, target] of templateFiles) {
    const targetPath = path.join(featureDir, target);
    if (existsSync(targetPath) && !force) {
      skipped += 1;
      continue;
    }

    cpSync(path.join(templateDir, template), targetPath);
    created += 1;
  }

  applyTechnicalPreset(featureDir);
  writeHydrationMarker(featureDir, featureId);
}

console.log(`Feature packages prepared from Epic: ${path.relative(repoRoot, epicPath)}`);
console.log(`Feature count: ${featureIds.length}`);
console.log(`Created files: ${created}`);
console.log(`Skipped existing files: ${skipped}`);
console.log(`Stack preset: ${stackPreset}`);
console.log("");
console.log(`Running Epic-to-Feature agent: ${agent}`);

const relativeEpicPath = path.relative(repoRoot, epicPath).replaceAll("\\", "/");
const relativeFeaturePaths = featurePaths.map((featurePath) => path.relative(repoRoot, featurePath).replaceAll("\\", "/"));
const prompt = `Use document-driven-workflow.

Task: generate Feature draft documents from Epic ${relativeEpicPath}.

Epic source:
- ${requiredEpicFiles.map((file) => `${relativeEpicPath}/${file}`).join("\n- ")}

Feature packages to complete:
- ${relativeFeaturePaths.join("\n- ")}

Instructions:
- Read the full Epic package first.
- For each Feature package, complete 01-prd.md through 06-implementation-plan.md.
- Do not modify the Epic files.
- Do not mark anything as Approved.
- Keep every HYDRATION.md with Review Status: Draft and User Approval: Pending.
- Keep each Feature independently developable and testable.
- Preserve Epic scope, risks, dependencies, and acceptance mapping.
- Mark inferred items explicitly as assumptions.
- If a Feature ID is not clearly supported by the Epic, write review questions in that Feature instead of inventing scope.
- Do not implement code.

Finish by summarizing every Feature package generated and what the user must review.`;

runAgent({ agent, cwd: repoRoot, prompt });
