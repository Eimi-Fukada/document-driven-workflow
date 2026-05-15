import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { readText, stripHtmlComments } from "../../shared/document-utils.mjs";
import { readManifest } from "../../shared/workflow-manifest.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const subjectArg = parseOption(args, "subject", args[0] || "", { startIndex: 0 });
const outputArg = parseOption(args, "output", "", { startIndex: 0 });

if (!subjectArg) {
  console.error("Missing workflow document path.");
  console.error("Usage: node scripts/workflow/automation/approval-review.mjs <docs/features/id|docs/epics/id> --target <project-root>");
  process.exit(1);
}

const subjectPath = workflow.resolveTarget(subjectArg);
if (!existsSync(subjectPath)) {
  console.error(`Subject path not found: ${workflow.relativeToTarget(subjectPath)}`);
  process.exit(1);
}

const manifest = readManifest(subjectPath);
if (!manifest) {
  console.error("Missing 00-workflow.yaml. Approval review requires the unified workflow control file.");
  process.exit(1);
}

const outputPath = outputArg
  ? workflow.resolveTarget(outputArg)
  : path.join(subjectPath, "APPROVAL_REVIEW.md");

function statusLine(label, ok, detail) {
  return `| ${label} | ${ok ? "PASS" : "BLOCKED"} | ${detail} |`;
}

function manifestCheck(label, key, expected) {
  const actual = String(manifest[key] || "");
  const ok = Array.isArray(expected) ? expected.includes(actual) : actual === expected;
  return statusLine(label, ok, `00-workflow.yaml ${key} must be ${Array.isArray(expected) ? expected.join(" | ") : expected}.`);
}

function sharedManifestRows() {
  return [
    manifestCheck("未解决问题", "unresolved_questions", "0"),
    manifestCheck("阻塞问题", "blocking_issues", "0"),
    manifestCheck("假设确认", "assumptions_accepted", ["true", "false"]),
    manifestCheck("Manifest Approval", "approval", "pending"),
  ];
}

function reviewLightFeature() {
  const content = stripHtmlComments(readText(path.join(subjectPath, "01-light-feature.md")));
  return [
    manifestCheck("文档类型", "type", "feature"),
    manifestCheck("Feature Mode", "mode", "light"),
    ...sharedManifestRows(),
    statusLine("Requirement IDs", /REQ-/.test(content), "至少需要一个 REQ-*。"),
    statusLine("Acceptance IDs", /AC-/.test(content), "至少需要一个 AC-*。"),
  ];
}

function reviewFeature() {
  const intake = stripHtmlComments(readText(path.join(subjectPath, "00-intake-review.md")));
  const prd = stripHtmlComments(readText(path.join(subjectPath, "01-prd.md")));
  const acceptance = stripHtmlComments(readText(path.join(subjectPath, "04-acceptance-criteria.md")));
  const context = stripHtmlComments(readText(path.join(subjectPath, "08-context-pack.md")));
  return [
    manifestCheck("文档类型", "type", "feature"),
    manifestCheck("Feature Mode", "mode", ["standard", "strict"]),
    ...sharedManifestRows(),
    statusLine("Intake Review", /Clear Items/i.test(intake) && /User Questions/i.test(intake), "00-intake-review.md 应总结清楚项、缺失项、风险和用户问题。"),
    statusLine("Requirement IDs", /REQ-/.test(`${prd}\n${acceptance}`), "至少需要一个 REQ-*。"),
    statusLine("Acceptance IDs", /AC-/.test(acceptance), "至少需要一个 AC-*。"),
    statusLine("Context Pack", /Requirement IDs/i.test(context) && /Test Commands/i.test(context), "08-context-pack.md 应提供紧凑实现交接上下文。"),
  ];
}

function reviewEpic() {
  const inventory = stripHtmlComments(readText(path.join(subjectPath, "02-requirement-inventory.md")));
  const scope = stripHtmlComments(readText(path.join(subjectPath, "03-scope-breakdown.md")));
  const risk = stripHtmlComments(readText(path.join(subjectPath, "04-risk-map.md")));
  const release = stripHtmlComments(readText(path.join(subjectPath, "05-release-plan.md")));
  return [
    manifestCheck("文档类型", "type", "epic"),
    manifestCheck("Epic Mode", "mode", "epic"),
    ...sharedManifestRows(),
    statusLine("Epic Requirements", /EREQ-/.test(inventory), "至少需要一个 EREQ-*。"),
    statusLine("Feature Candidates", /[a-z0-9][a-z0-9-]+/.test(scope), "需要 Feature 候选项。"),
    statusLine("Risk Items", /RISK-/.test(risk), "至少需要一个 RISK-*。"),
    statusLine("Release Plan", /Batch 1/.test(release), "需要 Batch 1。"),
  ];
}

const rows =
  manifest.type === "feature" && manifest.mode === "light"
    ? reviewLightFeature()
    : manifest.type === "feature"
      ? reviewFeature()
      : reviewEpic();
const blocked = rows.filter((row) => row.includes("| BLOCKED |"));
const recommendation = blocked.length === 0 ? "可以提交用户批准。" : "暂时不要批准。";

const report = `# Approval Review

- Subject: ${workflow.relativeToTarget(subjectPath)}
- Document Type: ${manifest.type}
- Mode: ${manifest.mode}
- Review Result: ${blocked.length === 0 ? "PASS" : "BLOCKED"}
- Recommendation: ${recommendation}

## Checks

| Check | Result | Detail |
| --- | --- | --- |
${rows.join("\n")}

## Next Step

${blocked.length === 0
  ? "如果用户同意，运行带 --user-approved 的 approve script。"
  : "先修复阻塞项，然后重新生成本批准前检查报告。"}
`;

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, report, "utf8");

console.log(`Approval review written: ${workflow.relativeToTarget(outputPath)}`);
console.log(`Review result: ${blocked.length === 0 ? "PASS" : "BLOCKED"}`);
