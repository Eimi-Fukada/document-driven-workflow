# Readiness Review 模板

## 基本信息

- 功能名称：
- 关联需求：
- 创建日期：
- 状态：Draft / Ready / Blocked

## 状态字段允许值 / Allowed Status Values

- 状态：Draft / Ready / Blocked
- Readiness：Not Ready / Ready
- Unresolved Questions：0 或正整数
- Blocking Issues：0 或正整数
- Assumptions Accepted：no / yes
- User Approval：Pending / Approved
- Implementation Plan Status：Draft / Approved
- Draft：体检草稿，尚未确认。
- Ready：需求允许进入研发。
- Blocked：存在阻塞问题。

通过开发门禁的常用组合：

```text
- Readiness: Ready
- Unresolved Questions: 0
- Blocking Issues: 0
- Assumptions Accepted: yes
- User Approval: Approved
- Implementation Plan Status: Approved
```

## 机器可读门禁字段

以下字段用于 `npm run gate:dev` 强制校验。进入开发前必须保持原字段名。

```text
- Readiness: Not Ready
- Unresolved Questions: 0
- Blocking Issues: 0
- Assumptions Accepted: no
- User Approval: Pending
- Implementation Plan Status: Draft
```

## 已确认内容

- 

## 未确认问题

- 

## 阻塞问题

- 

## 关键假设

- 

## 影响范围

- 

## 结论

当前是否允许进入研发：

