import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { parseAgentOption } from "../../shared/agent-runner.mjs";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { ensureProductArtifacts } from "../../shared/product-artifacts.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const agent = parseAgentOption(args);
const sourceArg = parseOption(args, "source", args[0] || "", { startIndex: 0 });
const idArg = parseOption(args, "id", "", { startIndex: 0 });
const modeArg = parseOption(args, "mode", "auto", { startIndex: 0 }).toLowerCase();
const stackPreset = parseOption(args, "stack", "next-fullstack", { startIndex: 0 });

const validModes = new Set(["auto", "direct", "light", "standard", "epic", "strict"]);
const validStacks = new Set(["next-fullstack", "flutter-fastapi", "flutter-express", "legacy-existing"]);

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

if (!validStacks.has(stackPreset)) {
  console.error(`Invalid stack preset: ${stackPreset}`);
  console.error("Allowed values: next-fullstack, flutter-fastapi, flutter-express, legacy-existing");
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
  const strictPattern = /(auth|login|payment|permission|database|migration|deploy|task state|quota|membership|pricing|entitlement|legacy|认证|登录|支付|权限|数据库|迁移|部署|任务状态|额度|会员|老项目)/i;
  const epicPattern = /(epic|iteration|milestone|multi-module|multiple modules|release batch|batch|多个模块|多模块|多个功能|产品迭代|一轮迭代|发布批次|拆分成多个|多端|移动端.*web|web.*移动端)/i;
  const lightPattern = /(copy|style|text|button|small ui|minor|文案|样式|按钮|颜色|间距|低风险|小改动)/i;

  if (epicPattern.test(text)) {
    return "epic";
  }
  if (strictPattern.test(text)) {
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

function writeRoutingReview({ mode, source }) {
  const outputPath = path.join(workflow.targetRoot, "docs", "workflow", "ROUTING_REVIEW.md");
  mkdirSync(path.dirname(outputPath), { recursive: true });
  const content = `# Workflow Routing Review

- Source: ${workflow.relativeToTarget(sourcePath)}
- Routing Status: Reviewed
- Recommended Mode: ${mode[0].toUpperCase()}${mode.slice(1)}

<!--
Allowed Status Values

- Routing Status: Draft / Reviewed
- Recommended Mode: Direct / Light / Standard / Epic / Strict
-->

## Recommendation

- 推荐使用 ${mode[0].toUpperCase()}${mode.slice(1)}。

## Reasoning

- 本结论由 \`workflow:process\` 根据需求文本、风险关键词和范围大小生成。
- 如果 AI 在补全文档时发现范围更大或风险更高，应在文档中说明并升级模式。

## Risk Triggers

${/(auth|login|payment|permission|database|migration|deploy|task state|quota|membership|pricing|entitlement|legacy|认证|登录|支付|权限|数据库|迁移|部署|任务状态|额度|会员|老项目)/i.test(source) ? "- 命中了高风险关键词，需要更强边界。" : "- 暂未命中强制 Strict 风险关键词。"}

## Required Artifacts

${mode === "direct" ? "- 不创建 Epic / Feature 文档包。" : mode === "epic" ? "- 创建 Epic 文档包，等待用户批准后再拆分 Feature。" : "- 创建 Feature 文档包，等待用户批准后再进入实现。"}

## Next Step

- 审查生成的文档包。
- 如同意，使用 \`workflow:continue <docs/epics/id|docs/features/id> --user-approved\` 进入 gate。
`;
  writeFileSync(outputPath, content, "utf8");
  return outputPath;
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
console.log("Next step: user reviews the documents, then run workflow:continue with --user-approved.");
