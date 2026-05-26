import { existsSync } from "fs";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { approveManifest, readManifest, validateRouteDecision, writeManifest } from "../../shared/workflow-manifest.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const subjectArg = parseOption(args, "subject", args[0] || "", { startIndex: 0 });
const userApproved = args.includes("--user-approved");

if (!subjectArg) {
  console.error("Missing workflow document path.");
  console.error("Usage: node scripts/workflow/automation/approve.mjs <docs/features/id|docs/epics/id> --target <project-root> --user-approved");
  process.exit(1);
}

if (!userApproved) {
  console.error("Refusing to approve without explicit --user-approved.");
  console.error("This script may only run after the user explicitly approved the documents.");
  process.exit(1);
}

const subjectPath = workflow.resolveTarget(subjectArg);
if (!existsSync(subjectPath)) {
  console.error(`Subject path not found: ${workflow.relativeToTarget(subjectPath)}`);
  process.exit(1);
}

const manifest = readManifest(subjectPath);
if (!manifest) {
  console.error("Missing 00-workflow.yaml. Approval cannot be applied without a single workflow control file.");
  process.exit(1);
}

if (manifest.unresolved_questions !== "0" || manifest.blocking_issues !== "0") {
  console.error("Refusing to approve while unresolved_questions or blocking_issues is non-zero.");
  process.exit(1);
}

const approvedManifest = approveManifest(manifest);
const routeFailures = validateRouteDecision(approvedManifest);
if (routeFailures.length > 0) {
  console.error("Refusing to approve because the workflow route or risk boundary is not user-confirmable yet.");
  console.error("");
  for (const failure of routeFailures) {
    console.error(` - ${failure}`);
  }
  console.error("");
  console.error("Fix 00-workflow.yaml only: choose the user-confirmed mode/risk/runtime fields, or use Strict mode for objective hard risk blockers.");
  process.exit(1);
}

writeManifest(subjectPath, approvedManifest);

console.log(`Applied user approval to: ${workflow.relativeToTarget(subjectPath)}`);
console.log(`Document type: ${manifest.type}`);
console.log("Changed files: 00-workflow.yaml");
console.log("");
console.log("Next step: run the relevant gate.");
