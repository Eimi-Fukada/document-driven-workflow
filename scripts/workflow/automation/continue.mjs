import { existsSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { parseAgentOption } from "../../shared/agent-runner.mjs";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { approveManifest, readManifest, writeManifest } from "../../shared/workflow-manifest.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const agent = parseAgentOption(args);
const subjectArg = parseOption(args, "subject", args[0] || "", { startIndex: 0 });
const userApproved = args.includes("--user-approved");
const featuresArg = parseOption(args, "features", "", { startIndex: 0 });
const stackPreset = parseOption(args, "stack", "next-fullstack", { startIndex: 0 });

if (!subjectArg) {
  console.error("Missing workflow subject path.");
  console.error("Usage: node scripts/workflow/automation/continue.mjs <docs/features/id|docs/epics/id> --target <project-root> [--user-approved]");
  process.exit(1);
}

const subjectPath = workflow.resolveTarget(subjectArg);
if (!existsSync(subjectPath)) {
  console.error(`Workflow subject not found: ${workflow.relativeToTarget(subjectPath)}`);
  process.exit(1);
}

const manifest = readManifest(subjectPath);
if (!manifest) {
  console.error("Missing 00-workflow.yaml. Cannot continue without the workflow control file.");
  process.exit(1);
}

function runNode(scriptRelativePath, scriptArgs, { allowFailure = false } = {}) {
  const scriptPath = path.join(workflow.packageRoot, scriptRelativePath);
  const result = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    cwd: workflow.targetRoot,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.error) {
    console.error(`Failed to run ${scriptRelativePath}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0 && !allowFailure) {
    process.exit(result.status || 1);
  }
  return result.status || 0;
}

let currentManifest = manifest;
if (userApproved) {
  if (currentManifest.unresolved_questions !== "0" || currentManifest.blocking_issues !== "0") {
    console.error("Refusing to approve while unresolved_questions or blocking_issues is non-zero.");
    process.exit(1);
  }
  currentManifest = approveManifest(currentManifest);
  writeManifest(subjectPath, currentManifest);
  console.log(`Applied user approval to: ${workflow.relativeToTarget(subjectPath)}`);
} else if (!["approved", "inherited"].includes(currentManifest.approval)) {
  console.error("Subject is not approved. Rerun with --user-approved after the user explicitly approves the documents.");
  process.exit(1);
}

if (currentManifest.type === "epic") {
  runNode("scripts/workflow/epic/gate-epic.mjs", [subjectArg, "--target", workflow.targetRoot]);

  if (featuresArg) {
    runNode("scripts/workflow/epic/create-features.mjs", [
      subjectArg,
      "--target",
      workflow.targetRoot,
      "--features",
      featuresArg,
      "--stack",
      stackPreset,
      "--agent",
      agent,
    ]);
    console.log("");
    console.log("Epic gate passed and Feature packages were generated.");
    console.log("Next step: review generated Features, then use document-driven-workflow to continue each implementation-ready Feature.");
  } else {
    console.log("");
    console.log("Epic gate passed.");
    console.log("Next step: use document-driven-workflow to split this Epic into Features, or rerun this script with --features feature-a,feature-b.");
  }
  process.exit(0);
}

if (currentManifest.type !== "feature") {
  console.error(`Unsupported workflow type: ${currentManifest.type || "unset"}`);
  process.exit(1);
}

if (currentManifest.mode !== "light") {
  runNode("scripts/workflow/automation/context-pack.mjs", [
    subjectArg,
    "--target",
    workflow.targetRoot,
    "--force",
  ]);
}

runNode("scripts/workflow/feature/gate-feature.mjs", [subjectArg, "--target", workflow.targetRoot]);

console.log("");
console.log("Feature gate passed.");
if (currentManifest.mode === "light") {
  console.log(`Implementation context: ${workflow.relativeToTarget(path.join(subjectPath, "01-light-feature.md"))}`);
} else {
  console.log(`Implementation plan: ${workflow.relativeToTarget(path.join(subjectPath, "06-implementation-plan.md"))}`);
  console.log(`Context pack: ${workflow.relativeToTarget(path.join(subjectPath, "08-context-pack.md"))}`);
}
console.log("Implementation may start, staying inside the approved Scope Lock.");
