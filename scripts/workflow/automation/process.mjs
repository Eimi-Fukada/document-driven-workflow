import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { parseAgentOption } from "../../shared/agent-runner.mjs";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { ensureProductArtifacts } from "../../shared/product-artifacts.mjs";
import { readManifest, writeManifest } from "../../shared/workflow-manifest.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const agent = parseAgentOption(args);
const sourceArg = parseOption(args, "source", args[0] || "", { startIndex: 0 });
const idArg = parseOption(args, "id", "", { startIndex: 0 });
const modeArg = parseOption(args, "mode", "auto", { startIndex: 0 }).toLowerCase();
const stackPreset = parseOption(args, "stack", "next-fullstack", { startIndex: 0 });

const validModes = new Set(["auto", "direct", "light", "standard", "epic", "strict"]);

if (!sourceArg) {
  console.error("Missing requirement source.");
  console.error("Usage: node scripts/workflow/automation/process.mjs --source <file-or-dir> --target <project-root> [--id item-id] [--stack next-fullstack]");
  process.exit(1);
}

if (!validModes.has(modeArg)) {
  console.error(`Invalid mode: ${modeArg}`);
  console.error("Allowed values: auto, direct, light, standard, epic, strict");
  process.exit(1);
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(stackPreset)) {
  console.error(`Invalid stack preset: ${stackPreset}`);
  console.error("Use lowercase letters, numbers, and hyphens. Built-in presets have extra rules; custom stacks are allowed.");
  process.exit(1);
}

const sourcePath = workflow.resolveTarget(sourceArg);
if (!existsSync(sourcePath)) {
  console.error(`Requirement source not found: ${workflow.relativeToTarget(sourcePath)}`);
  process.exit(1);
}

function readSourceSummary(filePath) {
  if (filePath.endsWith(".md") || filePath.endsWith(".txt")) {
    return readFileSync(filePath, "utf8").trim();
  }
  return `需求来源是目录：${workflow.relativeToTarget(filePath)}。AI 需要先检查目录内容再补全文档。`;
}

function slugify(input) {
  const base = path.basename(input, path.extname(input));
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || "workflow-item";
}

function classifyMode(source) {
  const text = source.toLowerCase();
  const hardStrictPattern = /(auth|authentication|session|token|payment|permission|database migration|schema migration|migration|production deploy|destructive|delete data|security|task state|legacy core|认证|鉴权|登录态|会话|支付|权限|数据库迁移|结构迁移|迁移|生产部署|数据删除|破坏性|安全|任务状态|老项目核心)/i;
  const epicPattern = /(epic|iteration|milestone|multi-module|multiple modules|release batch|batch|多个模块|多模块|多个功能|产品迭代|一轮迭代|发布批次|拆分成多个|多端|移动端.*web|web.*移动端)/i;
  const lightPattern = /(copy|style|text|button|small ui|minor|文案|样式|按钮|颜色|间距|低风险|小改动)/i;

  if (epicPattern.test(text)) {
    return "epic";
  }
  if (hardStrictPattern.test(text)) {
    return "strict";
  }
  if (lightPattern.test(text) && source.length < 2000) {
    return "light";
  }
  if (source.length < 120) {
    return "direct";
  }
  return "standard";
}

function classifyRouteRisk(source, mode) {
  const hardRiskMatches = [
    ["auth", /(auth|authentication|session|token|认证|鉴权|登录态|会话)/i],
    ["payment", /(payment|pricing|entitlement|membership|支付|会员|权益|定价)/i],
    ["permission", /(permission|权限)/i],
    ["database-migration", /(database migration|schema migration|migration|数据库迁移|结构迁移|迁移)/i],
    ["destructive-data", /(destructive|delete data|数据删除|破坏性)/i],
    ["security", /(security|安全)/i],
    ["production-deployment", /(production deploy|deploy|生产部署|部署)/i],
    ["task-state", /(task state|任务状态)/i],
    ["legacy-core", /(legacy core|老项目核心)/i],
  ]
    .filter(([, pattern]) => pattern.test(source))
    .map(([id]) => id);

  return {
    riskLevel: mode === "strict" ? "high" : mode === "light" || mode === "direct" ? "low" : "medium",
    hardRiskBlockers: hardRiskMatches.length ? hardRiskMatches.join(",") : "none",
    expectedRuntime: mode === "direct" || mode === "light" ? "under_30m" : mode === "epic" ? "over_90m" : "30_90m",
    executionSlicing: mode === "epic" ? "required" : mode === "strict" ? "recommended" : "not_required",
    hardRiskMatches,
  };
}

function writeRoutingReview({ mode, source }) {
  const { hardRiskMatches, riskLevel, expectedRuntime, executionSlicing } = classifyRouteRisk(source, mode);
  const outputPath = path.join(workflow.targetRoot, "docs", "workflow", "ROUTING_REVIEW.md");
  mkdirSync(path.dirname(outputPath), { recursive: true });
  const content = `# Workflow Routing Review

- Source: ${workflow.relativeToTarget(sourcePath)}
- Recommended Mode: ${mode[0].toUpperCase()}${mode.slice(1)}
- Suggested Risk Level: ${riskLevel}
- Objective Hard Risk Blockers: ${hardRiskMatches.length ? hardRiskMatches.join(", ") : "none"}
- Expected Runtime: ${expectedRuntime}
- Execution Slicing: ${executionSlicing}

## Recommendation

- 推荐使用 ${mode[0].toUpperCase()}${mode.slice(1)}。
- 这是 AI 初判，不是最终批准。用户审查后可以保持、降级、升级或拆分。

## Reasoning

- 本结论由 \`workflow:process\` 根据需求文本、风险关键词和范围大小生成。
- 如果 AI 在补全文档时发现范围更大或风险更高，应在文档中说明，让用户确认是否调整模式。
- 除客观硬风险外，不要因为 AI 不确定就自动把简单需求推入重流程。

## Risk Triggers

${hardRiskMatches.length ? `- 命中客观硬风险：${hardRiskMatches.join(", ")}。如果进入 Feature 实现，必须使用 Strict mode。` : "- 暂未命中客观硬风险。普通风险由用户审查后决定是否升级。"}

## User Confirmation Draft

- AI suggested mode: ${mode}
- AI suggested risk level: ${riskLevel}
- Objective hard risk blockers: ${hardRiskMatches.length ? hardRiskMatches.join(", ") : "none"}
- Expected runtime: ${expectedRuntime}
- Execution slicing: ${executionSlicing}
- User can confirm / downgrade / upgrade / split: yes

## Required Artifacts

${mode === "direct" ? "- 不创建 Epic / Feature 文档包。" : mode === "epic" ? "- 创建 Epic 文档包，等待用户批准后再拆分 Feature。" : "- 创建 Feature 文档包，等待用户批准后再进入实现。"}

## Next Step

- 审查生成的文档包。
- 如同意，让 AI 使用 document-driven-workflow 写入一次批准并进入 gate。
- 如不同意，只调整需求或 \`00-workflow.yaml\` 中的模式/风险字段，不需要在多个 Markdown 文件里改批准状态。
`;
  writeFileSync(outputPath, content, "utf8");
  return outputPath;
}

function writeRouteDraftToManifest(subjectRelativePath, source, mode) {
  const subjectPath = workflow.resolveTarget(subjectRelativePath);
  const manifest = readManifest(subjectPath);
  if (!manifest) {
    return;
  }
  const { riskLevel, hardRiskBlockers, expectedRuntime, executionSlicing } = classifyRouteRisk(source, mode);
  writeManifest(subjectPath, {
    ...manifest,
    route_decision: "ai_draft",
    risk_level: riskLevel,
    hard_risk_blockers: hardRiskBlockers,
    expected_runtime: expectedRuntime,
    execution_slicing: executionSlicing,
  });
}

function runNode(scriptRelativePath, scriptArgs) {
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
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const source = readSourceSummary(sourcePath);
const selectedMode = modeArg === "auto" ? classifyMode(source) : modeArg;
const routingReviewPath = writeRoutingReview({ mode: selectedMode, source });

ensureProductArtifacts(workflow);

if (selectedMode === "direct") {
  console.log(`Routing review written: ${workflow.relativeToTarget(routingReviewPath)}`);
  console.log("Mode: Direct");
  console.log("No Epic or Feature package was created.");
  process.exit(0);
}

const id = idArg || slugify(sourcePath);
const targetSubject =
  selectedMode === "epic" ? path.join("docs", "epics", id) : path.join("docs", "features", id);

if (existsSync(workflow.resolveTarget(targetSubject))) {
  console.error(`Workflow subject already exists: ${targetSubject}`);
  process.exit(1);
}

if (selectedMode === "epic") {
  runNode("scripts/workflow/epic/new-epic.mjs", [id, "--target", workflow.targetRoot]);
  writeRouteDraftToManifest(targetSubject, source, "epic");
  const epicSourcePath = workflow.resolveTarget(path.join(targetSubject, "00-source.md"));
  writeFileSync(epicSourcePath, `# Epic Source\n\n${source}\n`, "utf8");
  runNode("scripts/workflow/epic/hydrate-epic.mjs", [
    targetSubject,
    "--target",
    workflow.targetRoot,
    "--agent",
    agent,
  ]);
  runNode("scripts/workflow/automation/approval-review.mjs", [targetSubject, "--target", workflow.targetRoot]);
} else {
  const featureMode = selectedMode === "strict" ? "strict" : selectedMode === "light" ? "light" : "standard";
  runNode("scripts/workflow/feature/new-feature.mjs", [
    id,
    "--target",
    workflow.targetRoot,
    "--stack",
    stackPreset,
    "--mode",
    featureMode,
  ]);
  writeRouteDraftToManifest(targetSubject, source, featureMode);
  const featureSourcePath = workflow.resolveTarget(path.join(targetSubject, "00-source.md"));
  writeFileSync(featureSourcePath, `# Feature Source\n\n${source}\n`, "utf8");
  runNode("scripts/workflow/feature/hydrate-feature.mjs", [
    targetSubject,
    "--target",
    workflow.targetRoot,
    "--mode",
    featureMode,
    "--agent",
    agent,
  ]);
  runNode("scripts/workflow/automation/approval-review.mjs", [targetSubject, "--target", workflow.targetRoot]);
}

console.log("");
console.log("Workflow process completed.");
console.log(`Routing review: ${workflow.relativeToTarget(routingReviewPath)}`);
console.log(`Generated subject: ${targetSubject}`);
console.log("Next step: user reviews the documents, then ask document-driven-workflow to continue with explicit approval.");
