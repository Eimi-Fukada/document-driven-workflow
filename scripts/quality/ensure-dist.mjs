import { existsSync } from "fs";
import path from "path";
import { buildSkills } from "../build/build-skills.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const requiredDistFiles = [
  "dist/skills/document-driven-workflow/SKILL.md",
  "dist/skills/document-driven-workflow/references/AUTOMATION.md",
  "dist/skills/document-driven-workflow/references/USER_GUIDE.md",
  "dist/skills/document-driven-workflow/scripts/workflow/automation/process.mjs",
  "dist/skills/document-driven-workflow/templates/feature/REVIEW.md",
];

if (requiredDistFiles.some((file) => !existsSync(path.join(repoRoot, file)))) {
  console.log("Skill dist is missing or incomplete. Building before check...");
  buildSkills();
}
