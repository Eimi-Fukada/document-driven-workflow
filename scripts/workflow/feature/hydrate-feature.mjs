import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const featureArg = args[0];
const force = args.includes("--force");

if (!featureArg) {
  console.error("Missing feature path.");
  console.error("Usage: npm run feature:hydrate -- docs/features/<feature-id>");
  process.exit(1);
}

const featurePath = path.isAbsolute(featureArg) ? featureArg : path.join(repoRoot, featureArg);
const sourceCandidates = [
  path.join(featurePath, "00-source.md"),
  path.join(featurePath, "01-prd.md"),
];

const sourcePath = sourceCandidates.find((candidate) => existsSync(candidate));
if (!sourcePath) {
  console.error(`Missing source file: ${path.relative(repoRoot, path.join(featurePath, "00-source.md"))}`);
  console.error("Put raw feature material in 00-source.md or 01-prd.md before hydration.");
  process.exit(1);
}

const source = readFileSync(sourcePath, "utf8").trim();
if (source.length < 50) {
  console.error("Feature source is too short. Add product material before hydration.");
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

mkdirSync(featurePath, { recursive: true });

let created = 0;
let skipped = 0;

for (const [template, target] of files) {
  const targetPath = path.join(featurePath, target);
  if (existsSync(targetPath) && !force) {
    skipped += 1;
    continue;
  }

  cpSync(path.join(templateDir, template), targetPath);
  created += 1;
}

const markerPath = path.join(featurePath, "HYDRATION.md");
const marker = `# Feature Hydration Notes

- Hydration Status: Draft
- Review Status: Draft
- User Approval: Pending

## AI Instructions

Read the raw feature material from \`${path.basename(sourcePath)}\`, then complete \`01-prd.md\` through \`06-implementation-plan.md\`.

Rules:

- Preserve the original product meaning.
- Mark inferred items explicitly as assumptions.
- Do not set User Approval to Approved.
- Do not set Implementation Plan Status to Approved.
- Do not set Readiness to Ready until the user has reviewed the draft.
- The development gate must fail until the user approves the hydrated documents.
`;

if (!existsSync(markerPath) || force) {
  writeFileSync(markerPath, marker, "utf8");
}

console.log(`Feature hydration scaffold ready: ${path.relative(repoRoot, featurePath)}`);
console.log(`Created files: ${created}`);
console.log(`Skipped existing files: ${skipped}`);
console.log("");
console.log("Next AI step:");
console.log("Read the raw material and complete the Feature draft documents for user review.");
