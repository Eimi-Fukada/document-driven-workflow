import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { listDirs, readText, stripHtmlComments } from "../../shared/document-utils.mjs";
import { readManifest } from "../../shared/workflow-manifest.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const jsonOutput = args.includes("--json");
const outputArg = parseOption(args, "output", "", { startIndex: 0 });

function normalizeRel(input) {
  return input.replaceAll("\\", "/");
}

function readClean(filePath) {
  return stripHtmlComments(readText(filePath));
}

function intValue(value) {
  const parsed = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasFile(subjectPath, file) {
  return existsSync(path.join(subjectPath, file));
}

function subjectDirs(kind) {
  const root = path.join(workflow.targetRoot, "docs", kind);
  return listDirs(root)
    .map((subjectPath) => ({ subjectPath, manifest: readManifest(subjectPath) }))
    .filter((item) => item.manifest)
    .sort((a, b) => normalizeRel(a.subjectPath).localeCompare(normalizeRel(b.subjectPath)));
}

function parseCompletionResult(subjectPath) {
  const content = readClean(path.join(subjectPath, "COMPLETION_CHECK.md"));
  const match = /^-\s*Result:\s*(PASS|BLOCKED)\s*$/im.exec(content);
  return match ? match[1].toUpperCase() : "missing";
}

function parseCompletionProof(subjectPath) {
  const proofPath = path.join(subjectPath, "COMPLETION_PROOF.json");
  if (!existsSync(proofPath)) {
    return { result: "missing", path: proofPath };
  }
  try {
    const proof = JSON.parse(readClean(proofPath));
    return {
      result: proof.result === "PASS" ? "PASS" : "BLOCKED",
      path: proofPath,
      generated_at: proof.generated_at || "unknown",
    };
  } catch {
    return { result: "invalid", path: proofPath };
  }
}

function parseVerificationResult(subjectPath, manifest) {
  const reportFile = manifest.mode === "light" ? "01-light-feature.md" : "07-verification-report.md";
  const content = readClean(path.join(subjectPath, reportFile));
  if (!content.trim()) {
    return "missing";
  }
  if (/^- Result:\s*Passed\s*$/im.test(content) || /^Ready to release:\s*yes\s*$/im.test(content)) {
    return "passed";
  }
  if (/^- Result:\s*Failed\s*$/im.test(content) || /Ready to release:\s*no\s*$/im.test(content)) {
    return "failed";
  }
  if (/Not Tested/i.test(content)) {
    return "not_tested";
  }
  return "partial";
}

function blockerEntriesForFeature(manifest, completionResult, completionProof) {
  const blockers = [];
  const approvalOk = ["approved", "inherited"].includes(manifest.approval);
  if (!approvalOk) {
    blockers.push({ type: "approval_blocker", detail: "Feature approval is not approved or inherited" });
  }
  if (manifest.readiness !== "ready") {
    blockers.push({ type: "doc_blocker", detail: "Feature readiness is not ready" });
  }
  if (manifest.route_decision !== "user_confirmed") {
    blockers.push({ type: "route_blocker", detail: "Feature route/risk decision is not user_confirmed" });
  }
  if (!["low", "medium", "high"].includes(String(manifest.risk_level || ""))) {
    blockers.push({ type: "route_blocker", detail: "Feature risk_level is not low, medium, or high" });
  }
  const hardRiskBlockers = String(manifest.hard_risk_blockers || "none")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item && item !== "none");
  if (hardRiskBlockers.length > 0 && manifest.mode !== "strict") {
    blockers.push({ type: "route_blocker", detail: "Objective hard risk blockers require strict mode" });
  }
  if (intValue(manifest.unresolved_questions) > 0) {
    blockers.push({ type: "doc_blocker", detail: `${manifest.unresolved_questions} unresolved question(s)` });
  }
  if (intValue(manifest.blocking_issues) > 0) {
    blockers.push({ type: "doc_blocker", detail: `${manifest.blocking_issues} blocking issue(s)` });
  }
  if (completionResult === "BLOCKED") {
    blockers.push({ type: "verification_blocker", detail: "Completion check is blocked" });
  }
  if (["verified", "released"].includes(manifest.status) && completionProof.result !== "PASS") {
    blockers.push({
      type: "verification_blocker",
      detail: "Manifest status is verified/released but finish-feature completion proof is missing",
    });
  }
  return blockers;
}

function nextActionForFeature({ manifest, blockers, completionResult, completionProof, verificationResult }) {
  if (blockers.some((item) => item.type === "approval_blocker")) {
    return "用户审查文档后运行 workflow:approve / continue 写入一次批准";
  }
  if (blockers.some((item) => item.type === "route_blocker")) {
    return "用户确认或调整 00-workflow.yaml 中的模式、风险、客观硬风险和分批字段";
  }
  if (blockers.some((item) => item.type === "doc_blocker")) {
    return "补全文档、解决未决问题，然后重新运行 Feature gate";
  }
  if (completionProof.result === "PASS") {
    return "可交给 Maestro 做跨项目集成状态汇总或发布排期";
  }
  if (["verified", "released"].includes(manifest.status)) {
    return "重新运行 finish-feature；没有 COMPLETION_PROOF.json 的 PASS 证据时不能视为完成";
  }
  if (verificationResult === "passed") {
    return "运行 finish-feature 作为唯一完成出口";
  }
  if (manifest.status === "ready") {
    return "运行 Feature gate，通过后交给 Codex 实现";
  }
  if (manifest.status === "in_progress") {
    return "继续实现并更新验证报告";
  }
  return "根据文档状态继续推进";
}

function summarizeFeature(subjectPath, manifest) {
  const completionResult = parseCompletionResult(subjectPath);
  const completionProof = parseCompletionProof(subjectPath);
  const verificationResult = parseVerificationResult(subjectPath, manifest);
  const blockers = blockerEntriesForFeature(manifest, completionResult, completionProof);
  const readyForImplementation =
    blockers.length === 0 &&
    ["ready", "in_progress"].includes(manifest.status) &&
    completionProof.result !== "PASS";
  const verified = completionProof.result === "PASS";
  const manifestVerifiedWithoutProof = ["verified", "released"].includes(manifest.status) && completionProof.result !== "PASS";
  const docs = {
    intake_review: hasFile(subjectPath, "00-intake-review.md"),
    light_feature: hasFile(subjectPath, "01-light-feature.md"),
    prd: hasFile(subjectPath, "01-prd.md"),
    acceptance: hasFile(subjectPath, "04-acceptance-criteria.md"),
    implementation_plan: hasFile(subjectPath, "06-implementation-plan.md"),
    verification_report: hasFile(subjectPath, manifest.mode === "light" ? "01-light-feature.md" : "07-verification-report.md"),
    context_pack: hasFile(subjectPath, "08-context-pack.md"),
    completion_check: hasFile(subjectPath, "COMPLETION_CHECK.md"),
    handoff_pack: hasFile(subjectPath, "HANDOFF_PACK.md"),
  };

  return {
    path: workflow.relativeToTarget(subjectPath),
    id: manifest.id || path.basename(subjectPath),
    type: manifest.type || "feature",
    mode: manifest.mode || "standard",
    approval: manifest.approval || "pending",
    readiness: manifest.readiness || "not_ready",
    status: manifest.status || "draft",
    stack_preset: manifest.stack_preset || "next-fullstack",
    epic_id: manifest.epic_id || "none",
    route_decision: manifest.route_decision || "ai_draft",
    risk_level: manifest.risk_level || "unset",
    hard_risk_blockers: manifest.hard_risk_blockers || "none",
    expected_runtime: manifest.expected_runtime || "unset",
    execution_slicing: manifest.execution_slicing || "not_required",
    unresolved_questions: intValue(manifest.unresolved_questions),
    blocking_issues: intValue(manifest.blocking_issues),
    assumptions_accepted: String(manifest.assumptions_accepted) === "true",
    completion_result: completionResult,
    verification_result: verificationResult,
    completion_proof_result: completionProof.result,
    completion_proof_path: existsSync(completionProof.path) ? workflow.relativeToTarget(completionProof.path) : "missing",
    ready_for_implementation: readyForImplementation,
    verified,
    manifest_verified_without_proof: manifestVerifiedWithoutProof,
    blocked: blockers.length > 0,
    blockers,
    docs,
    next_action: nextActionForFeature({ manifest, blockers, completionResult, completionProof, verificationResult }),
  };
}

function summarizeEpic(subjectPath, manifest, features) {
  const blockers = [];
  if (manifest.approval !== "approved") {
    blockers.push({ type: "approval_blocker", detail: "Epic approval is not approved" });
  }
  if (manifest.readiness !== "ready") {
    blockers.push({ type: "doc_blocker", detail: "Epic readiness is not ready" });
  }
  if (manifest.route_decision !== "user_confirmed") {
    blockers.push({ type: "route_blocker", detail: "Epic route/risk decision is not user_confirmed" });
  }
  if (intValue(manifest.unresolved_questions) > 0) {
    blockers.push({ type: "doc_blocker", detail: `${manifest.unresolved_questions} unresolved question(s)` });
  }
  if (intValue(manifest.blocking_issues) > 0) {
    blockers.push({ type: "doc_blocker", detail: `${manifest.blocking_issues} blocking issue(s)` });
  }
  const id = manifest.id || path.basename(subjectPath);
  const linkedFeatures = features.filter((feature) => feature.epic_id === id);
  return {
    path: workflow.relativeToTarget(subjectPath),
    id,
    type: manifest.type || "epic",
    approval: manifest.approval || "pending",
    readiness: manifest.readiness || "not_ready",
    status: manifest.status || "draft",
    route_decision: manifest.route_decision || "ai_draft",
    risk_level: manifest.risk_level || "unset",
    expected_runtime: manifest.expected_runtime || "unset",
    execution_slicing: manifest.execution_slicing || "required",
    unresolved_questions: intValue(manifest.unresolved_questions),
    blocking_issues: intValue(manifest.blocking_issues),
    feature_count: linkedFeatures.length,
    linked_features: linkedFeatures.map((feature) => feature.id),
    ready_for_breakdown: blockers.length === 0 && ["ready", "in_progress"].includes(manifest.status),
    blocked: blockers.length > 0,
    blockers,
    next_action: blockers.length
      ? "补全 Epic 文档并由用户批准后再拆分 Feature"
      : linkedFeatures.length
        ? "跟踪 Feature 交付状态"
        : "可拆分 Feature 或生成 agent plan",
  };
}

if (!existsSync(workflow.targetRoot)) {
  const payload = {
    schema_version: "1",
    kind: "workflow_status",
    generated_at: new Date().toISOString(),
    target_root: workflow.targetRoot,
    result: "BLOCKED",
    blockers: [{ type: "environment_blocker", detail: "target root does not exist" }],
  };
  console.log(JSON.stringify(payload, null, 2));
  process.exit(1);
}

const features = subjectDirs("features").map((item) => summarizeFeature(item.subjectPath, item.manifest));
const epics = subjectDirs("epics").map((item) => summarizeEpic(item.subjectPath, item.manifest, features));
const featureBlockers = features.flatMap((feature) =>
  feature.blockers.map((blocker) => ({ ...blocker, subject: feature.path })),
);
const epicBlockers = epics.flatMap((epic) => epic.blockers.map((blocker) => ({ ...blocker, subject: epic.path })));
const blockers = [...epicBlockers, ...featureBlockers];
const payload = {
  schema_version: "1",
  kind: "workflow_status",
  generated_at: new Date().toISOString(),
  target_root: workflow.targetRoot,
  result: "PASS",
  delivery_state: blockers.length ? "HAS_BLOCKERS" : "CLEAR",
  summary: {
    epics_total: epics.length,
    features_total: features.length,
    features_ready: features.filter((feature) => feature.ready_for_implementation).length,
    features_verified: features.filter((feature) => feature.verified).length,
    features_blocked: features.filter((feature) => feature.blocked).length,
    features_pending_approval: features.filter((feature) => !["approved", "inherited"].includes(feature.approval)).length,
    blockers: blockers.length,
  },
  blockers,
  epics,
  features,
};

if (jsonOutput) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  const reportPath = outputArg
    ? workflow.resolveTarget(outputArg)
    : path.join(workflow.targetRoot, "docs", "workflow", "STATUS_REPORT.md");
  const report = `# Workflow Status Report

- Generated at: ${payload.generated_at}
- Target project: ${workflow.targetRoot}
- Result: ${payload.result}
- Delivery State: ${payload.delivery_state}

## Summary

- Epics: ${payload.summary.epics_total}
- Features: ${payload.summary.features_total}
- Ready Features: ${payload.summary.features_ready}
- Verified Features: ${payload.summary.features_verified}
- Blocked Features: ${payload.summary.features_blocked}
- Pending Approval Features: ${payload.summary.features_pending_approval}
- Blockers: ${payload.summary.blockers}

## Epics

| Epic | Status | Approval | Readiness | Route | Risk | Features | Next Action |
| --- | --- | --- | --- | --- | --- | --- | --- |
${epics
  .map((epic) => `| ${epic.id} | ${epic.status} | ${epic.approval} | ${epic.readiness} | ${epic.route_decision} | ${epic.risk_level} | ${epic.feature_count} | ${epic.next_action.replaceAll("|", "\\|")} |`)
  .join("\n") || "| none | - | - | - | - | - | - | - |"}

## Features

| Feature | Status | Approval | Readiness | Route | Risk | Runtime | Slicing | Verification | Completion | Finish Proof | Next Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${features
  .map((feature) => `| ${feature.id} | ${feature.status} | ${feature.approval} | ${feature.readiness} | ${feature.route_decision} | ${feature.risk_level} | ${feature.expected_runtime} | ${feature.execution_slicing} | ${feature.verification_result} | ${feature.completion_result} | ${feature.completion_proof_result} | ${feature.next_action.replaceAll("|", "\\|")} |`)
  .join("\n") || "| none | - | - | - | - | - | - | - | - | - | - | - |"}
`;
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, report, "utf8");
  console.log(`Status report written: ${workflow.relativeToTarget(reportPath)}`);
  console.log(`Workflow status result: ${payload.delivery_state}`);
  console.log(`Ready Features: ${payload.summary.features_ready}`);
  console.log(`Blockers: ${payload.summary.blockers}`);
}
