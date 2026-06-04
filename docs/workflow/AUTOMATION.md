# 自动化

自动化用来减少重复手工操作，但不替代用户批准。

## 边界

自动化可以：

- 检查本机 Skill、AI CLI、目标项目文档结构和老项目接入状态。
- 在目标项目 `AGENTS.md` 写入持久工作流约束，避免后续对话绕过 document-driven-workflow。
- 推荐 Direct、Light、Standard、Epic 或 Strict mode，并把模式/风险作为 AI 初判交给用户确认。
- 初始化产品追溯文件。
- 创建或 hydrate Epic 和 Feature 文档。
- 生成批准前检查报告。
- 生成 Feature context pack。
- 通过 gate 和验证报告约束 Feature execution discipline。
- 把用户明确批准写入 `00-workflow.yaml`。
- 生成 Epic agent plan。
- 运行硬门禁。
- 通过唯一完成出口检查验证证据、变更文件映射、禁止范围、可维护性、性能风险和闭环风险，并写入完成证明。
- 为 Maestro 输出机器可读状态、Feature 交接包和完成前检查结果。

自动化不能：

- 自己批准需求。
- gate 失败时开始代码实现。
- 在存在客观硬风险时把工作降级成 Light 或 Standard。
- 因为 AI 不确定就强制把简单需求推入重流程。
- 为了暴露工作流命令而修改目标项目 `package.json`。
- 自动启动多个 agent 写代码。
- 替代 Maestro 做多项目 mission、依赖调度或跨项目联调验收。

## 主入口

普通使用者优先通过自然语言触发这些能力。维护者直接调试时，优先使用主入口。

| Script | 用途 | 是否写文件 | 是否需要明确批准 |
| --- | --- | --- | --- |
| `adopt.mjs` | 把 document-driven-workflow 持久接入目标项目 `AGENTS.md` | yes，维护 marker block | no |
| `doctor.mjs` | 体检 Skill 安装、CLI、目标项目接入和文档结构 | yes，`DOCTOR_REPORT.md` | no |
| `process.mjs` | 从需求来源编排路由、建包、hydrate 和批准前检查 | yes，文档包和 `APPROVAL_REVIEW.md` | no |
| `continue.mjs` | 用户批准后运行 gate，并准备下一阶段上下文 | yes | yes，当需要写入批准时 |
| `verify.mjs` | 执行文档里的验证命令并写回验证报告 | yes，`07-verification-report.md` | no |
| `finish-feature.mjs` | 唯一完成出口，依次运行 gate、verify、completion-check，写入完成证明和 verified 状态 | yes，`COMPLETION_PROOF.json` | no |
| `completion-check.mjs` | 底层完成检查，检查需求覆盖、Coverage Matrix、验证证据、diff、可维护性和追溯 | yes，`COMPLETION_CHECK.md` | no |
| `status.mjs` | 输出 Epic / Feature 状态快照，给人或 Maestro 判断下一步 | yes，`STATUS_REPORT.md`；`--json` 时可只输出 JSON | no |
| `handoff-pack.mjs` | 生成单个 Feature 的实现交接包和机器可读 worker 输入 | yes，`HANDOFF_PACK.md` 和 `handoff-pack.json` | no |

## 高级脚本

这些脚本是主入口背后的组成部分，主要用于调试、局部重跑或维护工作流本身。

| Script | 用途 | 是否写文件 | 是否需要明确批准 |
| --- | --- | --- | --- |
| `route.mjs` | 生成路由评审 | yes，`ROUTING_REVIEW.md` | no |
| `approval-review.mjs` | 检查文档是否可以提交用户批准 | yes，`APPROVAL_REVIEW.md` | no |
| `approve.mjs` | 把批准写入 `00-workflow.yaml` | yes | yes，`--user-approved` |
| `context-pack.mjs` | 生成紧凑实现交接上下文 | yes，`08-context-pack.md` | no |
| `agent-plan.mjs` | 生成 Epic agent 分工 | yes，`09-agent-plan.md` | 计划阶段 no；执行前 yes |
| `init-product.mjs` | 创建产品台账、追溯矩阵和 snapshot 目录 | yes，`docs/product/*` | no |

## AI 调用边界

自然语言入口只在 `README.md` 和 `USER_GUIDE.md` 中面向使用者展开。这里不重复示例，只定义自动化边界：AI 根据用户意图选择 Skill 内置脚本，并通过 `--target <project-root>` 作用到目标项目。目标项目保持轻量，不承担工作流脚本。

gate 通过后，AI 遵守 `EXECUTION_DISCIPLINE.md` 中的 Scope Lock、TDD / debugging 触发条件、性能纪律、方案/闭环提醒、自审和证据规则。

验证通过后，AI 仍然不能直接声称完成；需要运行唯一完成出口 `finish-feature.mjs`。它会确认验证报告、Coverage Matrix、变更文件映射、禁止范围、可维护性、性能风险和闭环风险检查都通过，并写入 `COMPLETION_PROOF.json`。

## Maestro 机器接口

当 Maestro 负责多项目调度时，使用这些入口，不要解析普通 Markdown 报告：

```bash
node scripts/workflow/automation/doctor.mjs --target <project-root> --json
node scripts/workflow/automation/status.mjs --target <project-root> --json
node scripts/workflow/automation/handoff-pack.mjs docs/features/<feature-id> --target <project-root> --json
node scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root> --json
```

`doctor --json` 判断目标项目是否可接入。  
`status --json` 给 Maestro 快速读取当前 Epic / Feature 状态，但不代表 gate 已通过。  
`handoff-pack --json` 生成 Codex worker 输入。  
`finish-feature --json` 是单项目 Feature 的唯一完成出口。`completion-check` 是内部检查和诊断脚本，不应被用来替代正式完成出口。

跨项目依赖、联调、集成验收由 Maestro 记录；document-driven-workflow 只输出单项目证据。

## 批准规则

`approve.mjs` 只更新 `00-workflow.yaml`，并且没有 `--user-approved` 时拒绝运行。

批准写入时会同时把 `route_decision` 设为 `user_confirmed`。用户只需要确认一次，不需要在多个 Markdown 文件里改批准状态。

如果 `hard_risk_blockers` 不是 `none`，Feature 必须使用 `strict` mode；这是客观硬风险门禁。除此之外，模式和风险等级由用户基于 AI 初判确认。

批准写入后仍然必须通过 gate。批准是必要条件，不是充分条件。

## Agent 选项

Hydrate 和生成类脚本支持：

- `--agent codex`：调用 Codex CLI。
- `--agent claude`：调用 Claude Code CLI。
- `--agent none`：只生成文档骨架，不调用 AI。

默认值是 `codex`。也可以通过 `WORKFLOW_HYDRATE_AGENT` 设置默认 agent。

## 多 Agent 支持

当前支持计划层面的多 agent：

- 生成 `09-agent-plan.md`。
- 推荐每个 agent 的职责边界。
- 标记可以并行的条件。
- 标记禁止范围和合并风险。

工作流目前不会自动启动或协调多个 agent 写代码。只有真实项目使用证明需要后，才应加入真正的编排。
