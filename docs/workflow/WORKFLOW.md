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

Feature 进入实现前：

```bash
npm run gate:dev -- docs/features/<feature-id>
```

Epic 拆分为可执行 Feature 前：

```bash
npm run gate:epic -- docs/epics/<epic-id>
```

目标项目不应该把这些脚本加入自己的 `package.json`。安装 Skill 后，AI 使用 Skill 内置脚本并传入 `--target <project-root>`。

## Execution Discipline

Feature gate 通过后，实现必须遵守 `EXECUTION_DISCIPLINE.md`。

Standard 和 Strict Feature 的实现交接上下文来自：

- `06-implementation-plan.md`
- `08-context-pack.md`

实现 agent 必须遵守 Scope Lock；当触发条件成立时使用 TDD 或 systematic debugging；完成前执行 self review；声称完成前记录新的验证证据。

同时要遵守可维护性规则：当结构或逻辑出现 2 or more times 时考虑抽取；触碰的单文件尽量保持在 1000 lines 以下；新的 Next.js UI 样式优先使用 Tailwind CSS。

## Completion Check

Feature 实现和验证后，AI 不能只凭口头总结声称完成。完成前需要运行：

```bash
node scripts/workflow/automation/completion-check.mjs docs/features/<feature-id> --target <project-root>
```

它会检查需求 ID 覆盖、验收覆盖、验证报告、变更文件映射、禁止范围、可维护性和产品追溯。通过后生成 `COMPLETION_CHECK.md`，作为验证报告之外的完成证据。

## Stack Policy

新项目必须选择 `STACK_POLICY.md` 里的标准 Stack Preset。

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
