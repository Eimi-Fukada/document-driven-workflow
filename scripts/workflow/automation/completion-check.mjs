import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { printJsonForCli, readText, stripHtmlComments } from "../../shared/document-utils.mjs";
import { readManifest } from "../../shared/workflow-manifest.mjs";
import { evaluateCoverageMatrix } from "../../shared/coverage-matrix.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const subjectArg = parseOption(args, "subject", args[0] || "", { startIndex: 0 });
const baseArg = parseOption(args, "base", "", { startIndex: 0 });
const changedFilesArg = parseOption(args, "changed-files", "", { startIndex: 0 });
const skipGate = args.includes("--skip-gate");
const jsonOutput = args.includes("--json");

if (!subjectArg) {
  console.error("Missing Feature path.");
  console.error("Usage: node scripts/workflow/automation/completion-check.mjs docs/features/<feature-id> --target <project-root> [--base <git-ref>]");
  process.exit(1);
}

const subjectPath = workflow.resolveTarget(subjectArg);
if (!existsSync(subjectPath)) {
  console.error(`Feature path not found: ${workflow.relativeToTarget(subjectPath)}`);
  process.exit(1);
}

const manifest = readManifest(subjectPath);
if (!manifest || manifest.type !== "feature") {
  console.error("Completion check only supports Feature subjects with 00-workflow.yaml.");
  process.exit(1);
}

const failures = [];
const warnings = [];
const rows = [];

function classifyRow(check) {
  if (/Approved Feature/i.test(check)) {
    return "approval_blocker";
  }
  if (/Git diff available/i.test(check)) {
    return "environment_blocker";
  }
  if (/Requirement IDs|Feature gate/i.test(check)) {
    return "doc_blocker";
  }
  if (/Coverage.*(declared|expected|source|duplicate)/i.test(check)) {
    return "doc_blocker";
  }
  if (/Coverage/i.test(check)) {
    return "verification_blocker";
  }
  if (/Forbidden scope|Allowed scope/i.test(check)) {
    return "implementation_blocker";
  }
  if (/Changed files|1000-line guardrail/i.test(check)) {
    return "implementation_blocker";
  }
  if (/Performance|Option decision|Closure risk/i.test(check)) {
    return "verification_blocker";
  }
  if (/evidence|verification|Completion result|Self review|Traceability/i.test(check)) {
    return "verification_blocker";
  }
  return "verification_blocker";
}

function addRow(check, status, detail, blockerType = classifyRow(check)) {
  const row = { check, status, detail, blocker_type: blockerType };
  rows.push(row);
  if (status === "BLOCKED") {
    failures.push(row);
  } else if (status === "WARN") {
    warnings.push(row);
  }
}

function normalizeFile(input) {
  return input.trim().replaceAll("\\", "/").replace(/^\.\/+/, "");
}

function readIfExists(file) {
  return stripHtmlComments(readText(path.join(subjectPath, file)));
}

function collectIds(pattern, ...texts) {
  const ids = new Set();
  for (const text of texts) {
    for (const match of text.matchAll(pattern)) {
      ids.add(match[0]);
    }
  }
  return [...ids].sort();
}

function runNode(scriptRelativePath, scriptArgs) {
  const scriptPath = path.join(workflow.packageRoot, scriptRelativePath);
  return spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    cwd: workflow.targetRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
}

function runGit(gitArgs) {
  const result = spawnSync("git", ["-C", workflow.targetRoot, ...gitArgs], {
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    return { ok: false, output: `${result.stderr || result.stdout || ""}`.trim() };
  }
  return { ok: true, output: result.stdout.trim() };
}

function collectChangedFiles() {
  if (changedFilesArg) {
    return changedFilesArg
      .split(",")
      .map(normalizeFile)
      .filter(Boolean);
  }

  const insideGit = runGit(["rev-parse", "--is-inside-work-tree"]);
  if (!insideGit.ok || insideGit.output !== "true") {
    addRow("Git diff available", "BLOCKED", "target project is not a git repository; pass --changed-files for a deterministic check");
    return [];
  }

  if (baseArg) {
    const diff = runGit(["diff", "--name-only", "--diff-filter=ACMRTUXB", baseArg, "--"]);
    if (!diff.ok) {
      addRow("Git diff available", "BLOCKED", `git diff failed for base '${baseArg}': ${diff.output}`);
      return [];
    }
    return diff.output.split(/\r?\n/).map(normalizeFile).filter(Boolean);
  }

  const unstaged = runGit(["diff", "--name-only", "--diff-filter=ACMRTUXB", "--"]);
  const staged = runGit(["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB", "--"]);
  if (!unstaged.ok || !staged.ok) {
    addRow("Git diff available", "BLOCKED", "git diff failed; pass --base or --changed-files");
    return [];
  }
  return [...new Set(`${unstaged.output}\n${staged.output}`.split(/\r?\n/).map(normalizeFile).filter(Boolean))].sort();
}

function extractPathTokens(text) {
  const tokens = new Set();
  const cleaned = text.replace(/`/g, " ");
  for (const match of cleaned.matchAll(/[A-Za-z0-9_.@/-]+(?:\.[A-Za-z0-9]+|\/[A-Za-z0-9_.@/-]*)/g)) {
    const token = normalizeFile(match[0]);
    if (!token || ["none", "n/a", "not-applicable"].includes(token.toLowerCase())) {
      continue;
    }
    if (token.includes("docs/features/<") || token.includes("docs/epics/<")) {
      continue;
    }
    tokens.add(token.replace(/\/+$/, ""));
  }
  return [...tokens].sort();
}

function section(pattern, text) {
  return pattern.exec(text)?.[1]?.trim() || "";
}

function fileMatchesToken(file, token) {
  const normalizedToken = normalizeFile(token);
  return file === normalizedToken || file.startsWith(`${normalizedToken}/`) || file.includes(normalizedToken);
}

function isCurrentFeatureDoc(file) {
  return file.startsWith(normalizeFile(subjectArg).replace(/\/+$/, "") + "/");
}

function isCodeLike(file) {
  return /\.(js|jsx|ts|tsx|mjs|cjs|dart|py|css|scss|sass|html|vue|svelte)$/.test(file);
}

function hasPerformanceKeywords(...texts) {
  const combined = texts.join("\n");
  return /(large table|subquery|aggregate|pagination|cursor|index|cache|queue|batch|concurrency|N\+1|long list|virtual scroll|infinite scroll|polling|large file|upload|download|audio|video|canvas|大表|子查询|聚合|分页|索引|缓存|队列|批处理|并发|长列表|虚拟滚动|无限滚动|轮询|大文件|上传|下载|音频|视频)/i.test(combined);
}

function hasExplicitPerformanceRisk(...texts) {
  const combined = texts.join("\n");
  return /Performance risk:\s*yes/i.test(combined);
}

function hasClosureKeywords(...texts) {
  const combined = texts.join("\n");
  return /(missing loop|downstream|side effect|not closed|closure gap|闭环|入口|出口|状态流转|异常处理|回滚|日志|影响其他模块)/i.test(combined);
}

function hasExplicitClosureRisk(...texts) {
  const combined = texts.join("\n");
  return /(Closure risk:\s*yes|User warning:\s*(?!\s*(-|none|no|not-applicable)\s*$).+|Missing product loop:\s*(?!\s*(-|none|no|not-applicable)\s*$).+|Missing technical loop:\s*(?!\s*(-|none|no|not-applicable)\s*$).+|Downstream impact:\s*(?!\s*(-|none|no|not-applicable)\s*$).+)/im.test(combined);
}

function hasOptionDecisionRequired(...texts) {
  const combined = texts.join("\n");
  return /(Multiple implementation options:\s*yes|User decision required:\s*yes|User decision recorded:\s*yes|ADR required:\s*yes)/i.test(combined);
}

function countLines(file) {
  const full = workflow.resolveTarget(file);
  if (!existsSync(full)) {
    return 0;
  }
  return readFileSync(full, "utf8").split(/\r?\n/).length;
}

if (!["approved", "inherited"].includes(manifest.approval) || manifest.readiness !== "ready") {
  addRow("Approved Feature", "BLOCKED", "Feature must be approved and ready before completion check");
} else {
  addRow("Approved Feature", "PASS", "Feature approval and readiness are valid");
}

if (!skipGate) {
  const gate = runNode("scripts/workflow/feature/gate-feature.mjs", [subjectArg, "--target", workflow.targetRoot]);
  if (gate.status !== 0) {
    addRow("Feature gate still passes", "BLOCKED", "Feature gate failed after implementation; fix documents or approval state before completion");
  } else {
    addRow("Feature gate still passes", "PASS", "Feature gate passed");
  }
} else {
  addRow("Feature gate still passes", "WARN", "skipped by --skip-gate");
}

const light = manifest.mode === "light";
const prd = light ? readIfExists("01-light-feature.md") : readIfExists("01-prd.md");
const acceptance = light ? readIfExists("01-light-feature.md") : readIfExists("04-acceptance-criteria.md");
const plan = light ? readIfExists("01-light-feature.md") : readIfExists("06-implementation-plan.md");
const context = light ? readIfExists("01-light-feature.md") : readIfExists("08-context-pack.md");
const technical = light ? readIfExists("01-light-feature.md") : readIfExists("03-technical-contract.md");
const readiness = light ? readIfExists("01-light-feature.md") : readIfExists("05-readiness-review.md");
const reportFile = light ? "01-light-feature.md" : "07-verification-report.md";
const report = readIfExists(reportFile);
const requirementIds = collectIds(/\bREQ-[A-Z0-9-]+\b/g, prd, acceptance, plan, context);
const acceptanceIds = collectIds(/\bAC-[A-Z0-9-]+\b/g, acceptance, plan, context);

if (requirementIds.length === 0) {
  addRow("Requirement IDs", "BLOCKED", "no REQ-* IDs found in Feature documents");
} else {
  addRow("Requirement IDs", "PASS", `${requirementIds.length} requirement ID(s) found`);
}

const missingReqEvidence = requirementIds.filter((id) => !report.includes(id));
const missingAcEvidence = acceptanceIds.filter((id) => !report.includes(id));
if (missingReqEvidence.length) {
  addRow("Requirement evidence", "BLOCKED", `verification report does not mention: ${missingReqEvidence.join(", ")}`);
} else {
  addRow("Requirement evidence", "PASS", "all requirement IDs are mentioned in verification evidence");
}
if (missingAcEvidence.length) {
  addRow("Acceptance evidence", "BLOCKED", `verification report does not mention: ${missingAcEvidence.join(", ")}`);
} else {
  addRow("Acceptance evidence", "PASS", "all acceptance IDs are mentioned in verification evidence");
}

const coverageResult = evaluateCoverageMatrix({
  acceptanceText: acceptance,
  reportText: report,
  requirementIds,
  acceptanceIds,
});
for (const check of coverageResult.checks) {
  addRow(check.check, check.status, check.detail, check.blocker_type);
}

const commandBlock = /## Commands Run[\s\S]*?```(?:bash|text)?\s*([\s\S]*?)```/i.exec(report)?.[1]?.trim() || "";
const hasVerificationRun = /Automated Verification Run/i.test(report) || commandBlock.length > 0 || /Manual Verification/i.test(report);
addRow(
  "Fresh verification evidence",
  hasVerificationRun ? "PASS" : "BLOCKED",
  hasVerificationRun ? "verification command or manual evidence found" : "verification report must include fresh command output or manual verification evidence",
);

if (/Not Tested/.test(report)) {
  addRow("No untested placeholders", "BLOCKED", "verification report still contains 'Not Tested'");
} else {
  addRow("No untested placeholders", "PASS", "no 'Not Tested' placeholder remains");
}

if (!/^- Result:\s*Passed\s*$/im.test(report) && !/^Ready to release:\s*yes\s*$/im.test(report)) {
  addRow("Completion result", "BLOCKED", "verification report must state '- Result: Passed' or 'Ready to release: yes'");
} else {
  addRow("Completion result", "PASS", "completion result is positive");
}

const requiredSelfReview = [
  "Requirement coverage checked",
  "Acceptance coverage checked",
  "Changed files mapped to requirements",
  "No unrelated refactor",
  "Maintainability guardrails checked",
  "Fresh verification evidence recorded",
];
for (const label of requiredSelfReview) {
  const ok = new RegExp(`^-\\s*${label}:\\s*yes\\s*$`, "im").test(report);
  addRow(`Self review: ${label}`, ok ? "PASS" : "BLOCKED", ok ? "checked" : `${label} must be yes in ${reportFile}`);
}

const performanceRequired = hasPerformanceKeywords(prd, acceptance) || hasExplicitPerformanceRisk(technical, readiness, plan, context);
if (performanceRequired) {
  const performanceRecorded = /## Performance Review/i.test(report) && /Performance risk:\s*yes/i.test(report);
  const performanceEvidence = /Verification evidence:\s*(?!\s*(-|none|no|not-applicable)\s*$).+/im.test(report);
  addRow(
    "Performance evidence",
    performanceRecorded && performanceEvidence ? "PASS" : "BLOCKED",
    performanceRecorded && performanceEvidence
      ? "performance risk and verification evidence are recorded"
      : "performance risk is triggered; verification report must include Performance Review with concrete verification evidence",
  );
} else {
  const performanceMarked = /Performance risk handled or marked not-applicable:\s*yes/im.test(report) || /Performance risk:\s*(no|not-applicable)/i.test(report);
  addRow(
    "Performance evidence",
    performanceMarked ? "PASS" : "WARN",
    performanceMarked ? "performance risk marked as handled or not-applicable" : "performance risk was not triggered, but report should mark it handled or not-applicable",
  );
}

const closureRequired = hasClosureKeywords(prd, acceptance) || hasExplicitClosureRisk(technical, readiness, plan, context);
if (closureRequired) {
  const closureReviewed = /Closure risk reviewed:\s*yes/im.test(report);
  const closureHandled = /User warning handled:\s*(yes|not-applicable)/im.test(report);
  addRow(
    "Closure risk review",
    closureReviewed && closureHandled ? "PASS" : "BLOCKED",
    closureReviewed && closureHandled
      ? "closure risk was reviewed and user warning handling is recorded"
      : "closure risk is triggered; verification report must record closure review and user warning handling",
  );
} else {
  addRow(
    "Closure risk review",
    /Closure risk reviewed:\s*yes/im.test(report) ? "PASS" : "WARN",
    /Closure risk reviewed:\s*yes/im.test(report) ? "closure risk reviewed" : "closure risk was not triggered, but self review should mark it reviewed",
  );
}

const optionRequired = hasOptionDecisionRequired(readiness, plan, context);
if (optionRequired) {
  const optionRecorded = /Option decision recorded when needed:\s*yes/im.test(report) || /Selected option implemented:\s*(yes|not-applicable)/im.test(report);
  addRow(
    "Option decision evidence",
    optionRecorded ? "PASS" : "BLOCKED",
    optionRecorded ? "option decision evidence is recorded" : "implementation options were present; verification report must record selected option evidence",
  );
}

const traceabilityLine = /^-\s*Updated `?docs\/product\/traceability\.md`?:\s*(yes|not-applicable)\s*$/im.test(report);
addRow(
  "Traceability update",
  traceabilityLine ? "PASS" : "BLOCKED",
  traceabilityLine ? "traceability update is recorded" : "record docs/product/traceability.md as yes or not-applicable",
);

const changedFiles = collectChangedFiles();
const relevantChangedFiles = changedFiles.filter((file) => file !== normalizeFile(path.join(subjectArg, "COMPLETION_CHECK.md")));
if (relevantChangedFiles.length === 0) {
  addRow("Changed files", "BLOCKED", "no changed files detected; pass --base or --changed-files if changes are already committed");
} else {
  addRow("Changed files", "PASS", `${relevantChangedFiles.length} changed file(s) detected`);
}

const changedOutsideFeatureDocs = relevantChangedFiles.filter((file) => !isCurrentFeatureDoc(file));
const missingChangedFileMap = changedOutsideFeatureDocs.filter((file) => !report.includes(file));
if (missingChangedFileMap.length) {
  addRow("Changed file mapping", "BLOCKED", `verification report changed-file table does not list: ${missingChangedFileMap.join(", ")}`);
} else {
  addRow("Changed file mapping", "PASS", "changed files outside the Feature docs are mapped in the verification report");
}

const forbiddenText = [
  section(/Forbidden files \/ modules:\s*([\s\S]*?)(?:\n-|$)/i, plan),
  section(/## Forbidden Scope\s*([\s\S]*?)(?:\n##|$)/i, context),
  section(/Forbidden changes:\s*([\s\S]*?)(?:\n##|$)/i, plan),
].join("\n");
const allowedText = [
  section(/Allowed files \/ modules:\s*([\s\S]*?)(?:\n-|$)/i, plan),
  section(/## Allowed Scope\s*([\s\S]*?)(?:\n##|$)/i, context),
  section(/## Code Entry Points\s*([\s\S]*?)(?:\n##|$)/i, context),
].join("\n");
const forbiddenTokens = extractPathTokens(forbiddenText);
const allowedTokens = extractPathTokens(allowedText);
const forbiddenHits = changedOutsideFeatureDocs.filter((file) => forbiddenTokens.some((token) => fileMatchesToken(file, token)));
if (forbiddenHits.length) {
  addRow("Forbidden scope untouched", "BLOCKED", `changed files match forbidden scope: ${forbiddenHits.join(", ")}`);
} else {
  addRow("Forbidden scope untouched", "PASS", "no changed file matched explicit forbidden path scope");
}

const codeFiles = changedOutsideFeatureDocs.filter(isCodeLike);
if (allowedTokens.length) {
  const outsideAllowed = codeFiles.filter((file) => !allowedTokens.some((token) => fileMatchesToken(file, token)));
  addRow(
    "Allowed scope followed",
    outsideAllowed.length ? "BLOCKED" : "PASS",
    outsideAllowed.length ? `code files outside explicit allowed scope: ${outsideAllowed.join(", ")}` : "code files match explicit allowed scope",
  );
} else {
  addRow("Allowed scope followed", "WARN", "allowed file/module scope is not machine-checkable; rely on self-review and changed-file mapping");
}

const overLimit = codeFiles
  .map((file) => ({ file, lines: countLines(file) }))
  .filter((item) => item.lines > 1000);
const unreportedOverLimit = overLimit.filter((item) => !report.includes(item.file));
addRow(
  "1000-line guardrail",
  unreportedOverLimit.length ? "BLOCKED" : "PASS",
  unreportedOverLimit.length
    ? `files over 1000 lines need an extraction note: ${unreportedOverLimit.map((item) => `${item.file} (${item.lines})`).join(", ")}`
    : overLimit.length
      ? "over-limit files are documented in the verification report"
      : "no changed code file is over 1000 lines",
);

const outputPath = path.join(subjectPath, "COMPLETION_CHECK.md");
const completionReport = `# Completion Check

- Feature: ${workflow.relativeToTarget(subjectPath)}
- Generated at: ${new Date().toISOString()}
- Result: ${failures.length ? "BLOCKED" : "PASS"}
- Changed files source: ${changedFilesArg ? "--changed-files" : baseArg ? `git diff ${baseArg}` : "git working tree"}

## Checks

| Check | Status | Blocker Type | Detail |
| --- | --- | --- | --- |
${rows.map((row) => `| ${row.check} | ${row.status} | ${row.blocker_type} | ${row.detail.replaceAll("|", "\\|")} |`).join("\n")}

## Changed Files

${relevantChangedFiles.length ? relevantChangedFiles.map((file) => `- ${file}`).join("\n") : "- none"}

## Next Step

${
  failures.length
    ? "Fix the blocked items, rerun verification if needed, then rerun completion-check."
    : "The Feature may be reported as completed with the verification report and this completion check as evidence."
}
`;

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, completionReport, "utf8");

const payload = {
  schema_version: "1",
  kind: "workflow_completion_check",
  generated_at: new Date().toISOString(),
  target_root: workflow.targetRoot,
  subject: workflow.relativeToTarget(subjectPath),
  feature: {
    id: manifest.id || path.basename(subjectPath),
    mode: manifest.mode || "standard",
    approval: manifest.approval || "pending",
    readiness: manifest.readiness || "not_ready",
    status: manifest.status || "draft",
    stack_preset: manifest.stack_preset || "next-fullstack",
    epic_id: manifest.epic_id || "none",
    route_decision: manifest.route_decision || "ai_draft",
    risk_level: manifest.risk_level || "unset",
    expected_runtime: manifest.expected_runtime || "unset",
    execution_slicing: manifest.execution_slicing || "not_required",
  },
  result: failures.length ? "BLOCKED" : "PASS",
  completion_result: failures.length ? "blocked" : "pass",
  summary: {
    blockers: failures.length,
    warnings: warnings.length,
    checks: rows.length,
  },
  coverage: {
    required: coverageResult.required,
    expected_count: coverageResult.expected_count,
    declared_count: coverageResult.declared_count,
    verified_count: coverageResult.verified_count,
    missing_in_report: coverageResult.missing_in_report,
    missing_evidence: coverageResult.missing_evidence,
    not_passed: coverageResult.not_passed,
    invalid_source_rows: coverageResult.invalid_source_rows,
    duplicate_ids: coverageResult.duplicate_ids,
  },
  checks: rows,
  changed_files: relevantChangedFiles,
  completion_report_path: outputPath,
  verification_report_path: path.join(subjectPath, reportFile),
};

if (jsonOutput) {
  printJsonForCli(payload);
} else {
  console.log(`Completion check written: ${workflow.relativeToTarget(outputPath)}`);
  console.log(`Completion check result: ${failures.length ? "BLOCKED" : "PASS"}`);
}

if (failures.length) {
  if (!jsonOutput) {
    console.error("");
    console.error("Blocked items:");
    for (const failure of failures) {
      console.error(` - ${failure.detail}`);
    }
  }
  process.exit(1);
}
