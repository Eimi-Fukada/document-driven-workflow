# Automation

自动化用来减少重复手工操作，但不替代用户批准。

## 边界

自动化可以：

- 推荐 Direct、Light、Standard、Epic 或 Strict mode
- 初始化产品追溯文件
- 创建或 hydrate Epic 和 Feature 文档
- 生成批准前检查报告
- 生成 Feature context pack
- 通过 gate 和验证报告约束 Feature execution discipline
- 把用户明确批准写入 `00-workflow.yaml`
- 生成 Epic agent plan
- 运行硬门禁

自动化不能：

- 自己批准需求
- gate 失败时开始代码实现
- 把高风险工作降级成 Light
- 为了暴露工作流命令而修改目标项目 `package.json`
- 自动启动多 agent 实现

## 脚本

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
Generate the implementation context pack for this Feature.
```

AI 根据需要选择 Skill 内置脚本。目标项目保持轻量，不承担工作流脚本。

gate 通过后，AI 遵守 `EXECUTION_DISCIPLINE.md` 中的 Scope Lock、TDD / debugging 触发条件、自审和证据规则。

## 批准规则

`approve.mjs` 只更新 `00-workflow.yaml`，并且没有 `--user-approved` 时拒绝运行。

批准写入后仍然必须通过 gate。批准是必要条件，不是充分条件。

## 多 Agent 支持

当前支持计划层面的多 agent：

- 生成 `09-agent-plan.md`
- 推荐每个 agent 的职责边界
- 标记可以并行的条件
- 标记禁止范围和合并风险

工作流目前不会自动启动或协调多个 agent。只有真实项目使用证明需要后，才应加入真正的编排。
