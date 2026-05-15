# Document Driven Workflow

这是一个面向 AI 研发协作的文档驱动工作流。它的核心目标是：用户用产品文档、UI 图和验收标准表达需求，AI 根据固定流程生成 Epic / Feature 文档、实现计划、代码、测试、验证报告和部署准备。

推荐对接方式：

```text
产品文档 + UI 参考 + 验收标准 -> 产品需求台账 -> Epic / Feature 文档 -> 用户一次批准 -> gate -> 实现 -> 测试 -> 追溯更新 + 验证报告
```

## 核心设计

- 工作流以 Codex / Claude Code 可使用的 Skill 形式分发。
- 目标项目只保存 `docs/` 下的项目文档，不需要把工作流脚本写进自己的 `package.json`。
- 每个 Epic 或 Feature 只有一个机器可读状态文件：`00-workflow.yaml`。
- 用户批准只发生一次，并且只记录在 `00-workflow.yaml`。
- 产品历史保存在 `docs/product/requirement-ledger.md`、`docs/product/traceability.md` 和必要的 snapshots 中。
- Feature 实现前必须通过门禁，门禁会检查 Scope Lock、TDD / debugging 触发条件、自审要求和验证证据。
- 可维护性默认规则：同类结构或逻辑出现 2 repeated uses 以上要考虑抽取；单文件尽量不超过 1000 lines；Next.js UI 优先使用 Tailwind CSS。

## 常用命令

维护本工作流仓库：

```bash
npm run check
npm run build
npm run setup:codex
npm run setup:claude
npm run setup:all
npm test
```

初始化目标项目的产品追溯层：

```bash
npm run workflow:init-product -- --target <project-root>
```

在本仓库中创建和检查文档包：

```bash
npm run epic:new -- <epic-id>
npm run epic:hydrate -- docs/epics/<epic-id>
npm run gate:epic -- docs/epics/<epic-id>
npm run epic:features -- docs/epics/<epic-id> --features feature-a,feature-b --stack next-fullstack

npm run feature:new -- <feature-id> --stack next-fullstack
npm run feature:new -- <feature-id> --mode light --stack next-fullstack
npm run feature:hydrate -- docs/features/<feature-id>
npm run workflow:context-pack -- docs/features/<feature-id> --force
npm run workflow:approve -- docs/features/<feature-id> --user-approved
npm run gate:dev -- docs/features/<feature-id>
```

目标项目中不需要配置这些 npm 命令。安装 Skill 后，由 AI 调用 Skill 内置脚本并传入 `--target <project-root>`。

## 参考文档

- `docs/workflow/WORKFLOW.md`
- `docs/workflow/MODE_ROUTER.md`
- `docs/workflow/GATES.md`
- `docs/workflow/AUTOMATION.md`
- `docs/workflow/EXECUTION_PROTOCOL.md`
- `docs/workflow/EXECUTION_DISCIPLINE.md`
- `docs/workflow/PRODUCT_TRACEABILITY.md`
- `docs/workflow/USAGE.md`
- `docs/workflow/STACK_POLICY.md`
- `docs/workflow/LEGACY_ADOPTION.md`
