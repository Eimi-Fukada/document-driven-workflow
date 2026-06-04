import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { printJsonForCli } from "../../shared/document-utils.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const outputArg = parseOption(args, "output", "AGENTS.md", { startIndex: 0 });
const jsonOutput = args.includes("--json");
const noWrite = args.includes("--no-write");

const startMarker = "<!-- document-driven-workflow:start -->";
const endMarker = "<!-- document-driven-workflow:end -->";
const targetFile = workflow.resolveTarget(outputArg);
const targetRel = workflow.relativeToTarget(targetFile);

const block = `${startMarker}
## document-driven-workflow

本项目使用 document-driven-workflow 作为需求到研发、测试、验证的持久工作流约束。

对任何非平凡功能、功能修改、产品迭代、老功能调整或多模块改动：

- 先检查 \`docs/epics\`、\`docs/features\` 和当前 Feature 的 \`00-workflow.yaml\`，不要只凭当前对话继续实现。
- 如果已有当前 Feature，必须继续该 Feature；如果没有，先使用 document-driven-workflow 创建或补全文档包。
- 代码实现前必须通过 Feature gate；批准状态只能由 Skill 内置批准脚本写入 \`00-workflow.yaml\`。
- 实现只能按当前 Feature 的 \`08-context-pack.md\`、验收标准和 Scope Lock 执行。
- 不允许只补轻量文档后直接实现，除非 \`00-workflow.yaml\` 明确是 \`mode: light\` 且 Feature gate 已通过。
- 遇到实现路径偏离推荐方案、扩大 allowed scope、降低验收标准、使用 rejected/fallback 方案或发现文档与代码冲突时，必须暂停并让用户确认。
- \`build\`、\`typecheck\` 或 \`lint\` 通过不是完成信号。
- 声称完成前必须更新验证报告，并运行 \`finish-feature.mjs\`；只有它 PASS 且写入 \`COMPLETION_PROOF.json\` 后，才能认为该 Feature 完成。
- 每次只闭环一个 Feature；不要批量实现多个 Feature 后再统一验收。

目标项目不要为了工作流修改自己的 \`package.json\`。工作流脚本属于已安装 Skill，通过 \`--target <project-root>\` 操作本项目。
${endMarker}`;

function applyBlock(existing) {
  if (!existing.trim()) {
    return `# AI 协作规则\n\n${block}\n`;
  }

  const pattern = new RegExp(`${startMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m");
  if (pattern.test(existing)) {
    return existing.replace(pattern, block);
  }

  const needsBlank = existing.endsWith("\n") ? "\n" : "\n\n";
  return `${existing}${needsBlank}${block}\n`;
}

const before = existsSync(targetFile) ? readFileSync(targetFile, "utf8") : "";
const after = applyBlock(before);
const changed = before !== after;

if (!noWrite && changed) {
  mkdirSync(path.dirname(targetFile), { recursive: true });
  writeFileSync(targetFile, after, "utf8");
}

const payload = {
  schema_version: "1",
  kind: "workflow_adoption",
  generated_at: new Date().toISOString(),
  target_root: workflow.targetRoot,
  file: targetRel,
  result: noWrite ? "DRY_RUN" : "PASS",
  changed,
  markers: {
    start: startMarker,
    end: endMarker,
  },
};

if (jsonOutput) {
  printJsonForCli(payload);
} else {
  console.log(`${noWrite ? "Workflow adoption dry run" : "Workflow adoption updated"}: ${targetRel}`);
  console.log(`Changed: ${changed ? "yes" : "no"}`);
  console.log("Next step: reload or start a new Codex/Claude session so project instructions are re-read.");
}
