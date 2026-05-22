import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { createHash } from "crypto";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { readManifest, writeManifest } from "../../shared/workflow-manifest.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const subjectArg = parseOption(args, "subject", args[0] || "", { startIndex: 0 });
const baseArg = parseOption(args, "base", "", { startIndex: 0 });
const changedFilesArg = parseOption(args, "changed-files", "", { startIndex: 0 });
const extraCommand = parseOption(args, "command", "", { startIndex: 0 });
const skipVerify = args.includes("--skip-verify");
const jsonOutput = args.includes("--json");

if (!subjectArg) {
  console.error("Missing Feature path.");
  console.error(
    "Usage: node scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root> [--base <git-ref>|--changed-files <files>] [--command \"npm test\"] [--skip-verify] [--json]",
  );
  process.exit(1);
}

const subjectPath = workflow.resolveTarget(subjectArg);
if (!existsSync(subjectPath)) {
  console.error(`Feature path not found: ${workflow.relativeToTarget(subjectPath)}`);
  process.exit(1);
}

const manifest = readManifest(subjectPath);
if (!manifest || manifest.type !== "feature") {
  console.error("finish-feature only supports Feature subjects with 00-workflow.yaml.");
  process.exit(1);
}

function runNode(scriptRelativePath, scriptArgs) {
  const scriptPath = path.join(workflow.packageRoot, scriptRelativePath);
  return spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    cwd: workflow.targetRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
}

function commandRecord(name, result) {
  return {
    name,
    exit_code: result.status ?? 1,
    stdout: (result.stdout || "").slice(0, 4000),
    stderr: (result.stderr || result.error?.message || "").slice(0, 4000),
  };
}

function fail(message, commands = []) {
  const payload = {
    schema_version: "1",
    kind: "workflow_finish_feature",
    generated_at: new Date().toISOString(),
    target_root: workflow.targetRoot,
    subject: workflow.relativeToTarget(subjectPath),
    feature: {
      id: manifest.id || path.basename(subjectPath),
      mode: manifest.mode || "standard",
      status: manifest.status || "draft",
    },
    result: "BLOCKED",
    detail: message,
    commands,
  };

  if (jsonOutput) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.error(message);
    for (const command of commands) {
      console.error(` - ${command.name}: exit ${command.exit_code}`);
    }
  }
  process.exit(1);
}

function hashFile(relativeFile) {
  const filePath = path.join(subjectPath, relativeFile);
  if (!existsSync(filePath)) {
    return null;
  }
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

const commandResults = [];

const gate = runNode("scripts/workflow/feature/gate-feature.mjs", [subjectArg, "--target", workflow.targetRoot]);
commandResults.push(commandRecord("feature-gate", gate));
if (gate.status !== 0) {
  fail("Feature gate failed. finish-feature cannot continue.", commandResults);
}

if (!skipVerify) {
  const verifyArgs = [subjectArg, "--target", workflow.targetRoot];
  if (extraCommand) {
    verifyArgs.push("--command", extraCommand);
  }
  const verify = runNode("scripts/workflow/automation/verify.mjs", verifyArgs);
  commandResults.push(commandRecord("verify", verify));
  if (verify.status !== 0) {
    fail("Verification failed. Fix verification evidence before finishing the Feature.", commandResults);
  }
}

const completionArgs = [subjectArg, "--target", workflow.targetRoot, "--json"];
if (baseArg) {
  completionArgs.push("--base", baseArg);
}
if (changedFilesArg) {
  completionArgs.push("--changed-files", changedFilesArg);
}
const completion = runNode("scripts/workflow/automation/completion-check.mjs", completionArgs);
commandResults.push(commandRecord("completion-check", completion));
if (completion.status !== 0) {
  fail("Completion check failed. The Feature is not finished.", commandResults);
}

let completionPayload;
try {
  completionPayload = JSON.parse(completion.stdout);
} catch {
  fail("Completion check did not return valid JSON. The Feature is not finished.", commandResults);
}

if (completionPayload.result !== "PASS") {
  fail("Completion check result is not PASS. The Feature is not finished.", commandResults);
}

const proofPath = path.join(subjectPath, "COMPLETION_PROOF.json");
const proof = {
  schema_version: "1",
  kind: "workflow_completion_proof",
  generated_at: new Date().toISOString(),
  target_root: workflow.targetRoot,
  subject: workflow.relativeToTarget(subjectPath),
  feature: completionPayload.feature,
  result: "PASS",
  source: {
    base: baseArg || "git working tree",
    changed_files_arg: changedFilesArg || "none",
    skip_verify: skipVerify,
  },
  hashes: {
    workflow_manifest: hashFile("00-workflow.yaml"),
    prd: hashFile("01-prd.md"),
    acceptance: hashFile("04-acceptance-criteria.md"),
    implementation_plan: hashFile("06-implementation-plan.md"),
    verification_report: hashFile(manifest.mode === "light" ? "01-light-feature.md" : "07-verification-report.md"),
    context_pack: hashFile("08-context-pack.md"),
    completion_check: hashFile("COMPLETION_CHECK.md"),
  },
  checks: completionPayload.checks,
  changed_files: completionPayload.changed_files,
  command_results: commandResults,
  completion_report_path: completionPayload.completion_report_path,
  verification_report_path: completionPayload.verification_report_path,
};

mkdirSync(path.dirname(proofPath), { recursive: true });
writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
writeManifest(subjectPath, {
  ...manifest,
  status: "verified",
});

const payload = {
  schema_version: "1",
  kind: "workflow_finish_feature",
  generated_at: proof.generated_at,
  target_root: workflow.targetRoot,
  subject: workflow.relativeToTarget(subjectPath),
  feature: proof.feature,
  result: "PASS",
  completion_proof_path: proofPath,
  completion_report_path: proof.completion_report_path,
  verification_report_path: proof.verification_report_path,
  changed_files: proof.changed_files,
  commands: commandResults,
};

if (jsonOutput) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(`Feature finished: ${payload.subject}`);
  console.log(`Completion proof written: ${workflow.relativeToTarget(proofPath)}`);
  console.log("Finish result: PASS");
}
