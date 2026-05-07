# Document Driven Workflow

这是一套面向 Codex 和 Claude Code 的文档驱动产品交付工作流。

核心目标：用“产品文档 + UI 图 + 验收标准”作为人与 AI 的协作接口，由 AI 完成实现计划、代码、测试、修复和部署准备。

## 先读说明书

第一次使用或推广这套工作流时，先读：

- `docs/workflow/USER_GUIDE.md`

这份说明书解释 Epic、Feature、Gate、Legacy、ADR、Verification 的分工，也说明什么时候不用 Epic、什么时候可以轻量使用 Feature。

## 快速开始

检查仓库结构和规则：

```bash
npm run check
```

构建本地 AI 技能：

```bash
npm run build
```

安装到 Codex 和 Claude Code：

```bash
npm run setup:all
```

只安装到 Codex：

```bash
npm run setup:codex
```

只安装到 Claude Code：

```bash
npm run setup:claude
```

## 强制开发门禁

进入研发前必须对某个功能文档包执行开发门禁：

```bash
npm run gate:dev -- -FeaturePath docs/features/example-feature
```

只有当功能文档包满足下面条件时，门禁才会通过：

- 需求状态是 `Ready`
- 未确认问题数量是 `0`
- 阻塞问题数量是 `0`
- 关键假设已被接受
- 用户已批准进入实现
- 实现计划已批准
- PRD、UI Spec、技术契约、验收标准、需求体检、实现计划都存在
- 功能文档中没有 `TODO`、`TBD`、`待确认`、`未确认`、`待补充`

如果门禁失败，不能进入代码实现阶段。

## 创建功能文档包

创建一个新的功能文档包：

```bash
npm run feature:new -- login-phone --stack next-fullstack
```

生成目录：

```text
docs/features/login-phone/
  01-prd.md
  02-ui-spec.md
  03-technical-contract.md
  04-acceptance-criteria.md
  05-readiness-review.md
  06-implementation-plan.md
```

新生成的功能包默认是草稿状态，必须填写并通过开发门禁后，才能进入代码实现。

允许的 Stack Preset：

- `next-fullstack`
- `flutter-fastapi`
- `flutter-express`
- `legacy-existing`

Next.js 新项目只支持 App Router，不支持 Pages Router。老项目使用 `legacy-existing`，并先补齐 `docs/legacy/BASELINE.md` 和 `docs/legacy/COMPATIBILITY_CONTRACT.md`。

## 创建产品迭代 Epic

一次产品迭代包含多个功能模块时，先创建 Epic：

```bash
npm run epic:new -- ai-fooler-upgrade
```

Epic 用于保存原始产品材料、拆分需求、标记风险、规划发布批次。Epic 通过门禁后，再拆成多个 feature：

```bash
npm run gate:epic -- -EpicPath docs/epics/ai-fooler-upgrade
npm run feature:new -- drag-upload-hint --stack legacy-existing --epic ai-fooler-upgrade
```

Epic 门禁通过只代表可以拆 feature，不代表可以写代码。代码实现仍然必须通过 feature 级开发门禁。

## 门禁回归测试

验证门禁没有失效：

```bash
npm run test:gates
```

这个命令会自动检查：

- 不完整功能包必须失败。
- Ready 功能包必须通过。
- 不完整 Epic 必须失败。
- Ready Epic 必须通过。

## 推荐流程

```text
需求包 -> 需求体检 -> 开发门禁 -> 实现计划 -> 实现 -> 测试 -> 验证报告 -> 上线判断
```

详细规则见：

- `docs/workflow/USER_GUIDE.md`
- `docs/workflow/WORKFLOW.md`
- `docs/workflow/EPIC_WORKFLOW.md`
- `docs/workflow/GATES.md`
- `AGENTS.md`
- `CLAUDE.md`

模板按职责分组：

- `docs/workflow/templates/feature`
- `docs/workflow/templates/epic`
- `docs/workflow/templates/legacy`
- `docs/workflow/templates/change`
- `docs/workflow/templates/decision`
