import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { readText, stripHtmlComments } from "../../shared/document-utils.mjs";
import { readManifest } from "../../shared/workflow-manifest.mjs";

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
const subjectRel = workflow.relativeToTarget(subjectPath);
const outputDir = outputArg ? workflow.resolveTarget(outputArg) : subjectPath;
const markdownPath = path.join(outputDir, "HANDOFF_PACK.md");
const jsonPath = path.join(outputDir, "handoff-pack.json");
const workflowScripts = {
  gate: `node ${path.join(workflow.packageRoot, "scripts/workflow/feature/gate-feature.mjs")} ${subjectRel} --target ${workflow.targetRoot}`,
  verify: `node ${path.join(workflow.packageRoot, "scripts/workflow/automation/verify.mjs")} ${subjectRel} --target ${workflow.targetRoot}`,
  completion_check: `node ${path.join(workflow.packageRoot, "scripts/workflow/automation/completion-check.mjs")} ${subjectRel} --target ${workflow.targetRoot}`,
};

const codexPrompt = `Use document-driven-workflow in ${workflow.targetRoot}.
Implement ${subjectRel} only after the Feature gate passes.
Read HANDOFF_PACK.md, 00-workflow.yaml, requirement docs, acceptance criteria, implementation plan, and context pack.
Respect allowed scope, forbidden scope, non-goals, and maintainability guardrails.
Update the verification report, run verification, then run completion-check before reporting done.`;

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
  },
  requirement_ids: requirementIds,
  acceptance_ids: acceptanceIds,
  source_docs: detectFiles().map((file) => `${subjectRel}/${file}`),
  scope: {
    approved: approvedScope,
    allowed: allowedScope,
    forbidden: forbiddenScope,
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

## Approved Scope

${approvedScope.map((item) => `- ${item}`).join("\n") || "- See Feature documents."}

## Allowed Scope

${allowedScope.map((item) => `- ${item}`).join("\n") || "- See Feature documents."}

## Forbidden Scope

${forbiddenScope.map((item) => `- ${item}`).join("\n") || "- See Feature documents."}

## Test Commands

${testCommands.map((item) => `- ${item.label}: ${item.command}`).join("\n") || "- No machine-readable command found. Use Feature verification plan."}

## Workflow Commands

\`\`\`bash
${workflowScripts.gate}
${workflowScripts.verify}
${workflowScripts.completion_check}
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
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(`Handoff pack written: ${workflow.relativeToTarget(markdownPath)}`);
  console.log(`Handoff JSON written: ${workflow.relativeToTarget(jsonPath)}`);
}
