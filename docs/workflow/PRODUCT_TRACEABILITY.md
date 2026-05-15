# Product Traceability

这套工作流把产品需求视为长期资产，而不是一次性代码生成 prompt。

## 产品层

目标项目可以在下面目录维护产品历史：

```text
docs/product/
  requirement-ledger.md
  traceability.md
  snapshots/
```

这一层是项目专属内容，属于目标项目，不属于可复用 Skill 包。

## Requirement Ledger

`docs/product/requirement-ledger.md` 记录每个需求从哪里来：

- 原始产品文档
- UI 参考
- 会议记录
- 用户消息
- 老项目既有行为
- change request

产品变化时不要删除旧行。新增一行，或创建 Change Request。

## Traceability Matrix

`docs/product/traceability.md` 连接：

```text
source -> Epic -> Feature -> requirement ID -> acceptance ID -> implementation -> tests -> verification report
```

每个进入实现的需求都应该有一条追溯记录。

## Snapshots

`docs/product/snapshots/` 保存已批准的产品范围快照。

当 Epic 或大型 Feature 被批准，并且团队需要稳定记录以下信息时，使用 snapshot：

- 已批准范围
- 非目标
- Feature 拆分
- 验收映射
- 已知风险

Snapshots 是产品历史，不是工作流版本。

## Change Requests

修改已有行为时，创建或更新 `docs/changes/CR-xxxx.md`。

不要静默覆盖旧需求。Change Request 应该链接回原始 Epic、Feature 或 requirement ID。
