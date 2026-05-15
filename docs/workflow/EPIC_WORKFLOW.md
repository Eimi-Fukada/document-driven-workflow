# Epic Workflow

Epic 是产品迭代层。它的作用是把一个宽泛需求拆成多个可以独立开发、独立测试、独立验收的 Features。

## 什么时候使用 Epic

- 一个需求跨多个模块
- 发布顺序或批次很重要
- 实现前需要先拆分风险
- 原始文档混合了 UI、API、认证、支付、数据、任务状态、部署、移动端或 Web 端关注点
- 后续可能让多个 agent 同时处理独立 Features

不要把单个清楚、低风险的小改动放进 Epic。

## Epic 文档包

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

`09-agent-plan.md` 只有在考虑并行执行时才必须补全。

## Gate 含义

`gate:epic` 表示 Epic 可以进入 Feature 拆分。

它不表示可以直接从 Epic 写代码。代码实现必须走 Feature 级 `gate:dev`。

## 批次策略

Batch 1：

- 低风险
- 确定性高
- 依赖少
- 适合快速验证工作流

Batch 2：

- 中等风险
- 有一定 UI / API 联动
- 不包含核心认证、支付、数据迁移，除非已经独立隔离

Batch 3：

- 高风险
- 认证、支付、会员权益、数据库、任务状态、权限、部署或迁移
- 应拆成独立 Features，并加强验证

## 批准

Epic 批准只保存在 `00-workflow.yaml`。

从已批准 Epic 生成的 Features 可以继承 Epic approval，但每个 Feature 仍然有自己的 manifest 和 gate。

## 产品历史

Epic 应该能追溯到 `docs/product/requirement-ledger.md`。

当 Epic 被批准，且范围足够大、未来迭代可能需要理解原始决策时，在 `docs/product/snapshots/` 下创建 snapshot。

生成的 Features 应在 `00-workflow.yaml`、`00-intake-review.md` 和 `08-context-pack.md` 中保留 Epic 链接。
