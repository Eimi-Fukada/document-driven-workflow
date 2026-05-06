import { cpSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const featureId = process.argv[2];

if (!featureId) {
  console.error("Missing feature id.");
  console.error("Usage: npm run feature:new -- <feature-id>");
  process.exit(1);
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(featureId)) {
  console.error("Invalid feature id. Use lowercase letters, numbers, and hyphens only.");
  process.exit(1);
}

const featureDir = path.join(repoRoot, "docs", "features", featureId);
if (existsSync(featureDir)) {
  console.error(`Feature already exists: docs/features/${featureId}`);
  process.exit(1);
}

const templateDir = path.join(repoRoot, "docs", "workflow", "templates");
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

console.log(`Created feature document package: docs/features/${featureId}`);
console.log("");
console.log("Next step:");
console.log(`1. Fill docs/features/${featureId}/01-prd.md through 06-implementation-plan.md`);
console.log(`2. Run: npm run gate:dev -- -FeaturePath docs/features/${featureId}`);

