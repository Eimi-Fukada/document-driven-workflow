import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { listDirs, readText } from "../../shared/document-utils.mjs";
import { readManifest } from "../../shared/workflow-manifest.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const epicArg = parseOption(args, "epic", args[0] || "", { startIndex: 0 });
const featuresArg = parseOption(args, "features", "", { startIndex: 0 });
const force = args.includes("--force");

if (!epicArg) {
  console.error("Missing Epic path.");
  console.error("Usage: node scripts/workflow/automation/agent-plan.mjs docs/epics/<epic-id> --target <project-root>");
  process.exit(1);
}

const epicPath = workflow.resolveTarget(epicArg);
if (!existsSync(epicPath)) {
  console.error(`Epic path not found: ${workflow.relativeToTarget(epicPath)}`);
  process.exit(1);
}

const epicId = path.basename(epicPath);
const featuresRoot = path.join(workflow.targetRoot, "docs", "features");
const featureIds = featuresArg
  ? featuresArg.split(",").map((item) => item.trim()).filter(Boolean)
  : listDirs(featuresRoot)
      .filter((featurePath) => readManifest(featurePath)?.epic_id === epicId)
      .map((featurePath) => path.basename(featurePath));

if (featureIds.length === 0) {
  console.error("No Feature IDs found. Pass --features feature-a,feature-b.");
  process.exit(1);
}

const planPath = path.join(epicPath, "09-agent-plan.md");
if (existsSync(planPath) && !force) {
  console.error(`Agent plan already exists: ${workflow.relativeToTarget(planPath)}`);
  console.error("Use --force to overwrite.");
  process.exit(1);
}

function classifyFeature(featureId) {
  const featurePath = path.join(featuresRoot, featureId);
  const manifest = readManifest(featurePath);
  const text = [
    readText(path.join(featurePath, "01-light-feature.md")),
    readText(path.join(featurePath, "01-prd.md")),
    readText(path.join(featurePath, "03-technical-contract.md")),
    readText(path.join(featurePath, "06-implementation-plan.md")),
  ].join("\n").toLowerCase();

  const highRisk = /(auth|login|payment|permission|database|migration|deploy|task state|权限|登录|支付|数据库|迁移|部署|任务状态)/i.test(text);
  const light = manifest?.mode === "light";

  return {
    parallelization: light ? "Do not parallelize; single low-risk task" : highRisk ? "Serial or strict review required" : "Parallel if file scopes do not overlap",
    forbidden: highRisk
      ? "Unapproved auth/payment/database/deployment changes; unrelated refactors"
      : "Auth/payment/deployment/data migration unless explicitly approved",
    mergeRisk: light ? "Low" : highRisk ? "High" : "Medium",
  };
}

const rows = featureIds
  .map((featureId, index) => {
    const classification = classifyFeature(featureId);
    return `| ${featureId} | Agent ${index + 1} | ${classification.parallelization} | docs/features/${featureId}/08-context-pack.md | docs/features/${featureId} and files approved by its implementation plan | ${classification.forbidden} | Run Feature gate, relevant project tests, and update verification report | ${classification.mergeRisk} |`;
  })
  .join("\n");

const content = `# Agent Plan

- Epic ID: ${epicId}

## Parallelization Rule

只有当 Feature 边界、依赖、允许文件、禁止文件和验证命令都清楚时，才使用多 agent 并行。

多 agent 只适合 Epic 或 Strict mode。不要用于 Light mode，也不要用于单个低风险 Feature。

## Assignment Matrix

| Feature ID | Suggested Agent | Parallelization | Required Context | Allowed Scope | Forbidden Scope | Verification | Merge Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Integration Order

1. 先合并低风险、相互独立的 Features。
2. 共享状态或 API 相关 Features 在依赖完成后合并。
3. 高风险 Features 放到最后，并执行专门验证。

## Approval Boundary

Agent 分工只是建议。唯一机器可读工作流状态是 \`00-workflow.yaml\`。
`;

mkdirSync(path.dirname(planPath), { recursive: true });
writeFileSync(planPath, content, "utf8");

console.log(`Agent plan written: ${workflow.relativeToTarget(planPath)}`);
console.log(`Feature count: ${featureIds.length}`);
