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

if (!epicArg) {
  console.error("Missing epic path.");
  console.error("Usage: npm run epic:hydrate -- docs/epics/<epic-id>");
  process.exit(1);
}

const epicPath = path.isAbsolute(epicArg) ? epicArg : path.join(repoRoot, epicArg);
const sourcePath = path.join(epicPath, "00-source.md");

if (!existsSync(sourcePath)) {
  console.error(`Missing source file: ${path.relative(repoRoot, sourcePath)}`);
  console.error("Create the epic first and put raw product material in 00-source.md.");
  process.exit(1);
}

const source = readFileSync(sourcePath, "utf8").trim();
if (source.length < 80) {
  console.error("Epic source is too short. Add the original product material before hydration.");
  process.exit(1);
}

const templateDir = path.join(repoRoot, "docs", "workflow", "templates", "epic");
const files = [
  ["brief.md", "01-epic-brief.md"],
  ["requirement-inventory.md", "02-requirement-inventory.md"],
  ["scope-breakdown.md", "03-scope-breakdown.md"],
  ["risk-map.md", "04-risk-map.md"],
  ["release-plan.md", "05-release-plan.md"],
  ["acceptance-map.md", "06-acceptance-map.md"],
  ["progress-board.md", "07-progress-board.md"],
  ["retrospective.md", "08-retrospective.md"],
];

mkdirSync(epicPath, { recursive: true });

let created = 0;
let skipped = 0;

for (const [template, target] of files) {
  const targetPath = path.join(epicPath, target);
  if (existsSync(targetPath) && !force) {
    skipped += 1;
    continue;
  }

  cpSync(path.join(templateDir, template), targetPath);
  created += 1;
}

const markerPath = path.join(epicPath, "HYDRATION.md");
const marker = `# Epic Hydration Notes

- Hydration Status: Draft
- Review Status: Draft
- User Approval: Pending

## Allowed Values

- Hydration Status: Draft / Reviewed
- Review Status: Draft / Reviewed
- User Approval: Pending / Approved

Common approved state after user review:

\`\`\`text
- Hydration Status: Reviewed
- Review Status: Reviewed
- User Approval: Approved
\`\`\`

## AI Instructions

Read \`00-source.md\`, then complete the Epic documents from \`01-epic-brief.md\` to \`07-progress-board.md\`.

Rules:

- Preserve the original product meaning.
- Mark inferred items explicitly as assumptions.
- Do not set User Approval to Approved.
- Do not set Review Status to Reviewed.
- Ask the user to review after completing the draft.
- The Epic gate must fail until the user approves the hydrated documents.
`;

if (!existsSync(markerPath) || force) {
  writeFileSync(markerPath, marker, "utf8");
}

console.log(`Epic hydration scaffold ready: ${path.relative(repoRoot, epicPath)}`);
console.log(`Created files: ${created}`);
console.log(`Skipped existing files: ${skipped}`);
console.log("");
console.log(`Running hydrate agent: ${agent}`);

const relativeEpicPath = path.relative(repoRoot, epicPath).replaceAll("\\", "/");
const prompt = `Use document-driven-workflow.

Task: hydrate the Epic document package at ${relativeEpicPath}.

Instructions:
- Read ${relativeEpicPath}/00-source.md.
- Complete ${relativeEpicPath}/01-epic-brief.md through ${relativeEpicPath}/07-progress-board.md as reviewable Epic draft documents.
- Do not modify ${relativeEpicPath}/00-source.md.
- Do not mark anything as Approved.
- Keep HYDRATION.md with Review Status: Draft and User Approval: Pending.
- Preserve the user's original product meaning.
- Mark inferred items explicitly as assumptions.
- Remove unresolved template placeholders from the completed draft documents when the source supports a concrete answer.
- If source material is insufficient for a field, write a concise assumption or a review question instead of inventing facts.
- Do not implement code.

Finish by summarizing which Epic files were hydrated and what the user must review.`;

runAgent({ agent, cwd: repoRoot, prompt });
