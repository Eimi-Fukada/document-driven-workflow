# Gates

本工作流使用硬门禁。gate 失败时，AI 必须停在文档阶段，报告缺失项或阻塞项，不能开始实现。

## 单一状态来源

每个 Epic、Feature、Light Feature 都有一个机器可读控制文件：

```text
00-workflow.yaml
```

所有批准和可开发状态都放在这里。其他 Markdown 文件只保存产品或交付内容。

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

## Feature Gate

Feature gate 使用 Skill 内置脚本：

```bash
node scripts/workflow/feature/gate-feature.mjs docs/features/<feature-id> --target <project-root>
```

维护本仓库时可以用 `npm run gate:dev -- docs/features/<feature-id>` 简化调用。目标项目不需要本地 npm scripts。

Standard 和 Strict Feature 必须包含：

```text
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

Light Feature 必须包含：

```text
00-workflow.yaml
01-light-feature.md
```

gate 还会检查：

- 至少一个 `REQ-*` 需求引用
- 至少一个 `AC-*` 验收项
- Requirement Intake Review 中包含清楚项、缺失项、风险和用户问题
- Context Pack 中包含 requirement IDs 和 test commands
- 实现交接中包含 Scope Lock 和 execution discipline 字段
- 可维护性规则：reuse threshold、1000-line file limit、Tailwind CSS preference for Next.js UI
- 性能和闭环规则：Performance Guardrails、Option And Closure Notes
- 不包含未解决占位符，例如 `TODO`、`TBD`、`待确认`、`未确认`、`待补充`
- `stack_preset` 合法
- `next-fullstack` 使用 App Router，不能使用 Pages Router
- `legacy-existing` 必须已有 Legacy Baseline 和 Compatibility Contract
- Light Feature 不能使用 `legacy-existing`

## Epic Gate

Epic gate 使用 Skill 内置脚本：

```bash
node scripts/workflow/epic/gate-epic.mjs docs/epics/<epic-id> --target <project-root>
```

维护本仓库时可以用 `npm run gate:epic -- docs/epics/<epic-id>` 简化调用。目标项目不需要本地 npm scripts。

Epic 必须包含：

```text
00-workflow.yaml
00-source.md
01-epic-brief.md
02-requirement-inventory.md
03-scope-breakdown.md
04-risk-map.md
05-release-plan.md
06-acceptance-map.md
07-progress-board.md
```

Epic gate 表示 Epic 已经可以拆分为 Feature。它不授权代码实现。代码实现仍然要求每个 Feature 通过自己的 gate。

## 批准

用户对每个 Epic 或 Feature 只批准一次。批准只写入 `00-workflow.yaml`。

用户批准时同时确认模式和风险边界。AI 可以在文档里给出初判，但最终执行只看 `00-workflow.yaml`：

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

approve 命令没有 `--user-approved` 时会拒绝运行。

## Gate Failure

gate 失败时，AI 必须返回：

- 缺失文件
- 未解决问题
- 阻塞问题
- 仍需用户确认的假设
- 下一步仅限文档阶段的动作

AI 不能绕过 gate 去写实现代码。

## Completion Gate

Feature 实现和验证后，AI 声称“完成”前必须运行唯一完成出口：

```bash
node scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root>
```

如果需要和某个基线分支比较：

```bash
node scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root> --base origin/main
```

如果当前改动已经提交，或者目标项目没有 git，可以显式传入变更文件：

```bash
node scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root> --changed-files "src/app/page.tsx,src/lib/demo.ts"
```

Maestro 或其他编排器需要机器可读结果时使用：

```bash
node scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root> --json
```

`finish-feature.mjs` 会依次运行：

- Feature gate。
- 验证命令。
- completion-check。
- 写入 `COMPLETION_PROOF.json`。
- 最后写入 `00-workflow.yaml` 的 `status: verified`。

底层 `completion-check.mjs` 检查：

- Feature gate 仍然通过。
- `07-verification-report.md` 或 Light Feature 验证区包含所有 `REQ-*` 和 `AC-*` 的证据。
- 如果 `04-acceptance-criteria.md` 启用了 Coverage Matrix，验证报告必须包含每个 `COV-*` 的实现证据、验证证据和 Passed 状态。
- 验证报告包含新的命令输出或明确人工验证证据。
- 验证报告不再保留 `Not Tested`。
- 结果为 `Passed` 或 `Ready to release: yes`。
- 所有变更文件都映射到需求或测试证据。
- 变更文件没有命中文档中的 forbidden scope。
- 如有明确 allowed scope，代码变更不能超出 allowed scope。
- 超过 1000 lines 的触碰文件必须在验证报告中解释抽取或暂缓原因。
- 如果 Feature 文档命中性能风险，验证报告必须包含 Performance Review 和具体性能验证证据。
- 如果 Feature 文档命中闭环风险，验证报告必须记录 Closure Review 和用户提醒处理。
- 如果 Feature 文档要求方案选择，验证报告必须记录最终选择证据。
- `docs/product/traceability.md` 更新状态必须写明 `yes` 或 `not-applicable`。

finish-feature 失败时，AI 不能声称完成，只能继续补验证、修实现或回到文档阶段修正范围。

Completion gate 只判断单个 Feature 是否具备完成证据。跨项目联调、接口兼容和集成验收属于 Maestro 或其他上层编排器的职责，不应该被塞进单个 Feature 的完成状态里。

## Coverage Matrix Gate

一个 Feature 仍然可以包含多个模块、页面、工具、状态或接口，只要它们属于同一个业务闭环。为了防止 AI 只实现第一批内容就报告完成，这类 Feature 必须在 `04-acceptance-criteria.md` 中启用 Coverage Matrix：

```text
- Coverage required: yes
- Expected coverage items: 11
```

每个覆盖项使用 `COV-*` ID，并映射到 `REQ-*` 和 `AC-*`。完成时，`07-verification-report.md` 的 `Coverage Matrix Verification` 必须逐项填写实现证据、验证证据和 `Passed` 状态。

覆盖项很多时，允许实现 agent 按 3-5 个一批推进；这只是执行批次，不是降低验收范围。`finish-feature.mjs` 只有在全部 `COV-*` 覆盖项通过后才会允许该 Feature 完成。

## 假完成状态

`00-workflow.yaml` 中的 `status: verified` 不能单独作为完成依据。它只是状态字段，可能被人或 AI 手动修改。

真正的完成依据是：

- `finish-feature.mjs` 返回 `PASS`。
- `COMPLETION_PROOF.json` 记录 `result: PASS`。
- 验证报告包含当前 Feature 的 REQ / AC、变更文件、测试或人工验证证据。

如果 `status: verified` 但没有 `COMPLETION_PROOF.json` 的 PASS 证明，Maestro、status 快照和后续 AI 都应把它视为未完成或验证阻塞，而不是可发布状态。

## 单 Feature 闭环

Epic 批准或多个 Feature 同时准备就绪，不代表可以批量实现后统一验收。

正式执行时必须：

1. 选择一个 Feature。
2. 生成或读取该 Feature 的 handoff pack。
3. 运行 Feature gate。
4. 实现该 Feature。
5. 更新该 Feature 的 `07-verification-report.md`。
6. 运行该 Feature 的 finish-feature。
7. finish-feature 通过并写入 `COMPLETION_PROOF.json` 后，才开始下一个 Feature。

如果某个 Feature 的实现需要偏离推荐方案、采用已拒绝方案、扩大 allowed scope 或降低验收标准，必须先回到文档阶段更新 Feature 文档并获得用户确认。
