---
name: "document-driven-workflow"
description: "Use when a project should be delivered from product documents, UI specs, acceptance criteria, Epic/Feature breakdown, readiness gates, legacy adoption, or AI-managed implementation handoff."
---

# Document Driven Workflow

使用本 Skill 时，把它当成“文档驱动交付流程”，不是项目模板。用户用产品文档、UI 图、验收标准表达需求；AI 负责生成或补全文档包、执行门禁、实现代码、跑测试并更新验证报告。

## 核心规则

- 复用脚本、门禁、模板和规则保存在 Skill 内部。
- 目标项目（target project）只保存项目自己的文档：`docs/epics`、`docs/features`、`docs/product`、`docs/legacy`、`docs/changes`、`docs/decisions`。
- 不要为了暴露工作流命令而修改目标项目的 `package.json`。
- 代码实现前必须通过对应的内置 gate。
- 实现时遵守 `EXECUTION_DISCIPLINE.md`：Scope Lock、TDD / debugging 触发条件、自审、证据规则。
- 实现时遵守可维护性规则：出现 2 repeated uses 以上的重复结构或逻辑时考虑抽取；触碰的单文件尽量不超过 1000 lines；Next.js UI 优先使用 Tailwind CSS。
- 如果文档与代码现状冲突，先报告冲突和可选方案，不要直接改代码绕过文档。

## 工作流状态

每个 Epic、Feature、Light Feature 只有一个机器可读状态文件：

```text
00-workflow.yaml
```

批准状态、可开发状态、当前状态、技术栈预设、未解决问题数、阻塞问题数、假设是否接受，都只记录在这里。

Markdown 文档只描述产品意图、范围、计划和验证，不再保存独立批准字段。

## 执行顺序

1. 阅读 `references/MODE_ROUTER.md`，选择 Direct、Light、Standard、Epic 或 Strict。
2. 创建或 hydrate 最小安全文档包。
3. 按需要补全产品、UI、技术契约、验收、实现计划和验证文档。
4. 当存在明确需求 ID 时，同步 `docs/product/requirement-ledger.md` 和 `docs/product/traceability.md`。
5. 让用户审查文档包。
6. 只有用户明确批准后，才用 `approve.mjs` 写入批准状态。
7. 运行内置 gate。
8. gate 通过后，按已批准范围、`08-context-pack.md` 和 `EXECUTION_DISCIPLINE.md` 实现。
9. 完成自审、验证、产品追溯更新，并更新验证报告。

## 直接脚本调用

在 Skill 目录下运行脚本，并传入 `--target <project-root>`：

- 路由评审：`node scripts/workflow/automation/route.mjs --source <requirement-file> --target <project-root>`
- 初始化产品追溯：`node scripts/workflow/product/init-product.mjs --target <project-root>`
- 批准前检查：`node scripts/workflow/automation/approval-review.mjs <docs/features/id|docs/epics/id> --target <project-root>`
- 写入批准：`node scripts/workflow/automation/approve.mjs <docs/features/id|docs/epics/id> --target <project-root> --user-approved`
- 生成 Context Pack：`node scripts/workflow/automation/context-pack.mjs docs/features/<feature-id> --target <project-root> --force`
- Feature gate：`node scripts/workflow/feature/gate-feature.mjs docs/features/<feature-id> --target <project-root>`
- Epic gate：`node scripts/workflow/epic/gate-epic.mjs docs/epics/<epic-id> --target <project-root>`
- Light Feature：`node scripts/workflow/feature/new-feature.mjs <feature-id> --mode light --target <project-root> --stack <preset>`
- Feature hydrate：`node scripts/workflow/feature/hydrate-feature.mjs docs/features/<feature-id> --target <project-root>`
- Epic hydrate：`node scripts/workflow/epic/hydrate-epic.mjs docs/epics/<epic-id> --target <project-root>`
- Epic 拆分 Feature：`node scripts/workflow/epic/create-features.mjs docs/epics/<epic-id> --target <project-root> --features feature-a,feature-b --stack <preset>`
- Agent Plan：`node scripts/workflow/automation/agent-plan.mjs docs/epics/<epic-id> --target <project-root> --features feature-a,feature-b`

## 参考文档

- `references/WORKFLOW.md`：核心模型和文档包
- `references/MODE_ROUTER.md`：模式选择
- `references/GATES.md`：硬门禁规则
- `references/AUTOMATION.md`：自动化脚本边界
- `references/EXECUTION_PROTOCOL.md`：门禁通过后的实现流程
- `references/EXECUTION_DISCIPLINE.md`：Scope Lock、TDD / debugging、自审和证据规则
- `references/PRODUCT_TRACEABILITY.md`：Requirement Ledger、Traceability Matrix 和 snapshots
- `references/STACK_POLICY.md`：允许使用的 Stack Preset
- `references/EPIC_WORKFLOW.md`：产品迭代拆分流程
- `references/LEGACY_ADOPTION.md`：老项目接入流程
- `references/USER_GUIDE.md` 与 `references/USAGE.md`：面向使用者的完整说明
