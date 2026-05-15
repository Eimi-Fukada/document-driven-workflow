# Requirement Ledger

这份文档是长期产品需求来源台账。

用它记录需求从哪里来，以及哪个 Epic 或 Feature 消化了这个需求。产品范围变化时不要删除历史行，应新增 Change Request。

## Source Register

| Source ID | Source Material | Type | Linked Epic / Feature | Decision | Notes |
| --- | --- | --- | --- | --- | --- |
| SRC-EXAMPLE-001 | docs/epics/example/00-source.md | product request | docs/epics/example | accepted | 用真实来源替换这个示例。 |

## Decision Values

- `accepted`：纳入工作流。
- `split`：拆成多个 Epics 或 Features。
- `merged`：合并到另一个需求。
- `deferred`：本轮有意延后。
- `rejected`：明确不做。

## Rules

- 保持原始来源引用稳定。
- 如果后续迭代改变旧行为，创建 `docs/changes/CR-xxxx.md`。
- 每个非平凡 Epic 或 Feature 至少链接一条来源记录。
