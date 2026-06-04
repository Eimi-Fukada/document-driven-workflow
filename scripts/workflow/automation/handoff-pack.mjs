import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { printJsonForCli, readText, stripHtmlComments } from "../../shared/document-utils.mjs";
import { readManifest } from "../../shared/workflow-manifest.mjs";
import { readCoverageMatrix } from "../../shared/coverage-matrix.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const subjectArg = parseOption(args, "subject", args[0] || "", { startIndex: 0 });
const outputArg = parseOption(args, "output", "", { startIndex: 0 });
const jsonOutput = args.includes("--json");

if (!subjectArg) {
  console.error("Missing Feature path.");
  console.error("Usage: node scripts/workflow/automation/handoff-pack.mjs docs/features/<feature-id> --target <project-root> [--json]");
  process.exit(1);
}

const subjectPath = workflow.resolveTarget(subjectArg);
if (!existsSync(subjectPath)) {
  console.error(`Feature path not found: ${workflow.relativeToTarget(subjectPath)}`);
  process.exit(1);
}

const manifest = readManifest(subjectPath);
if (!manifest || manifest.type !== "feature") {
  console.error("Handoff pack only supports Feature subjects with 00-workflow.yaml.");
  process.exit(1);
}

function normalizeRel(input) {
  return input.replaceAll("\\", "/").replace(/^\.\/+/, "");
}

function readClean(file) {
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

function section(pattern, text) {
  return pattern.exec(text)?.[1]?.trim() || "";
}

function bulletLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

function extractTestCommands(...texts) {
  const labels = ["Typecheck", "Lint", "Unit", "API", "Playwright", "Smoke", "Build", "Format"];
  const commands = [];
  for (const text of texts) {
    for (const label of labels) {
      const match = new RegExp(`^-\\s*${label}:\\s*(.+?)\\s*$`, "im").exec(text);
      if (match && !/^(none|n\/a|not-applicable|not applicable)$/i.test(match[1].trim())) {
        commands.push({ label, command: match[1].trim() });
      }
    }
  }
  return commands.filter(
    (command, index, arr) =>
      arr.findIndex((item) => item.label === command.label && item.command === command.command) === index,
  );
}

function extractLineValue(label, ...texts) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const text of texts) {
    const match = new RegExp(`^-\\s*${escaped}:\\s*(.+?)\\s*$`, "im").exec(text);
    if (match) {
      return match[1].trim();
    }
  }
  return "";
}

function splitCsv(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item && !/^(none|n\/a|not-applicable)$/i.test(item));
}

function detectFiles() {
  const files = [
    "00-workflow.yaml",
    "00-source.md",
    "00-intake-review.md",
    "01-light-feature.md",
    "01-prd.md",
    "02-ui-spec.md",
    "03-technical-contract.md",
    "04-acceptance-criteria.md",
    "05-readiness-review.md",
    "06-implementation-plan.md",
    "07-verification-report.md",
    "08-context-pack.md",
    "COMPLETION_CHECK.md",
  ];
  return files.filter((file) => existsSync(path.join(subjectPath, file)));
}

const light = manifest.mode === "light";
const prd = light ? readClean("01-light-feature.md") : readClean("01-prd.md");
const acceptance = light ? readClean("01-light-feature.md") : readClean("04-acceptance-criteria.md");
const plan = light ? readClean("01-light-feature.md") : readClean("06-implementation-plan.md");
const context = light ? readClean("01-light-feature.md") : readClean("08-context-pack.md");
const requirementIds = collectIds(/\bREQ-[A-Z0-9-]+\b/g, prd, acceptance, plan, context);
const acceptanceIds = collectIds(/\bAC-[A-Z0-9-]+\b/g, acceptance, plan, context);
const coverageMatrix = readCoverageMatrix(acceptance);
const approvedScope = bulletLines(section(/## Scope Lock\s*([\s\S]*?)(?:\n##|$)/i, context) || section(/## Scope Lock\s*([\s\S]*?)(?:\n##|$)/i, plan));
const allowedScope = bulletLines(
  section(/## Allowed Scope\s*([\s\S]*?)(?:\n##|$)/i, context) ||
    section(/Allowed files \/ modules:\s*([\s\S]*?)(?:\n-|$)/i, plan),
);
const forbiddenScope = bulletLines(
  section(/## Forbidden Scope\s*([\s\S]*?)(?:\n##|$)/i, context) ||
    section(/Forbidden files \/ modules:\s*([\s\S]*?)(?:\n-|$)/i, plan) ||
    section(/Forbidden changes:\s*([\s\S]*?)(?:\n##|$)/i, plan),
);
const testCommands = extractTestCommands(context, plan);
const selectedOption = extractLineValue("Selected option", plan, context) || "not-specified";
const rejectedOptions = splitCsv(extractLineValue("Rejected options", plan, context));
const fallbackOptions = splitCsv(extractLineValue("Fallback options", plan, context));
const userOverrideRequired = extractLineValue("User override required", plan, context) || "not-applicable";
const userOverrideReason = extractLineValue("User override reason", plan, context) || "not-applicable";
const subjectRel = workflow.relativeToTarget(subjectPath);
const outputDir = outputArg ? workflow.resolveTarget(outputArg) : subjectPath;
const markdownPath = path.join(outputDir, "HANDOFF_PACK.md");
const jsonPath = path.join(outputDir, "handoff-pack.json");
const workflowScripts = {
  gate: `node ${path.join(workflow.packageRoot, "scripts/workflow/feature/gate-feature.mjs")} ${subjectRel} --target ${workflow.targetRoot}`,
  verify: `node ${path.join(workflow.packageRoot, "scripts/workflow/automation/verify.mjs")} ${subjectRel} --target ${workflow.targetRoot}`,
  completion_check: `node ${path.join(workflow.packageRoot, "scripts/workflow/automation/completion-check.mjs")} ${subjectRel} --target ${workflow.targetRoot}`,
  finish_feature: `node ${path.join(workflow.packageRoot, "scripts/workflow/automation/finish-feature.mjs")} ${subjectRel} --target ${workflow.targetRoot}`,
};
const stallGuard = {
  applies_to: ["expected_feature_runtime_over_30_minutes", "coverage_items_over_5", "long_running_command", "maestro_multi_worker_dispatch", "no_progress_for_15_minutes"],
  progress_update_interval_minutes: "15-30 when triggered",
  stall_threshold_minutes: 15,
  silent_command_threshold_minutes: 15,
  split_expected_after_minutes: "60-90",
  hard_gate: false,
  required_progress_fields: ["current_req_ac_cov", "changed_files", "running_command", "verification_evidence", "next_step"],
};

const codexPrompt = `Use document-driven-workflow in ${workflow.targetRoot}.
You are implementing exactly one Feature: ${subjectRel}.
Do not implement sibling Features, Epic-level extras, or unrelated cleanup.
Run the Feature gate before editing code.
Read HANDOFF_PACK.md, 00-workflow.yaml, requirement docs, acceptance criteria, implementation plan, and 08-context-pack.md.
Lock to the approved REQ IDs, AC IDs, allowed scope, forbidden scope, non-goals, selected option, and maintainability guardrails.
If this Feature has a Coverage Matrix, every COV-* row is required completion scope. For large coverage lists, work in batches of 3-5 coverage items, update evidence after each batch, and continue until every coverage row has implementation evidence, verification evidence, and Passed status.
Use Stall Guard only for long tasks and no-output situations. It is not a completion gate. If the Feature is expected to exceed 30 minutes, has more than 5 coverage items, runs a long command, is part of Maestro multi-worker dispatch, or 15 minutes pass without file changes, command output, verification evidence, or a clear phase result, pause and report current REQ/AC/COV, changed files, running command, verification evidence, blocker, and next step. Short tasks do not need extra progress reports.
If the fastest implementation conflicts with the selected option, uses a rejected/fallback option, expands allowed scope, weakens an acceptance criterion, or only implements partial coverage, stop and ask the user to update/approve the Feature docs before editing further.
Build/typecheck/lint passing is not completion. Update 07-verification-report.md with REQ/AC evidence, changed-file mapping, scope review, performance/closure review, and test/manual verification evidence.
Use finish-feature as the only completion exit. Do not manually mark 00-workflow.yaml as verified. Only report done when finish-feature returns PASS and writes COMPLETION_PROOF.json. Do not start another Feature before this Feature passes finish-feature.`;

const payload = {
  schema_version: "1",
  kind: "workflow_handoff_pack",
  generated_at: new Date().toISOString(),
  target_root: workflow.targetRoot,
  feature: {
    path: subjectRel,
    id: manifest.id || path.basename(subjectPath),
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
  },
  requirement_ids: requirementIds,
  acceptance_ids: acceptanceIds,
  coverage: {
    required: coverageMatrix.required,
    expected_count: coverageMatrix.expectedCount,
    declared_count: coverageMatrix.rows.length,
    ids: coverageMatrix.rows.map((row) => row.id),
    batch_size_recommendation: coverageMatrix.expectedCount > 5 ? "3-5 coverage items per execution pass" : "single pass is acceptable",
  },
  stall_guard: stallGuard,
  source_docs: detectFiles().map((file) => `${subjectRel}/${file}`),
  scope: {
    approved: approvedScope,
    allowed: allowedScope,
    forbidden: forbiddenScope,
  },
  option_decision: {
    selected_option: selectedOption,
    rejected_options: rejectedOptions,
    fallback_options: fallbackOptions,
    user_override_required: userOverrideRequired,
    user_override_reason: userOverrideReason,
  },
  test_commands: testCommands,
  workflow_commands: workflowScripts,
  outputs: {
    markdown: markdownPath,
    json: jsonPath,
  },
  codex_prompt: codexPrompt,
  maestro_boundary:
    "Maestro owns mission scheduling, dependencies, cross-project state, and integration summary. document-driven-workflow owns this single Feature's docs, gates, verification evidence, and handoff input.",
};

const markdown = `# Feature Handoff Pack

- Generated at: ${payload.generated_at}
- Target project: ${workflow.targetRoot}
- Feature: ${subjectRel}
- Feature ID: ${payload.feature.id}
- Mode: ${payload.feature.mode}
- Stack Preset: ${payload.feature.stack_preset}
- Epic ID: ${payload.feature.epic_id}
- Approval: ${payload.feature.approval}
- Readiness: ${payload.feature.readiness}
- Route Decision: ${payload.feature.route_decision}
- Risk Level: ${payload.feature.risk_level}
- Objective Hard Risk Blockers: ${payload.feature.hard_risk_blockers}
- Expected Runtime: ${payload.feature.expected_runtime}
- Execution Slicing: ${payload.feature.execution_slicing}

## Maestro Boundary

Maestro 负责 mission、依赖、跨项目状态和集成汇总。
document-driven-workflow 只负责这个单项目 Feature 的文档、门禁、验证证据和交接输入。
Codex 负责读取本交接包并执行实现。

## Source Documents

${payload.source_docs.map((file) => `- ${file}`).join("\n") || "- none"}

## Requirement IDs

${requirementIds.map((id) => `- ${id}`).join("\n") || "- none"}

## Acceptance IDs

${acceptanceIds.map((id) => `- ${id}`).join("\n") || "- none"}

## Coverage Matrix

- Required: ${payload.coverage.required ? "yes" : "no"}
- Expected coverage items: ${payload.coverage.expected_count}
- Declared coverage rows: ${payload.coverage.declared_count}
- Batch recommendation: ${payload.coverage.batch_size_recommendation}

${payload.coverage.ids.map((id) => `- ${id}`).join("\n") || "- none"}

## Stall Guard

- Applies to: ${payload.stall_guard.applies_to.join(", ")}
- Progress update interval: ${payload.stall_guard.progress_update_interval_minutes}
- Stall threshold: ${payload.stall_guard.stall_threshold_minutes} minutes without file changes, command output, verification evidence, or a phase result
- Silent command threshold: ${payload.stall_guard.silent_command_threshold_minutes} minutes
- Split expected after: ${payload.stall_guard.split_expected_after_minutes} minutes
- Hard gate: ${payload.stall_guard.hard_gate ? "yes" : "no"}
- Required progress fields: ${payload.stall_guard.required_progress_fields.join(", ")}

## Approved Scope

${approvedScope.map((item) => `- ${item}`).join("\n") || "- See Feature documents."}

## Allowed Scope

${allowedScope.map((item) => `- ${item}`).join("\n") || "- See Feature documents."}

## Forbidden Scope

${forbiddenScope.map((item) => `- ${item}`).join("\n") || "- See Feature documents."}

## Option Decision

- Selected option: ${payload.option_decision.selected_option}
- Rejected options: ${payload.option_decision.rejected_options.length ? payload.option_decision.rejected_options.join(", ") : "none"}
- Fallback options: ${payload.option_decision.fallback_options.length ? payload.option_decision.fallback_options.join(", ") : "none"}
- User override required: ${payload.option_decision.user_override_required}
- User override reason: ${payload.option_decision.user_override_reason}

If implementation needs any rejected or fallback option, stop before editing code and ask the user to update and approve the Feature documents.

## Test Commands

${testCommands.map((item) => `- ${item.label}: ${item.command}`).join("\n") || "- No machine-readable command found. Use Feature verification plan."}

## Worker Guardrails

- 一次只实现这个 Feature，不要顺手实现同一 Epic 下的其他 Feature。
- 开工前运行 Feature gate。
- 实现前锁定 08-context-pack.md、04-acceptance-criteria.md 和 06-implementation-plan.md。
- 如果最快实现路径会偏离推荐方案、采用 rejected/fallback 方案、扩大 allowed scope、降低验收标准或只做部分保护，必须停下来让用户确认。
- 构建、typecheck 或 lint 通过不能代表完成。
- 完成后先更新 07-verification-report.md，再运行 finish-feature。
- 不要手动把 00-workflow.yaml 标记为 verified。
- finish-feature 没有 PASS 并写入 COMPLETION_PROOF.json 前，不要报告完成，也不要开始下一个 Feature。
- 如果 Coverage Matrix 启用，每个 COV-* 都是完成范围；覆盖项多于 5 个时可以按 3-5 个一批执行，但不能在全部 COV-* 通过前报告完成。
- Stall Guard 只用于长任务和无输出场景，不是完成门禁；预计超过 30 分钟、覆盖项多于 5 个、长命令无输出或 15 分钟没有可验证进展时，暂停并报告卡点。

## Workflow Commands

\`\`\`bash
${workflowScripts.gate}
${workflowScripts.verify}
${workflowScripts.finish_feature}
\`\`\`

## Codex Worker Prompt

\`\`\`text
${codexPrompt}
\`\`\`
`;

mkdirSync(outputDir, { recursive: true });
writeFileSync(markdownPath, markdown, "utf8");
writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

if (jsonOutput) {
  printJsonForCli(payload);
} else {
  console.log(`Handoff pack written: ${workflow.relativeToTarget(markdownPath)}`);
  console.log(`Handoff JSON written: ${workflow.relativeToTarget(jsonPath)}`);
}
