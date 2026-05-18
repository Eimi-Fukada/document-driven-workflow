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

function blockerEntriesForFeature(manifest, completionResult) {
  const blockers = [];
  const approvalOk = ["approved", "inherited"].includes(manifest.approval);
  if (!approvalOk) {
    blockers.push({ type: "approval_blocker", detail: "Feature approval is not approved or inherited" });
  }
  if (manifest.readiness !== "ready") {
    blockers.push({ type: "doc_blocker", detail: "Feature readiness is not ready" });
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
  return blockers;
}

function nextActionForFeature({ manifest, blockers, completionResult, verificationResult }) {
  if (blockers.some((item) => item.type === "approval_blocker")) {
    return "用户审查文档后运行 workflow:approve / continue 写入一次批准";
  }
  if (blockers.some((item) => item.type === "doc_blocker")) {
    return "补全文档、解决未决问题，然后重新运行 Feature gate";
  }
  if (completionResult === "PASS" || ["verified", "released"].includes(manifest.status)) {
    return "可交给 Maestro 做跨项目集成状态汇总或发布排期";
  }
  if (verificationResult === "passed") {
    return "运行 completion-check 作为完成前门禁";
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
  const verificationResult = parseVerificationResult(subjectPath, manifest);
  const blockers = blockerEntriesForFeature(manifest, completionResult);
  const readyForImplementation =
    blockers.length === 0 &&
    ["ready", "in_progress"].includes(manifest.status) &&
    completionResult !== "PASS";
  const verified = completionResult === "PASS" || ["verified", "released"].includes(manifest.status);
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
    unresolved_questions: intValue(manifest.unresolved_questions),
    blocking_issues: intValue(manifest.blocking_issues),
    assumptions_accepted: String(manifest.assumptions_accepted) === "true",
    completion_result: completionResult,
    verification_result: verificationResult,
    ready_for_implementation: readyForImplementation,
    verified,
    blocked: blockers.length > 0,
    blockers,
    docs,
    next_action: nextActionForFeature({ manifest, blockers, completionResult, verificationResult }),
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

| Epic | Status | Approval | Readiness | Features | Next Action |
| --- | --- | --- | --- | --- | --- |
${epics
  .map((epic) => `| ${epic.id} | ${epic.status} | ${epic.approval} | ${epic.readiness} | ${epic.feature_count} | ${epic.next_action.replaceAll("|", "\\|")} |`)
  .join("\n") || "| none | - | - | - | - | - |"}

## Features

| Feature | Status | Approval | Readiness | Verification | Completion | Next Action |
| --- | --- | --- | --- | --- | --- | --- |
${features
  .map((feature) => `| ${feature.id} | ${feature.status} | ${feature.approval} | ${feature.readiness} | ${feature.verification_result} | ${feature.completion_result} | ${feature.next_action.replaceAll("|", "\\|")} |`)
  .join("\n") || "| none | - | - | - | - | - | - |"}
`;
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, report, "utf8");
  console.log(`Status report written: ${workflow.relativeToTarget(reportPath)}`);
  console.log(`Workflow status result: ${payload.delivery_state}`);
  console.log(`Ready Features: ${payload.summary.features_ready}`);
  console.log(`Blockers: ${payload.summary.blockers}`);
}
