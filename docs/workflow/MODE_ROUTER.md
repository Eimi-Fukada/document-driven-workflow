# Mode Router

选择“足够安全的最轻流程”。不要为了显得完整而把简单需求推入重流程，也不要把复杂迭代塞进一个大 Feature。

| Mode | 适用场景 | 文档产物 | 执行方式 |
| --- | --- | --- | --- |
| Direct | 请求很小、可逆、不需要产品文档包 | 现有文档或直接答复 | 默认不走 gate，除非代码改动变复杂 |
| Light | 低风险、单一范围，例如文案、样式、小 UI 调整、清楚的小 bug | `00-workflow.yaml`、`01-light-feature.md` | 单 agent |
| Standard | 一个可以独立开发的产品功能 | 完整 Feature 文档包 | 单 agent |
| Epic | 一个产品迭代跨多个模块、批次或可独立开发的 Features | Epic 文档包，然后拆 Feature 文档包 | 按 Feature 逐个执行 |
| Strict | 高风险范围：认证、支付、权限、数据库、任务状态、部署、迁移、老项目核心行为或多 agent 实现 | Standard Feature 加更严格审查和验证 | 默认单 agent；只有边界清楚时才多 agent |

## 路由规则

- 不要把多模块迭代塞进一个大 Feature，应该使用 Epic。
- 不要让低风险单点改动走沉重的 Epic 流程。
- 不要用 Light 处理老项目接入或敏感后端行为。
- 如果需求一开始像 Light，但后来发现涉及 API、数据、认证、支付、权限、部署或跨模块影响，必须在实现前升级模式。

## 路由执行

用户入口在 `USER_GUIDE.md` 中说明。AI 收到 `document-driven-workflow` 请求后，应完成路由、创建必要文档包、有原始材料时 hydrate 草稿、等待一次用户批准、运行 gate，然后再实现。
