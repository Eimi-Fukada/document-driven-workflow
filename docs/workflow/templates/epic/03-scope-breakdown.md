# Scope Breakdown 模板

## 模块拆分

| 模块 | 包含需求 | 不包含 | 建议批次 |
| --- | --- | --- | --- |
|  |  |  | Batch 1 / Batch 2 / Batch 3 |

## Feature 候选

| Feature ID | 来源需求 | 目标 | 风险 | 依赖 |
| --- | --- | --- | --- | --- |
|  |  |  | Low / Medium / High |  |

## 拆分原则

- 每个 Feature 应该能独立通过 `gate:dev`。
- 高风险需求不要和低风险 UI 调整混在同一个 Feature 里。
- 涉及支付、登录、数据库、权限、任务状态的需求必须独立成 Feature。
