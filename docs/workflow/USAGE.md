# 维护者使用说明

这份文档只面向维护 `document-driven-workflow` 仓库的人。普通项目使用者应阅读 `USER_GUIDE.md`，并通过自然语言让 Codex / Claude Code 使用 Skill。

目标项目不要为了暴露工作流命令而修改自己的 `package.json`。

## 仓库维护命令

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

完整回归：

```bash
npm test
```

`dist/` 是构建产物，通常不提交，除非明确需要把构建后的包作为发布物分发。

## 主脚本

维护者直接调试时，优先使用这些 Skill 内置脚本，并始终传入 `--target <project-root>`。

体检目标项目和本机 Skill：

```bash
node scripts/workflow/automation/doctor.mjs --target <project-root> --host all
```

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

执行验证：

```bash
node scripts/workflow/automation/verify.mjs docs/features/<feature-id> --target <project-root>
```

也可以手动补一个命令：

```bash
node scripts/workflow/automation/verify.mjs docs/features/<feature-id> --target <project-root> --command "npm run build"
```

唯一完成出口：

```bash
node scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root>
```

如果改动已经提交，或不方便读取 git 工作区，可以传入：

```bash
node scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root> --base origin/main
node scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root> --changed-files "src/app/page.tsx,src/lib/demo.ts"
```

`finish-feature.mjs` 会运行 Feature gate、验证命令、completion-check，并在全部通过后写入 `COMPLETION_PROOF.json` 和 `status: verified`。`completion-check.mjs` 仍可用于诊断，但不是正式完成出口。

## Maestro 机器接口

Maestro 应读取 JSON 输出，不要解析普通 Markdown 报告。

```bash
node scripts/workflow/automation/doctor.mjs --target <project-root> --json
node scripts/workflow/automation/status.mjs --target <project-root> --json
node scripts/workflow/automation/handoff-pack.mjs docs/features/<feature-id> --target <project-root> --json
node scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root> --json
```

这些接口只提供单项目状态、交接和完成证据。跨项目 mission、依赖、联调和集成验收由 Maestro 管理。

## 高级脚本

这些脚本用于调试、局部流程或维护工作流本身。普通使用者通常不需要直接调用。

| Script | 用途 |
| --- | --- |
| `route.mjs` | 生成路由评审 |
| `approval-review.mjs` | 检查文档是否可以提交用户批准 |
| `approve.mjs` | 把批准写入 `00-workflow.yaml` |
| `context-pack.mjs` | 生成紧凑实现交接上下文 |
| `agent-plan.mjs` | 生成 Epic agent 分工 |
| `completion-check.mjs` | 底层完成检查和诊断 |
| `finish-feature.mjs` | 唯一完成出口 |
| `status.mjs` | 输出 Epic / Feature 状态快照 |
| `handoff-pack.mjs` | 生成 Feature 交接包 |
| `init-product.mjs` | 创建产品台账、追溯矩阵和 snapshot 目录 |

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

## 中文终端提示

本仓库文档使用 UTF-8。Windows PowerShell 如果没有设置 UTF-8 输出，中文可能显示乱码，但文件本身通常没有损坏。排查时可以先运行：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

然后再读取文档或运行检查。
