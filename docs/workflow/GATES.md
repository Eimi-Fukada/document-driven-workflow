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

本仓库命令：

```bash
npm run gate:dev -- docs/features/<feature-id>
```

目标项目不需要本地 npm scripts。安装 Skill 后，AI 使用内置 gate 脚本并传入 `--target <project-root>`。

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
- 不包含未解决占位符，例如 `TODO`、`TBD`、`待确认`、`未确认`、`待补充`
- `stack_preset` 合法
- `next-fullstack` 使用 App Router，不能使用 Pages Router
- `legacy-existing` 必须已有 Legacy Baseline 和 Compatibility Contract
- Light Feature 不能使用 `legacy-existing`

## Epic Gate

本仓库命令：

```bash
npm run gate:epic -- docs/epics/<epic-id>
```

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

```bash
npm run workflow:approve -- docs/features/<feature-id> --user-approved
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
