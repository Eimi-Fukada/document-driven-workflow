# 使用说明

这份说明解释 `document-driven-workflow` 的每个能力怎么使用。它分成两类：

- 使用者：在目标项目里通过自然语言让 AI 执行工作流。
- 维护者：在本仓库维护 Skill、模板、脚本和门禁。

目标项目不要为了暴露工作流命令而修改自己的 `package.json`。

## 使用者主路径

处理需求：

```text
使用 document-driven-workflow，处理这个需求文档，生成需要的 Epic / Feature 文档，等待我审查。
```

补全 Epic 并拆 Feature：

```text
我已经填好 Epic 的 00-source.md。使用 document-driven-workflow 补全 Epic 文档，并拆分成可独立开发的 Features。
```

批准后继续：

```text
我已经批准这些文档。使用 document-driven-workflow 写入批准、运行门禁，并在通过后开始实现。
```

验证交付：

```text
使用 document-driven-workflow 执行这个 Feature 的验证，并更新验证报告。
```

完成前检查：

```text
使用 document-driven-workflow，在声明完成前检查这个 Feature 的需求覆盖、验证证据、变更范围和可维护性。
```

AI 应该调用 Skill 内置脚本，并通过 `--target <project-root>` 作用到目标项目。目标项目只保存项目文档：

```text
docs/epics/
docs/features/
docs/product/
docs/legacy/
docs/changes/
docs/decisions/
```

## 维护本仓库

检查仓库结构：

```bash
npm run check
```

构建可安装 Skill：

```bash
npm run build
```

安装到本机 AI 工具：

```bash
npm run setup:codex
npm run setup:claude
npm run setup:all
```

`dist/` 是构建产物，通常不提交，除非明确需要把构建后的包作为发布物分发。

## 推荐脚本入口

维护者直接调试时，优先使用主入口。

体检目标项目和本机 Skill：

```bash
node scripts/workflow/automation/doctor.mjs --target <project-root> --host all
```

它会检查当前 Skill 文件是否完整、Codex / Claude 安装的 Skill 是否是最新、本机是否能找到 `codex` / `claude` CLI、目标项目是否已有基本文档结构，以及老项目是否具备 legacy baseline 和 compatibility contract。

一步处理需求：

```bash
node scripts/workflow/automation/process.mjs --source docs/requirements/example.md --target <project-root> --stack next-fullstack
```

它会初始化 `docs/product`、路由需求、创建 Epic 或 Feature 文档包、hydrate 草稿，并生成 `APPROVAL_REVIEW.md`。它不会批准需求，也不会开始实现。

批准后继续：

```bash
node scripts/workflow/automation/continue.mjs docs/features/<feature-id> --target <project-root> --user-approved
```

对 Feature，它会写入批准、刷新 Standard / Strict Feature 的 `08-context-pack.md`，并运行 Feature gate。

对 Epic，它会写入批准并运行 Epic gate。需要同时拆分 Feature 时：

```bash
node scripts/workflow/automation/continue.mjs docs/epics/<epic-id> --target <project-root> --user-approved --features feature-a,feature-b --stack next-fullstack
```

自动验证：

```bash
node scripts/workflow/automation/verify.mjs docs/features/<feature-id> --target <project-root>
```

它会读取 `08-context-pack.md`、`06-implementation-plan.md` 或 Light Feature 文档中的测试命令，执行命令，并把结果追加到 `07-verification-report.md` 或 `01-light-feature.md`。

也可以手动补一个命令：

```bash
node scripts/workflow/automation/verify.mjs docs/features/<feature-id> --target <project-root> --command "npm run build"
```

完成前门禁：

```bash
node scripts/workflow/automation/completion-check.mjs docs/features/<feature-id> --target <project-root>
```

它会在 AI 声称 Feature 完成前检查：

- Feature gate 是否仍然通过。
- 需求 ID 和验收 ID 是否有验证证据。
- 验证报告是否记录了新测试或人工验证证据。
- 变更文件是否映射到需求。
- 是否触碰禁止范围或超出允许范围。
- 是否处理 1000-line 文件限制、复用抽取、Tailwind CSS 等可维护性规则。
- `docs/product/traceability.md` 是否记录为已更新或不适用。

如果改动已经提交，或不方便读取 git 工作区，可以传入：

```bash
node scripts/workflow/automation/completion-check.mjs docs/features/<feature-id> --target <project-root> --base origin/main
node scripts/workflow/automation/completion-check.mjs docs/features/<feature-id> --target <project-root> --changed-files "src/app/page.tsx,src/lib/demo.ts"
```

## 高级脚本

这些脚本用于调试、局部流程或维护工作流本身。普通使用者通常不需要直接调用。

路由需求：

```bash
node scripts/workflow/automation/route.mjs --source docs/requirements/example.md --target <project-root>
```

体检环境：

```bash
node scripts/workflow/automation/doctor.mjs --target <project-root> --host all
```

批准前检查：

```bash
node scripts/workflow/automation/approval-review.mjs docs/features/<feature-id> --target <project-root>
```

只写入批准：

```bash
node scripts/workflow/automation/approve.mjs docs/features/<feature-id> --target <project-root> --user-approved
```

生成 Context Pack：

```bash
node scripts/workflow/automation/context-pack.mjs docs/features/<feature-id> --target <project-root> --force
```

生成 Agent Plan：

```bash
node scripts/workflow/automation/agent-plan.mjs docs/epics/<epic-id> --target <project-root> --features feature-a,feature-b --force
```

完成前检查：

```bash
node scripts/workflow/automation/completion-check.mjs docs/features/<feature-id> --target <project-root>
```

## 文档包

Epic 文档包：

```text
docs/epics/<epic-id>/
  00-workflow.yaml
  00-source.md
  01-epic-brief.md
  02-requirement-inventory.md
  03-scope-breakdown.md
  04-risk-map.md
  05-release-plan.md
  06-acceptance-map.md
  07-progress-board.md
  08-retrospective.md
  09-agent-plan.md
```

Standard / Strict Feature 文档包：

```text
docs/features/<feature-id>/
  00-workflow.yaml
  00-intake-review.md
  01-prd.md
  02-ui-spec.md
  03-technical-contract.md
  04-acceptance-criteria.md
  05-readiness-review.md
  06-implementation-plan.md
  07-verification-report.md
  08-context-pack.md
```

Light Feature 文档包：

```text
docs/features/<feature-id>/
  00-workflow.yaml
  01-light-feature.md
```

`07-verification-report.md` 可以在实现和验证后创建或更新。

## Agent 选项

Hydrate 和生成类脚本支持：

- `--agent codex`：调用 Codex CLI。
- `--agent claude`：调用 Claude Code CLI。
- `--agent none`：只生成文档骨架，不调用 AI，主要用于测试。

默认值是 `codex`。也可以设置：

```bash
WORKFLOW_HYDRATE_AGENT=claude
```

## 老项目接入

老项目进入功能开发前，先建立：

```text
docs/legacy/BASELINE.md
docs/legacy/COMPATIBILITY_CONTRACT.md
```

只有这些文档存在后，才使用 `legacy-existing`。

## Change Request

修改已有行为时创建：

```text
docs/changes/CR-0001.md
```

然后更新受影响的 Epic 或 Feature 文档，并重新运行相关 gate。

## 回归测试

```bash
npm run test:gates
npm test
```

修改 gate、模板、技术栈策略或 Skill 入口后运行这些检查。
