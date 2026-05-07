import { cpSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const gateCommand = process.env.WORKFLOW_GATE_COMMAND || "npm run gate:dev";

const args = process.argv.slice(2);
const featureId = args[0];

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

const stackPreset = parseOption("stack", "next-fullstack");
const epicId = parseOption("epic", "none");
const validStacks = new Set(["next-fullstack", "flutter-fastapi", "flutter-express", "legacy-existing"]);

if (!featureId) {
  console.error("Missing feature id.");
  console.error("Usage: npm run feature:new -- <feature-id> --stack next-fullstack");
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

if (epicId !== "none" && !/^[a-z0-9][a-z0-9-]*$/.test(epicId)) {
  console.error("Invalid epic id. Use lowercase letters, numbers, and hyphens only.");
  process.exit(1);
}

const featureDir = path.join(repoRoot, "docs", "features", featureId);
if (existsSync(featureDir)) {
  console.error(`Feature already exists: docs/features/${featureId}`);
  process.exit(1);
}

const templateDir = path.join(repoRoot, "docs", "workflow", "templates", "feature");
const files = [
  ["prd.md", "01-prd.md"],
  ["ui-spec.md", "02-ui-spec.md"],
  ["technical-contract.md", "03-technical-contract.md"],
  ["acceptance.md", "04-acceptance-criteria.md"],
  ["readiness-review.md", "05-readiness-review.md"],
  ["implementation-plan.md", "06-implementation-plan.md"],
];

mkdirSync(featureDir, { recursive: true });

for (const [template, target] of files) {
  cpSync(path.join(templateDir, template), path.join(featureDir, target));
}

const technicalContractPath = path.join(featureDir, "03-technical-contract.md");
let technicalContract = await import("fs").then(({ readFileSync }) =>
  readFileSync(technicalContractPath, "utf8"),
);

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
  .replace("- 是否使用 Next.js App Router：yes / no / not-applicable", `- 是否使用 Next.js App Router：${usesAppRouter}`)
  .replace("- 是否使用 Next.js Pages Router：no", "- 是否使用 Next.js Pages Router：no");

await import("fs").then(({ writeFileSync }) =>
  writeFileSync(technicalContractPath, technicalContract, "utf8"),
);

if (epicId !== "none") {
  const prdPath = path.join(featureDir, "01-prd.md");
  let prd = await import("fs").then(({ readFileSync }) => readFileSync(prdPath, "utf8"));
  prd = prd.replace(
    "## 基本信息",
    `## 基本信息\n\n- Epic ID: ${epicId}\n- Epic Path: docs/epics/${epicId}`,
  );
  await import("fs").then(({ writeFileSync }) => writeFileSync(prdPath, prd, "utf8"));
}

console.log(`Created feature document package: docs/features/${featureId}`);
console.log(`Stack preset: ${stackPreset}`);
if (epicId !== "none") {
  console.log(`Epic: ${epicId}`);
}
console.log("");
console.log("Next step:");
console.log(`1. Fill docs/features/${featureId}/01-prd.md through 06-implementation-plan.md`);
console.log(`2. Run: ${gateCommand} -- -FeaturePath docs/features/${featureId}`);
