# Traceability Matrix

这份文档连接产品意图和交付证据。

它应该能回答：这个需求从哪里来、在哪里实现、如何验证。

## Matrix

| Requirement ID | Source ID | Epic | Feature | Acceptance | Implementation | Tests | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-EXAMPLE-001 | SRC-EXAMPLE-001 | docs/epics/example | docs/features/example | AC-EXAMPLE-001 | pending | pending | pending |

## Rules

- 每个进入实现的 `REQ-*` 或 `EREQ-*` 都应该出现在这里。
- 交付后更新 `Implementation`、`Tests` 和 `Verification`。
- 草稿阶段未知证据可以用 `pending`，发布前应替换。
- 不删除旧行。行为改变时新增 Change Request 行。
