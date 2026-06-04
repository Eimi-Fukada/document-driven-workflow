# Mode Router

选择“足够安全的最轻流程”。不要为了显得完整而把简单需求推入重流程，也不要把复杂迭代塞进一个大 Feature。

路由分为两步：AI 先给出初判，用户审查后一次性确认。最终可执行的模式、风险等级、客观硬风险、预计时长和分批策略只以 `00-workflow.yaml` 为准。

| Mode | 适用场景 | 文档产物 | 执行方式 |
| --- | --- | --- | --- |
| Direct | 请求很小、可逆、不需要产品文档包 | 现有文档或直接答复 | 默认不走 gate，除非代码改动变复杂 |
| Light | 低风险、单一范围，例如文案、样式、小 UI 调整、清楚的小 bug | `00-workflow.yaml`、`REVIEW.md`、`01-light-feature.md` | 单 agent |
| Standard | 一个可以独立开发的产品功能 | 完整 Feature 文档包 | 单 agent |
| Epic | 一个产品迭代跨多个模块、批次或可独立开发的 Features | Epic 文档包，然后拆 Feature 文档包 | 按 Feature 逐个执行 |
| Strict | 高风险范围：认证、支付、权限、数据库、任务状态、部署、迁移、老项目核心行为或多 agent 实现 | Standard Feature 加更严格审查和验证 | 默认单 agent；只有边界清楚时才多 agent |

## 路由规则

- 不要把多模块迭代塞进一个大 Feature，应该使用 Epic。
- 不要让低风险单点改动走沉重的 Epic 流程。
- 不要用 Light 处理老项目接入或敏感后端行为。
- AI 不确定时，先把不确定性写进初判文档，让用户确认，不要直接把简单需求推到重流程。
- 只有客观硬风险可以阻止用户降级。客观硬风险包括鉴权/会话/token、支付、权限、数据库或结构迁移、数据破坏、安全、生产部署、任务状态一致性和老项目核心兼容破坏。
- 普通 API、普通数据读取、小范围状态改动或 UI 调整不自动等于 Strict；应说明影响范围后交给用户确认。
- 如果需求一开始像 Light，但后来发现存在客观硬风险，必须在实现前升级模式；如果只是存在不确定性，先停在文档阶段让用户确认。

## 用户确认字段

用户确认后，AI 或脚本只更新 `00-workflow.yaml`，不要要求用户在多个 Markdown 文件里改批准状态。

```yaml
route_decision: user_confirmed
risk_level: low | medium | high
hard_risk_blockers: none | comma-separated objective blocker IDs
expected_runtime: under_30m | 30_90m | over_90m
execution_slicing: not_required | recommended | required
```

当 `hard_risk_blockers` 不是 `none` 时，Feature 必须使用 `strict` mode。否则用户可以基于 AI 初判选择保持、降级、升级或拆分。

## 路由执行

用户入口在 `USER_GUIDE.md` 中说明。AI 收到 `document-driven-workflow` 请求后，应完成路由、创建必要文档包、有原始材料时 hydrate 草稿、等待一次用户批准、运行 gate，然后再实现。
