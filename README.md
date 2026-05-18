# Document Driven Workflow

这是一个面向 AI 研发协作的文档驱动工作流。用户用产品文档、UI 图和验收标准表达需求，AI 根据固定流程生成 Epic / Feature 文档、实现计划、代码、测试、验证报告和部署准备。

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
- Feature 实现前必须通过门禁。
- 实现时遵守 Scope Lock、TDD / debugging 触发条件、自审、验证证据和可维护性规则。
- 声称完成前必须通过完成前检查，确认需求覆盖、测试证据、验证报告、变更文件映射、禁止范围和产品追溯。

## 适合谁

这套工作流适合希望用中文产品文档、UI 图和验收标准驱动 AI 研发的人，尤其适合长期维护多个 Next.js 全栈项目、Flutter + Express / FastAPI 项目，或者需要把老项目逐步接入 AI 交付流程的团队。

它不追求替代所有工程方法论，而是把“产品需求结构化、批准、实现、验证、留痕”做成主流程。复杂 debugging、严格 TDD 和重型代码审查可以作为执行纪律补充，不应该让普通产品迭代被过重流程拖慢。

## 与 Superpowers 的区别

Superpowers 更强在工程执行纪律：系统化 debugging、严格 TDD、代码审查、多 agent 执行和分支收尾。

本工作流更强在产品交付主链路：从原始需求进入，生成 Epic / Feature，用户一次批准，gate 后实现，最后用验证报告和 traceability 留下证据。

如果你的目标是“让 AI 按产品需求完成全链路交付”，本工作流应该做主流程；Superpowers 中有价值的工程纪律可以被轻量吸收到实现阶段。

## 用户怎么用

普通项目使用者不需要记脚本，也不需要修改目标项目的 `package.json`。安装 Skill 后，在 Codex 或 Claude Code 里直接说：

```text
使用 document-driven-workflow，处理这个需求文档，生成需要的 Epic / Feature 文档，等待我审查。
```

批准后继续：

```text
我已经批准这些文档。使用 document-driven-workflow 继续运行门禁并开始实现。
```

实现完成后验证：

```text
使用 document-driven-workflow 执行这个 Feature 的验证，并更新验证报告。
```

## 维护者命令

下面命令只用于维护本工作流仓库，不要求目标项目配置这些 npm scripts。

```bash
npm run check
npm run build
npm run setup:codex
npm run setup:claude
npm run setup:all
npm test
```

如果维护者需要直接调用 Skill 内置脚本，可以在本仓库或安装后的 Skill 目录中运行：

```bash
node scripts/workflow/automation/process.mjs --source docs/requirements/example.md --target <project-root> --stack next-fullstack
node scripts/workflow/automation/continue.mjs docs/features/<feature-id> --target <project-root> --user-approved
node scripts/workflow/automation/verify.mjs docs/features/<feature-id> --target <project-root>
node scripts/workflow/automation/completion-check.mjs docs/features/<feature-id> --target <project-root>
node scripts/workflow/automation/doctor.mjs --target <project-root> --host all
```

## Agent 支持

Hydrate 类脚本支持：

- `--agent codex`：使用 Codex CLI。
- `--agent claude`：使用 Claude Code CLI。
- `--agent none`：只生成文档骨架，不调用 AI，主要用于测试。

默认使用 `codex`。可以通过 `WORKFLOW_HYDRATE_AGENT=claude` 改成 Claude Code。

## 参考文档

- `docs/workflow/WORKFLOW.md`
- `docs/workflow/POSITIONING.md`
- `docs/workflow/MODE_ROUTER.md`
- `docs/workflow/GATES.md`
- `docs/workflow/AUTOMATION.md`
- `docs/workflow/EXECUTION_PROTOCOL.md`
- `docs/workflow/EXECUTION_DISCIPLINE.md`
- `docs/workflow/PRODUCT_TRACEABILITY.md`
- `docs/workflow/USAGE.md`
- `docs/workflow/STACK_POLICY.md`
- `docs/workflow/LEGACY_ADOPTION.md`
