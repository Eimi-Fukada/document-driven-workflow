# Requirement Intake Review

这份文档用于把原始需求转成可审查的需求体检结果。它帮助用户看到哪些内容清楚、哪些缺失、哪些有冲突、哪些需要在开发前确认。

## Basic Info

- Feature ID:
- Source:
- Related Epic:
- Stack Preset:

## Clear Items

已明确的需求、页面、行为、边界或验收点：

-

## Missing Items

开发前仍缺失的信息：

-

## Conflicts

文档、UI 图、现有代码或历史行为之间的冲突：

-

## Risks

可能导致返工、误解、测试遗漏或上线风险的点：

-

## Route And Risk Draft

这部分是 AI 给用户审查的初判，不是最终批准。用户可以在审查后通过 `00-workflow.yaml` 锁定模式和风险。

- AI suggested mode: Light / Standard / Epic / Strict
- AI suggested risk level: low / medium / high
- Objective hard risk blockers: none / auth-session-token / payment / permission / database-migration / production-deployment / task-state / legacy-core / security / destructive-data
- Expected runtime: under_30m / 30_90m / over_90m
- Execution slicing: not_required / recommended / required
- Why this mode:
- What would make it stricter:
- What would allow downgrade:

只有客观硬风险可以阻止用户降级。客观硬风险指鉴权/会话/token、支付、权限、数据库或结构迁移、数据破坏、安全、生产部署、任务状态一致性、老项目核心兼容破坏。其他风险应作为提示交给用户判断，不要因为 AI 不确定就自动把简单需求推入重流程。

## Assumptions

AI 为了补全文档做出的假设。假设必须能被用户审查：

-

## User Questions

必须由用户确认的问题：

-

## AI Recommendation

说明这个 Feature 是否已经可以交给用户审查，是否应该升级为 Epic 或 Strict mode，或者是否需要更多原始材料。

唯一机器可读状态是 `00-workflow.yaml`。
