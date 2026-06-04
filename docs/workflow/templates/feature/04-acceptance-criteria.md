# 验收标准模板

## 基本信息

- 功能名称：
- 关联 PRD：
- 关联 UI Spec：
- 文档说明：本文件只描述验收项和验证口径，不保存批准或实现状态。唯一机器可读状态在 `00-workflow.yaml`。

## 验收矩阵

| 需求 ID | 验收项 | 测试类型 | 验证结果 |
| --- | --- | --- | --- |
| REQ-AREA-001 |  | Unit / API / E2E / Smoke | pending / passed / failed |

## 覆盖矩阵

<!--
当一个 Feature 明确包含多个模块、页面、工具、状态、接口或枚举项时，必须启用覆盖矩阵。
填写方式：
- Coverage required: yes
- Expected coverage items: 写实际数量，例如 11
- 每个覆盖项使用一个 COV-* ID。
- 完成时，07-verification-report.md 必须为每个 COV-* 填写实现证据、变更文件证据、验证证据和 Passed 状态。
如果这个 Feature 只有单一闭环，可以保持 Coverage required: no。
-->

- Coverage required: no
- Expected coverage items: 0
- Execution pass recommendation: 3-5 coverage items when Expected coverage items is greater than 5

| Coverage ID | Module / Item | Requirement ID | Acceptance ID | Expected changed files / paths | Notes |
| --- | --- | --- | --- | --- | --- |
| COV-AREA-001 |  | REQ-AREA-001 | AC-AREA-001 |  |  |

## 验收用例

### AC-AREA-001 用例标题

关联需求：`REQ-AREA-001`

```text
Given 前置条件
When 用户执行动作
Then 系统应该产生结果
```

边界条件：

- 

失败条件：

- 

测试数据：

- 

预期覆盖：

- 单元测试：
- 接口测试：
- Playwright：
- 冒烟测试：


