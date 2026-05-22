# Maestro 集成

这份文档定义 `document-driven-workflow` 如何被 Maestro 驾驭。核心原则是分层清晰：

- Maestro 负责多项目 mission、任务依赖、并行调度、跨会话状态和最终汇总。
- Codex / Claude Code 负责实际阅读、修改、测试和修复。
- document-driven-workflow 负责单个项目内的需求结构化、Epic / Feature 文档、门禁、验证报告、完成前检查和交接包。

本工作流不把自己升级成多项目调度系统，也不替代 Maestro 的 mission / task 能力。

## 集成价值

接入 Maestro 后，本工作流提供的是一套稳定的单项目任务协议：

- `doctor --json` 告诉 Maestro 目标项目是否已接入、环境是否可用、文档结构是否完整。
- `status --json` 告诉 Maestro 当前有哪些 Epic / Feature、哪些已批准、哪些可实现、哪些已验证。
- `handoff-pack --json` 把单个 Feature 的需求 ID、验收 ID、范围、测试命令和 worker prompt 固化成机器可读输入。
- `finish-feature --json` 是 worker 声称完成前的唯一机器可读收尾出口，内部执行 gate、验证和 completion-check，并写入 `COMPLETION_PROOF.json`。

这样 Maestro 不需要理解每个项目内部的文档细节，也不需要解析普通 Markdown。它只负责读取稳定 JSON、派发任务、处理依赖和汇总结果。

## 推荐流程

1. Maestro 为每个目标项目运行体检：

```bash
node <skill-root>/scripts/workflow/automation/doctor.mjs --target <project-root> --json
```

2. Codex 使用 `document-driven-workflow` 处理需求，生成或补全 Epic / Feature 文档。
3. 用户审查文档，并且只通过一次批准写入 `00-workflow.yaml`。
4. Maestro 读取项目状态：

```bash
node <skill-root>/scripts/workflow/automation/status.mjs --target <project-root> --json
```

5. 对准备执行的 Feature 生成交接包：

```bash
node <skill-root>/scripts/workflow/automation/handoff-pack.mjs docs/features/<feature-id> --target <project-root> --json
```

6. Maestro 基于 `handoff-pack.json` 创建或更新 mission task，把任务交给 Codex worker。
7. Codex worker 一次只执行一个 Feature，先运行 Feature gate，通过后实现，再更新该 Feature 的验证报告。
8. 完成前运行唯一完成出口：

```bash
node <skill-root>/scripts/workflow/automation/finish-feature.mjs docs/features/<feature-id> --target <project-root> --json
```

9. Maestro 汇总每个项目的 `COMPLETION_PROOF.json`，并单独处理跨项目联调和集成验收。

Maestro 不应接受 Codex worker 的自然语言“完成了”作为任务关闭依据。任务关闭前必须读取 `finish-feature --json` 的 `result: PASS`。

## 并行调度边界

可以并行的情况：

- 不同目标项目之间没有共享数据库迁移、共享接口变更或发布时间依赖。
- 同一项目内的多个 Feature 已经拆清范围，`08-context-pack.md` 或 `handoff-pack.json` 中的 allowed / forbidden scope 不重叠。
- 每个 Feature 都已经通过用户批准和开发前 gate。
- 每个 worker 都只执行一个 Feature，能独立运行测试，并在完成前通过 `finish-feature --json`。

不应该并行的情况：

- 多个 Feature 修改同一批核心文件、同一套 schema、同一条认证/支付/权限链路。
- 一个 worker 连续实现多个 Feature，准备最后统一补验证报告或统一跑 completion-check。
- 一个项目的接口变更是另一个项目的前置条件。
- 老项目还没有 baseline 和 compatibility contract。
- `status --json` 显示存在 `doc_blocker`、`approval_blocker` 或 `verification_blocker`。
- 跨项目验收标准还没有写进 Maestro mission 或 Integration Contract。

稳定并行的原则是：Maestro 并行调度，Codex 执行单个 Feature，document-driven-workflow 为每个 Feature 提供可检查的边界和完成证据。任何 Feature 没有通过 finish-feature，都不能被 Maestro 视为完成候选。

## 机器接口

### doctor --json

用途：判断 Skill 是否可用、目标项目是否具备基础文档结构、Codex / Claude CLI 是否可用。

输出重点字段：

- `result`: `PASS` 或 `BLOCKED`
- `summary.blockers`
- `checks[].status`
- `checks[].blocker_type`

`BLOCKED` 时，Maestro 不应派发研发任务。

### status --json

用途：给 Maestro 一个低成本项目快照，不运行 gate，不修改批准状态。

输出重点字段：

- `delivery_state`: `CLEAR` 或 `HAS_BLOCKERS`
- `summary.features_ready`
- `features[].ready_for_implementation`
- `features[].verified`
- `features[].manifest_verified_without_proof`
- `features[].next_action`
- `features[].blockers[]`

`status` 只是状态快照，不等于门禁通过。真正进入实现前仍然必须运行 Feature gate。

`features[].verified` 只应由 `COMPLETION_PROOF.json` 的 PASS 推导出来。`00-workflow.yaml` 中的 `status: verified` 如果缺少完成证明，应显示为 `manifest_verified_without_proof: true`，不能被 Maestro 当成完成。

### handoff-pack --json

用途：把一个 Feature 的需求、验收、范围、测试命令和 worker prompt 打包给 Maestro。

生成文件：

- `HANDOFF_PACK.md`：人可读交接说明。
- `handoff-pack.json`：Maestro 可读交接输入。

Maestro 应优先读取 `handoff-pack.json`，不要从 Markdown 里猜字段。

### finish-feature --json

用途：在 AI 声称完成前，作为唯一完成出口执行 Feature gate、验证命令、completion-check、完成证明写入和 verified 状态更新。

输出重点字段：

- `result`: `PASS` 或 `BLOCKED`
- `completion_proof_path`
- `changed_files`
- `completion_report_path`
- `verification_report_path`

只有 `finish-feature` 通过，单项目 Feature 才能被 Maestro 标记为完成候选。`completion-check --json` 可以用于诊断，但不是正式任务关闭依据。

## Blocker 类型

| Type | 含义 | 通常由谁处理 |
| --- | --- | --- |
| `environment_blocker` | Skill、CLI、路径、Git 或运行环境问题 | 用户 / 环境维护者 |
| `doc_blocker` | 文档结构、需求 ID、验收 ID、未决问题、legacy baseline 缺失 | Codex 文档阶段 |
| `approval_blocker` | 用户还没有批准，或批准状态没有写入 `00-workflow.yaml` | 用户 |
| `implementation_blocker` | 改动范围、禁止范围、文件膨胀、维护性问题 | Codex worker |
| `verification_blocker` | 测试、验证报告、完成前检查或追溯证据不足 | Codex worker |
| `integration_blocker` | 跨项目接口、联调或集成验收问题 | Maestro |

document-driven-workflow 只产生单项目 blocker。跨项目 blocker 应由 Maestro 的 mission 或 Integration Contract 记录。

## 契约模板

当一个 mission 涉及多个项目时，可以在 Maestro 的 mission 文档或目标项目 docs 中使用：

- `templates/contracts/project-contract.md`
- `templates/contracts/integration-contract.md`

`Project Contract` 描述单项目能力边界、接口和验收命令。  
`Integration Contract` 描述多个项目之间的接口、依赖顺序、跨项目验收和联调风险。

## 不能做的事

- 不要让 document-driven-workflow 自动创建多个项目的任务图。
- 不要让 document-driven-workflow 自己调度多个 agent 并合并代码。
- 不要绕过用户批准、Feature gate 或 finish-feature。
- 不要修改目标项目 `package.json` 只是为了暴露 workflow 命令。
- 不要把跨项目验收藏在某一个 Feature 的验证报告里。

## 推荐 Maestro 判断规则

- `doctor.result != PASS`：不派发。
- `status.features[].ready_for_implementation != true`：不派发实现。
- 没有 `handoff-pack.json`：先生成交接包。
- worker 完成后 `finish-feature.result != PASS`：任务不能关闭。
- `status.features[].manifest_verified_without_proof == true`：把任务视为验证阻塞，要求重跑 finish-feature。
- 多项目联调失败：在 Maestro mission 或 Integration Contract 中记录 `integration_blocker`，不要改写单项目 Feature 为已完成。

## 推荐闭环

Maestro 关闭一个跨项目 mission 前，应至少确认：

- 每个目标项目的 `doctor --json` 为 `PASS`。
- 每个派发 Feature 的 `handoff-pack.json` 存在。
- 每个 worker 返回的 `finish-feature --json` 为 `PASS`，并且 `COMPLETION_PROOF.json` 存在。
- 跨项目接口、联调和发布顺序已经在 Integration Contract 或 Maestro mission 中完成验收。
- 单项目 Feature 的完成状态不被用来替代跨项目验收状态。
