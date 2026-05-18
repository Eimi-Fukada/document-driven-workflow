# 自动化

自动化用来减少重复手工操作，但不替代用户批准。

## 边界

自动化可以：

- 检查本机 Skill、AI CLI、目标项目文档结构和老项目接入状态。
- 推荐 Direct、Light、Standard、Epic 或 Strict mode。
- 初始化产品追溯文件。
- 创建或 hydrate Epic 和 Feature 文档。
- 生成批准前检查报告。
- 生成 Feature context pack。
- 通过 gate 和验证报告约束 Feature execution discipline。
- 把用户明确批准写入 `00-workflow.yaml`。
- 生成 Epic agent plan。
- 运行硬门禁。
- 在声称完成前检查验证证据、变更文件映射、禁止范围和可维护性。
- 为 Maestro 输出机器可读状态、Feature 交接包和完成前检查结果。

自动化不能：

- 自己批准需求。
- gate 失败时开始代码实现。
- 把高风险工作降级成 Light。
- 为了暴露工作流命令而修改目标项目 `package.json`。
- 自动启动多个 agent 写代码。
- 替代 Maestro 做多项目 mission、依赖调度或跨项目联调验收。

## 主入口

普通使用者优先通过自然语言触发这些能力。维护者直接调试时，优先使用主入口。

| Script | 用途 | 是否写文件 | 是否需要明确批准 |
| --- | --- | --- | --- |
| `doctor.mjs` | 体检 Skill 安装、CLI、目标项目接入和文档结构 | yes，`DOCTOR_REPORT.md` | no |
| `process.mjs` | 从需求来源编排路由、建包、hydrate 和批准前检查 | yes，文档包和 `APPROVAL_REVIEW.md` | no |
| `continue.mjs` | 用户批准后运行 gate，并准备下一阶段上下文 | yes | yes，当需要写入批准时 |
| `verify.mjs` | 执行文档里的验证命令并写回验证报告 | yes，`07-verification-report.md` | no |
| `completion-check.mjs` | 完成前门禁，检查需求覆盖、验证证据、diff、可维护性和追溯 | yes，`COMPLETION_CHECK.md` | no |
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

## 自然语言接口

用户可以说：

```text
Use document-driven-workflow to process this requirement.
```

```text
I filled the Epic source. Generate the Epic documents and split it into Features.
```

```text
I approve this Feature. Apply approval, run the gate, then start implementation.
```

```text
Run workflow verification for this Feature.
```

```text
Run workflow completion check for this Feature before reporting it done.
```

AI 根据需要选择 Skill 内置脚本。目标项目保持轻量，不承担工作流脚本。

gate 通过后，AI 遵守 `EXECUTION_DISCIPLINE.md` 中的 Scope Lock、TDD / debugging 触发条件、自审和证据规则。

验证通过后，AI 仍然不能直接声称完成；需要运行完成前门禁，确认验证报告、变更文件映射、禁止范围和可维护性检查都通过。

## Maestro 机器接口

当 Maestro 负责多项目调度时，使用这些入口，不要解析普通 Markdown 报告：

```bash
node scripts/workflow/automation/doctor.mjs --target <project-root> --json
node scripts/workflow/automation/status.mjs --target <project-root> --json
node scripts/workflow/automation/handoff-pack.mjs docs/features/<feature-id> --target <project-root> --json
node scripts/workflow/automation/completion-check.mjs docs/features/<feature-id> --target <project-root> --json
```

`doctor --json` 判断目标项目是否可接入。  
`status --json` 给 Maestro 快速读取当前 Epic / Feature 状态，但不代表 gate 已通过。  
`handoff-pack --json` 生成 Codex worker 输入。  
`completion-check --json` 是单项目 Feature 完成前的机器可读证据。

跨项目依赖、联调、集成验收由 Maestro 记录；document-driven-workflow 只输出单项目证据。

## 批准规则

`approve.mjs` 只更新 `00-workflow.yaml`，并且没有 `--user-approved` 时拒绝运行。

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
