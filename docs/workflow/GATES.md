# Gates

本工作流使用硬门禁。Gate 失败时，AI 必须停在文档阶段，报告缺失项或阻塞项，不能开始实现。

## 单一状态来源

每个 Epic、Feature、Light Feature 都只有一个机器可读控制文件：

```text
00-workflow.yaml
```

所有批准状态、可开发状态和执行状态都放在这里。`REVIEW.md`、PRD、readiness review、agent plan 等 Markdown 文件只保存产品、审核、交付和追溯内容，不保存独立批准状态。

进入实现需要满足：

```yaml
approval: approved
route_decision: user_confirmed
risk_level: low | medium | high
readiness: ready
unresolved_questions: 0
blocking_issues: 0
assumptions_accepted: true
```

从已批准 Epic 生成的 Feature 可以使用：

```yaml
approval: inherited
approval_source: docs/epics/<epic-id>
```

## Review Summary Gate

`REVIEW.md` 是用户默认审核入口，不是批准文件（not approval）。Gate 会检查它是否已经把用户最需要看的信息补齐：

- 需求摘要。
- 本次不做什么。
- 风险等级。
- 预计耗时。
- 是否需要拆分执行。
- 方案选择。
- 验收表。
- 覆盖矩阵。

用户只需要审查摘要和必要细节，批准状态仍只通过 Skill 内置批准脚本写入 `00-workflow.yaml`。

## Feature Gate

Feature gate 使用 Skill 内置脚本：

```bash
node scripts/workflow/feature/gate-feature.mjs docs/features/<feature-id> --target <project-root>
```

维护本仓库时可以使用 npm scripts。目标项目不需要本地 npm scripts，也不要为了工作流修改自己的 `package.json`。

Standard 和 Strict Feature 必须包含：

```text
00-workflow.yaml
REVIEW.md
00-intake-review.md
01-prd.md
02-ui-spec.md
03-technical-contract.md
04-acceptance-criteria.md
05-readiness-review.md
06-implementation-plan.md
08-context-pack.md
```

Light Feature 必须包含：

```text
00-workflow.yaml
REVIEW.md
01-light-feature.md
```

gate 还会检查：

- 至少一个 `REQ-*` 需求引用。
- 至少一个 `AC-*` 验收项。
- `REVIEW.md` 已填实风险、耗时、拆分、方案和验收摘要。
- Context Pack 包含 requirement IDs 和 test commands。
- 实现交接包含 Scope Lock 和 execution discipline。
- 可维护性规则：reuse threshold、1000-line file limit。
- Stack Preset 规则：当前技术栈的框架、样式、API、测试和部署边界。
- 性能和闭环规则：Performance Guardrails、Option And Closure Notes。
- 不包含未解决占位符，例如 `TODO`、`TBD`、`unset`、`REQ-AREA-001`、`AC-AREA-001`。
- `stack_preset` 使用小写字母、数字和 hyphen；内置 preset 触发专属规则，custom stack 只要求技术契约和验证证据完整。
- `next-fullstack` 使用 App Router，不能使用 Pages Router。
- `legacy-existing` 必须已有 Legacy Baseline 和 Compatibility Contract。
- Light Feature 不能使用 `legacy-existing`。

## Performance Review

当需求命中大表查询、子查询、聚合、长列表、大文件、轮询、批处理、队列、并发写入、缓存、索引、分页或虚拟滚动等场景时，不能把性能风险写成 `not-applicable`。

Feature 文档必须写清：

- `Performance Guardrails`
- 风险触发点。
- 采用的缓解方案。
- 验证方式。

## Option Deviation Gate

当文档中存在多个实现方案时，必须有明确的 `Selected option`。

如果实现要使用 rejected option 或 fallback option，AI 必须先暂停，让用户修改文档或明确确认。完成时 `completion-check.mjs` 会检查选中方案、偏离原因和验证证据。

## Coverage Matrix Gate

当一个 Feature 覆盖多个模块、页面、工具、状态、API 或枚举项时，必须使用覆盖矩阵。

文档中应写清：

- `Expected coverage items`
- 每个 `COV-*` 覆盖项。
- 对应的 `REQ-*` 和 `AC-*`。
- 实现证据、验证证据和状态。

只有所有覆盖项都有证据并通过，Feature 才能完成。

## Epic Gate

Epic gate 使用 Skill 内置脚本：

```bash
node scripts/workflow/epic/gate-epic.mjs docs/epics/<epic-id> --target <project-root>
```

Epic 必须包含：

```text
00-workflow.yaml
00-source.md
REVIEW.md
01-epic-brief.md
02-requirement-inventory.md
03-scope-breakdown.md
04-risk-map.md
05-release-plan.md
06-acceptance-map.md
07-progress-board.md
```

Epic gate 表示 Epic 已经可以拆分为 Feature。它不授权代码实现。代码实现仍要求每个 Feature 通过自己的 gate。

## 批准

用户对每个 Epic 或 Feature 只批准一次。批准只写入 `00-workflow.yaml`。

用户批准时同时确认模式、风险边界和执行拆分。AI 可以在文档里给出初判，但最终执行只看 `00-workflow.yaml`：

```yaml
route_decision: user_confirmed
risk_level: low | medium | high
hard_risk_blockers: none
expected_runtime: under_30m | 30_90m | over_90m
execution_slicing: not_required | recommended | required
```

如果 `hard_risk_blockers` 不是 `none`，Feature 必须使用 `strict` mode。除此之外，用户可以基于 AI 初判选择保持、降级、升级或拆分，不需要在多个 Markdown 文件里改批准状态。

目标项目通过 Skill 内置脚本执行：

```bash
node scripts/workflow/automation/approve.mjs docs/features/<feature-id> --target <project-root> --user-approved
```

也可以让 AI 使用 `continue.mjs` 一次性批准并运行 gate。

## Completion Gate

实现完成前，不能只用 `build`、`typecheck` 或 `lint` 作为完成信号。它们只是验证证据。

唯一完成出口是：

```bash
node scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root>
```

`completion-check.mjs` 是诊断和 evidence 检查的一部分，但不能替代 `finish-feature.mjs`。

Feature 完成必须满足：

- `07-verification-report.md` 或 Light Feature 验证区包含所有 `REQ-*` 和 `AC-*` 的证据。
- 变更文件能映射到需求或验收。
- 允许范围和禁止范围没有被破坏。
- 测试命令已执行或明确记录无法执行原因。
- 性能风险、闭环风险、方案偏离和覆盖矩阵已处理。
- 生成 `COMPLETION_PROOF.json`。
- `00-workflow.yaml` 的 `status` 由 `finish-feature.mjs` 写成 `verified`。
- 更新 `docs/product/traceability.md` 或明确记录 not-applicable。

手动把 `00-workflow.yaml` 标成 `verified` 不算完成。`status.mjs` 会把这种情况标记为 `manifest_verified_without_proof`。

也就是说，仅出现下面状态不是完成证据：

```yaml
status: verified
```

Maestro 或其他调度器需要机器可读状态时，应使用 `--json`：

```bash
node scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root> --json
node scripts/workflow/automation/status.mjs --target <project-root> --json
```
