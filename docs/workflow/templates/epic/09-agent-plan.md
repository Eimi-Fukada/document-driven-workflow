# Agent Plan

- Epic ID: unset

## Parallelization Rule

只有当 Feature 边界、依赖、允许文件、禁止文件和验证命令都清楚时，才使用多 agent 并行。

多 agent 只适合 Epic 或 Strict mode。不要用于 Light mode，也不要用于单个低风险 Feature。

## Assignment Matrix

| Feature ID | Suggested Agent | Parallelization | Allowed Scope | Forbidden Scope | Verification | Merge Risk |
| --- | --- | --- | --- | --- | --- | --- |
| feature-id | Agent 1 | Parallel if dependencies are clear | docs/features/feature-id and files approved by 06-implementation-plan.md | Auth/payment/deployment/data migration unless explicitly approved | Run Feature gate, project tests, and update 07-verification-report.md | Review file overlap before merge |

## State Boundary

Agent 分工只是建议。唯一机器可读工作流状态是 `00-workflow.yaml`。
