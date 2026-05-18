---
name: "document-driven-workflow"
description: "Use when a project should be delivered from product documents, UI specs, acceptance criteria, Epic/Feature breakdown, readiness gates, legacy adoption, Maestro/Codex handoff, or AI-managed implementation evidence."
---

# Document Driven Workflow

使用本 Skill 时，把它当成“文档驱动交付流程”，不是项目模板。用户用产品文档、UI 图、验收标准表达需求；AI 负责生成或补全文档包、执行门禁、实现代码、跑测试并更新验证报告。

## 核心规则

- 复用脚本、门禁、模板和规则保存在 Skill 内部。
- 目标项目只保存项目自己的文档：`docs/epics`、`docs/features`、`docs/product`、`docs/legacy`、`docs/changes`、`docs/decisions`。
- 不要为了暴露工作流命令而修改目标项目的 `package.json`。
- 每个 Epic、Feature、Light Feature 只使用 `00-workflow.yaml` 作为机器可读状态源。
- 代码实现前必须通过对应 gate。
- 实现时遵守 `EXECUTION_DISCIPLINE.md`：Scope Lock、TDD / debugging 触发条件、自审、证据规则。
- 实现时考虑可维护性：出现 2 repeated uses 以上的重复结构或逻辑时考虑抽取；触碰的单文件尽量不超过 1000 lines；Next.js UI 优先使用 Tailwind CSS。
- 声称 Feature 完成前，必须运行 `completion-check.mjs` 或完成等价检查。
- 如果文档与代码现状冲突，先报告冲突和方案，不要直接改代码绕过文档。

## 执行顺序

1. 阅读 `references/MODE_ROUTER.md`，选择 Direct、Light、Standard、Epic 或 Strict。
2. 创建或 hydrate 最小安全文档包。
3. 按需要补全产品、UI、技术契约、验收、实现计划和验证文档。
4. 当存在明确需求 ID 时，同步 `docs/product/requirement-ledger.md` 和 `docs/product/traceability.md`。
5. 让用户审查文档包。
6. 只有用户明确批准后，才用 `approve.mjs` 或 `continue.mjs --user-approved` 写入批准状态。
7. 运行内置 gate。
8. gate 通过后，按已批准范围、`08-context-pack.md` 和 `EXECUTION_DISCIPLINE.md` 实现。
9. 完成自审、验证、产品追溯更新，并更新验证报告。
10. 声称完成前运行 `completion-check.mjs`，把结果作为交付证据。

## 推荐入口

优先让用户用自然语言触发工作流：

```text
使用 document-driven-workflow，处理这个需求文档，生成需要的 Epic / Feature 文档，等待我审查。
```

如果必须直接调用脚本，在 Skill 目录下运行，并传入 `--target <project-root>`：

- 处理需求：`node scripts/workflow/automation/process.mjs --source <requirement-file> --target <project-root> --stack <preset>`
- 批准后继续：`node scripts/workflow/automation/continue.mjs <docs/features/id|docs/epics/id> --target <project-root> --user-approved`
- 执行验证：`node scripts/workflow/automation/verify.mjs docs/features/<feature-id> --target <project-root>`
- 完成前检查：`node scripts/workflow/automation/completion-check.mjs docs/features/<feature-id> --target <project-root>`
- 环境体检：`node scripts/workflow/automation/doctor.mjs --target <project-root> --host all`

## Maestro 集成

当 Maestro 负责更大的 mission 时，本 Skill 仍然只处理单个目标项目：

1. `doctor.mjs --target <project-root> --json`：检查环境、Skill 安装和项目接入状态。
2. `status.mjs --target <project-root> --json`：生成项目状态快照，不运行 gate。
3. `handoff-pack.mjs docs/features/<feature-id> --target <project-root> --json`：生成 `HANDOFF_PACK.md` 和 `handoff-pack.json`，交给 Codex worker。
4. `completion-check.mjs docs/features/<feature-id> --target <project-root> --json`：Feature 完成前的机器可读门禁。

不要把本 Skill 当成多项目调度器。Maestro 负责 mission 状态、依赖、派发和跨项目集成证据；document-driven-workflow 负责单项目文档、门禁、验证和交接输入。

## Agent 选项

Hydrate 和生成类脚本支持：

- `--agent codex`：调用 Codex CLI。
- `--agent claude`：调用 Claude Code CLI。
- `--agent none`：只生成文档骨架，不调用 AI，主要用于测试。

默认值是 `codex`。可以用 `WORKFLOW_HYDRATE_AGENT=claude` 改成 Claude Code。

## 参考文档

- `references/WORKFLOW.md`：核心模型和文档包。
- `references/POSITIONING.md`：适合人群、优势、与 Superpowers 的区别。
- `references/MODE_ROUTER.md`：模式选择。
- `references/GATES.md`：硬门禁规则。
- `references/AUTOMATION.md`：自动化脚本边界。
- `references/MAESTRO_INTEGRATION.md`：Maestro 多项目编排集成方式。
- `references/EXECUTION_PROTOCOL.md`：门禁通过后的实现流程。
- `references/EXECUTION_DISCIPLINE.md`：Scope Lock、TDD / debugging、自审和证据规则。
- `references/PRODUCT_TRACEABILITY.md`：Requirement Ledger、Traceability Matrix 和 snapshots。
- `references/STACK_POLICY.md`：允许使用的 Stack Preset。
- `references/EPIC_WORKFLOW.md`：产品迭代拆分流程。
- `references/LEGACY_ADOPTION.md`：老项目接入流程。
- `references/USER_GUIDE.md` 和 `references/USAGE.md`：面向使用者的完整说明。
