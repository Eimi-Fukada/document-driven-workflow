# Document Driven Workflow

这是一套面向 AI 研发协作的文档驱动工作流。用户用产品文档、UI 图和验收标准表达需求，AI 把它结构化为 Epic / Feature 文档、实现计划、代码、测试、验证报告和产品追溯。

```text
产品文档 + UI 参考 + 验收标准
-> 产品需求台账
-> Epic / Feature 文档
-> 用户一次批准
-> gate
-> 实现
-> 测试
-> 追溯更新 + 验证报告
```

## 五分钟上手

安装 Skill 后，普通使用者不需要记脚本，也不需要修改目标项目的 `package.json`。在 Codex 或 Claude Code 里说：

```text
使用 document-driven-workflow，处理这个需求文档，生成需要的 Epic / Feature 文档，等待我审查。
```

审查通过后说：

```text
我已经批准这些文档。使用 document-driven-workflow 写入批准、运行门禁，并在通过后开始实现。
```

实现完成前说：

```text
使用 document-driven-workflow 执行验证和完成前检查，并更新验证报告。
```

## 核心设计

- 工作流以 Codex / Claude Code 可使用的 Skill 形式分发。
- 目标项目只保存自己的 `docs/` 交付文档，不复制 workflow scripts，也不修改自己的 `package.json`。
- 每个 Epic、Feature、Light Feature 只有一个机器可读状态文件：`00-workflow.yaml`。
- 用户批准只发生一次，并且只记录在 `00-workflow.yaml`。
- 产品历史保存在 `docs/product/requirement-ledger.md`、`docs/product/traceability.md` 和必要的 snapshots 中。
- Feature 实现前必须通过门禁；声称完成前必须通过完成前检查。
- 实现时遵守 Scope Lock、TDD / debugging 触发条件、自审、验证证据、性能、闭环和可维护性规则。
- 支持被 Maestro 驾驭：Maestro 负责多项目调度，workflow 负责单项目文档、门禁、验证和交接证据。

## 主要优势

- 中文产品文档优先：用户可以用需求文档、UI 图和验收标准沟通，不需要先把需求翻译成代码任务。
- 需求留痕完整：原始需求、Epic、Feature、验收标准、验证报告和追溯矩阵形成一条可回看的链路。
- 门禁刚性：未批准、需求 ID 缺失、验收标准不完整、范围不清楚或验证证据不足时，AI 不能直接进入实现或声称完成。
- 接入轻量：目标项目只保留自己的 `docs/` 交付文档，脚本、模板和门禁留在 Skill 内。
- 老项目友好：先建立 baseline 和 compatibility contract，再做功能迭代，避免 AI 在不了解现状时误改已有行为。
- Maestro 适配：提供 `doctor/status/handoff-pack/completion-check --json`，让 Maestro 稳定读取项目状态、派发 Feature 和收集完成证据。

## 适合谁

适合希望用中文产品文档、UI 图和验收标准驱动 AI 研发的人，尤其适合长期维护多个 Next.js 全栈项目、Flutter + Express / FastAPI 项目，或者需要把老项目逐步接入 AI 交付流程的团队。

它不追求替代所有工程方法论，而是把“产品需求结构化、批准、实现、验证、留痕”做成主流程。复杂 debugging、严格 TDD 和重型代码审查可以作为执行纪律补充，不应该让普通产品迭代被过重流程拖慢。

## 与 Superpowers 的区别

Superpowers 更强在工程执行纪律：系统化 debugging、严格 TDD、代码审查、多 agent 执行和分支收尾。

本工作流更强在产品交付主链路：从原始需求进入，生成 Epic / Feature，用户一次批准，gate 后实现，最后用验证报告和 traceability 留下证据。

如果你的目标是“让 AI 按产品需求完成全链路交付”，本工作流应该做主流程；Superpowers 中有价值的工程纪律可以被轻量吸收到实现阶段。

## 文档索引

- 使用者概念和分层：`docs/workflow/USER_GUIDE.md`
- 维护者命令和脚本：`docs/workflow/USAGE.md`
- 核心流程：`docs/workflow/WORKFLOW.md`
- 门禁规则：`docs/workflow/GATES.md`
- 自动化边界：`docs/workflow/AUTOMATION.md`
- Maestro 集成：`docs/workflow/MAESTRO_INTEGRATION.md`
- 技术栈策略：`docs/workflow/STACK_POLICY.md`
- 老项目接入：`docs/workflow/LEGACY_ADOPTION.md`
