# Document Driven Workflow

本仓库定义一套 AI 优先的文档驱动交付流程。用户提供产品文档、UI 参考和验收标准；AI 把这些输入转成实现计划、代码、测试、验证报告和部署准备。

## 核心模型

默认选择“足够安全的最轻流程”：

1. Direct：极小的文档或命令类工作。
2. Light：低风险、单一范围的小改动。
3. Standard：可以独立开发和测试的普通功能。
4. Epic：跨多个模块或多个发布批次的产品迭代，需要先拆成多个 Feature。
5. Strict：认证、支付、权限、数据库、任务状态、部署、迁移、老项目核心行为或其他高风险工作。

选择路径前先读 `MODE_ROUTER.md`。

## 状态模型

每个 Epic 或 Feature 只有一个工作流控制文件：

```text
00-workflow.yaml
```

这里是唯一机器可读来源，包含：

- approval
- readiness
- status
- stack preset
- unresolved question count
- blocking issue count
- assumption acceptance

Markdown 文档负责描述产品意图、范围、计划和验证，不保存批准状态。

## 文档包

产品历史层：

```text
docs/product/
  requirement-ledger.md
  traceability.md
  snapshots/
```

这一层记录原始需求来源、需求到交付的追溯关系，以及已批准范围的快照，避免后续迭代把原始产品意图覆盖掉。

- Requirement Ledger：`docs/product/requirement-ledger.md`
- Traceability Matrix：`docs/product/traceability.md`

Light Feature：

```text
docs/features/<feature-id>/
  00-workflow.yaml
  01-light-feature.md
```

Standard 或 Strict Feature：

```text
docs/features/<feature-id>/
  00-workflow.yaml
  REVIEW.md
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

Epic：

```text
docs/epics/<epic-id>/
  00-workflow.yaml
  REVIEW.md
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

## 批准

用户对每个 Epic 或 Feature 只批准一次。批准只写入 `00-workflow.yaml`。

AI 可以生成草稿、补全文档、整理问题，但不能在 gate 通过前开始代码实现。

## Gates

Feature 进入实现前使用 Skill 内置脚本：

```bash
node scripts/workflow/feature/gate-feature.mjs docs/features/<feature-id> --target <project-root>
```

Epic 拆分为可执行 Feature 前使用 Skill 内置脚本：

```bash
node scripts/workflow/epic/gate-epic.mjs docs/epics/<epic-id> --target <project-root>
```

维护本仓库时可以用 `package.json` 里的 npm scripts 简化调用。目标项目不应该把这些脚本加入自己的 `package.json`。

## Execution Discipline

Feature gate 通过后，实现必须遵守 `EXECUTION_DISCIPLINE.md`。

Standard 和 Strict Feature 的实现交接上下文来自：

- `06-implementation-plan.md`
- `08-context-pack.md`

实现 agent 必须遵守 Scope Lock；当触发条件成立时使用 TDD、systematic debugging、性能纪律和方案/闭环提醒；完成前执行 self review；声称完成前记录新的验证证据。

同时要遵守可维护性规则：当结构或逻辑出现 2 or more times 时考虑抽取；触碰的单文件尽量保持在 1000 lines 以下。具体框架规则以当前 Feature 的 Stack Preset 为准，例如 Next.js 的 App Router、Tailwind CSS 和 Playwright 要求写在 `presets/next-fullstack.md`。

用户批准进入开发不等于允许自由落地。实现 agent 一次只能执行一个 Feature，并且必须在开工前重新锁定 `08-context-pack.md`、`04-acceptance-criteria.md` 和 `06-implementation-plan.md`。

如果最快实现路径会偏离推荐方案、采用 rejected/fallback 方案、扩大 allowed scope、降低验收标准或只完成部分保护，必须先停下来让用户确认并更新文档，不能先实现后解释。

## Completion Check

Feature 实现和验证后，AI 不能只凭口头总结声称完成。正式完成只能通过唯一完成出口：

```bash
node scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root>
```

它会依次运行 Feature gate、验证命令、completion-check，检查需求 ID 覆盖、验收覆盖、验证报告、变更文件映射、禁止范围、可维护性、性能风险、闭环风险和产品追溯。通过后生成 `COMPLETION_PROOF.json`，并由脚本写入 `status: verified`。

`completion-check.mjs` 是底层检查，不是正式完成出口。`00-workflow.yaml` 里的 `status: verified` 不能单独证明完成。真正完成以 `finish-feature.mjs` 返回 PASS 和 `COMPLETION_PROOF.json` 为准。没有完成证明时，不能开始下一个 Feature，也不能交给 Maestro 关闭任务。

## Maestro Integration

当需要一次驾驭多个项目时，Maestro 负责 mission、依赖、派发、跨项目状态和集成验收。本工作流只负责单个项目的需求结构化和交付证据。

Maestro 可使用这些机器接口：

```bash
node scripts/workflow/automation/doctor.mjs --target <project-root> --json
node scripts/workflow/automation/status.mjs --target <project-root> --json
node scripts/workflow/automation/handoff-pack.mjs docs/features/<feature-id> --target <project-root> --json
node scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root> --json
```

跨项目接口和联调验收使用 `templates/contracts/project-contract.md` 与 `templates/contracts/integration-contract.md`，不要让单个 Feature 承担多项目编排职责。

## Stack Policy

新项目优先选择 `STACK_POLICY.md` 里的内置 Stack Preset。没有内置 preset 的技术栈可以使用自定义 `stack_preset`，工作流不应因为 Java、Go、Python、Rust 或其他语言没有内置规则而阻断文档驱动流程。

- `next-fullstack` 只使用 Next.js App Router。
- `flutter-fastapi` 是 Flutter 独立后端默认预设。
- `flutter-express` 仅在有明确理由时使用。
- `legacy-existing` 必须先建立 baseline 和 compatibility contract。

## 变更流程

修改已有行为必须创建 `docs/changes/CR-xxxx.md`。不要靠零散对话覆盖旧需求。

变更请求影响范围后，更新对应 Epic 或 Feature 文档，再重新运行 gate。

## Traceability

长期产品历史使用 `PRODUCT_TRACEABILITY.md` 中定义的模型。目标项目应维护：

- `docs/product/requirement-ledger.md`：原始来源记录
- `docs/product/traceability.md`：来源到测试覆盖的关系
- `docs/product/snapshots/`：已批准 Epic 或大型 Feature 的范围快照
