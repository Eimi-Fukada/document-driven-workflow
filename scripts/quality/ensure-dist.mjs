import { existsSync } from "fs";
import path from "path";
import { buildSkills } from "../build/build-skills.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const skillDist = path.join(repoRoot, "dist", "skills", "document-driven-workflow", "SKILL.md");

if (!existsSync(skillDist)) {
  console.log("Skill dist is missing. Building before check...");
  buildSkills();
}
