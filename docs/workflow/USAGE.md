# Usage Guide

这份说明解释工作流每个功能怎么使用。用户可以直接通过自然语言让 AI 使用 `document-driven-workflow`，也可以在本仓库维护工作流时运行下面的命令。

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

## 目标项目接入

推荐用户提示词：

```text
Use document-driven-workflow to apply the workflow to this project.
Read existing docs and scripts first. Do not overwrite existing docs. Do not modify package.json just to expose workflow commands.
```

目标项目只保存项目相关文档：

```text
docs/epics/
docs/features/
docs/product/
docs/legacy/
docs/changes/
docs/decisions/
```

工作流脚本留在 Skill 内部，通过 `--target <project-root>` 作用到目标项目。

接入时建议先初始化产品历史层：

```bash
npm run workflow:init-product -- --target <project-root>
```

它会创建：

```text
docs/product/requirement-ledger.md
docs/product/traceability.md
docs/product/snapshots/
```

## 路由一个需求

```bash
npm run workflow:route -- --source docs/requirements/example.md
```

输出为 `docs/workflow/ROUTING_REVIEW.md`，会建议 Direct、Light、Standard、Epic 或 Strict。它不会批准实现。

## 创建 Epic

```bash
npm run epic:new -- ai-fooler-upgrade
```

生成文档包：

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
```

当一个产品迭代跨多个模块或多个发布批次时，使用 Epic。

## Hydrate Epic

把原始产品材料放入 `00-source.md`，然后运行：

```bash
npm run epic:hydrate -- docs/epics/<epic-id>
```

Hydration 会生成可审查的 Epic 草稿内容，不会批准 Epic。批准状态仍然只在 `00-workflow.yaml`。

## 批准并检查 Epic

用户审查并明确批准后：

```bash
npm run workflow:approve -- docs/epics/<epic-id> --user-approved
npm run gate:epic -- docs/epics/<epic-id>
```

Epic gate 通过只表示 Epic 可以拆成 Features，不代表可以直接从 Epic 写代码。

## 从 Epic 生成 Features

```bash
npm run epic:features -- docs/epics/<epic-id> --features feature-a,feature-b --stack next-fullstack
```

生成的 Feature packages 都包含 `00-workflow.yaml`。如果 Epic 已批准，Feature 可以继承批准：

```yaml
approval: inherited
approval_source: docs/epics/<epic-id>
```

每个 Feature 仍然必须单独运行自己的 `gate:dev`。

## 创建 Standard Feature

```bash
npm run feature:new -- login-phone --stack next-fullstack
```

生成文档包：

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
  08-context-pack.md
```

`07-verification-report.md` 在实现和验证后创建或更新。

## 创建 Light Feature

```bash
npm run feature:new -- button-copy-adjust --mode light --stack next-fullstack
```

生成文档包：

```text
docs/features/<feature-id>/
  00-workflow.yaml
  01-light-feature.md
```

Light 只用于低风险、单一范围改动。不要用于老项目接入、认证、支付、权限、数据库、任务状态、部署、迁移或多模块迭代。

## Hydrate Feature

把原始材料放入 `00-source.md` 或 `01-prd.md`，然后运行：

```bash
npm run feature:hydrate -- docs/features/<feature-id>
```

Hydration 会补全草稿文档，但不会批准它们。

## 生成 Context Pack

Standard 或 Strict Feature 开发前，可以生成紧凑实现交接材料：

```bash
npm run workflow:context-pack -- docs/features/<feature-id> --force
```

输出为 `08-context-pack.md`。实现 agent 应先读它，再按需打开更大的需求文档。

## 执行 Feature

批准并通过门禁后：

```bash
npm run gate:dev -- docs/features/<feature-id>
```

实现 agent 必须遵守：

```text
docs/features/<feature-id>/06-implementation-plan.md
docs/features/<feature-id>/08-context-pack.md
docs/workflow/EXECUTION_DISCIPLINE.md
```

实现必须留在 Scope Lock 内。如果 Context Pack 要求 TDD 或 debugging，证据必须记录到 `07-verification-report.md`。

## 批准前检查

```bash
npm run workflow:approval-review -- docs/features/<feature-id>
```

它会写入 `APPROVAL_REVIEW.md`。这个报告只提供建议，不会批准。

## 批准并检查 Feature

用户明确批准后：

```bash
npm run workflow:approve -- docs/features/<feature-id> --user-approved
npm run gate:dev -- docs/features/<feature-id>
```

批准只修改 `00-workflow.yaml`。gate 会检查 manifest 和文档内容。

## Agent Plan

```bash
npm run workflow:agent-plan -- docs/epics/<epic-id> --features feature-a,feature-b --force
```

它会写入 `09-agent-plan.md`。这是多 agent 分工计划，不是自动派发器。

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
