# Execution Protocol

只有相关 gate 通过后，才能开始实现。

实现阶段使用 `EXECUTION_DISCIPLINE.md`。它定义 Scope Lock、TDD triggers、debugging triggers、self review 和 verification evidence rules。

## 修改代码前

1. 确认 `00-workflow.yaml` 中的 mode。
2. 确认所需产品和技术文档存在。
3. 确认用户批准只记录在 `00-workflow.yaml`。
4. 运行相关 gate。
5. 如果 gate 失败，停在文档模式。
6. Standard 或 Strict Feature 先读 `08-context-pack.md`。
7. 编辑文件前确认 Scope Lock。
8. 确认本次只实现一个 Feature，并记录 base ref 或当前 diff 边界。
9. 如果实现方案、文件范围或验收标准与文档冲突，先停下来报告，不要降级实现。
10. 如果 `04-acceptance-criteria.md` 中启用了 Coverage Matrix，先确认覆盖项数量、每个 `COV-*` 对应的模块、REQ 和 AC；覆盖项多于 5 个时按 3-5 个一批执行，但不能改变最终验收范围。
11. 确认 Stall Guard 只用于长任务和无输出场景：短任务不需要额外汇报；预计超过 30 分钟或 15 分钟没有文件变更、命令输出、验证证据时，暂停并报告卡点。
12. 如果是已批准 Feature 内的小缺陷修复，使用 `EXECUTION_DISCIPLINE.md` 的 Defect Fix Fast Path；不要重新 hydrate 或重走完整文档链路。
13. 验证先用 targeted checks，最后用 `finish-feature.mjs` 收口；避免实现阶段和完成阶段重复跑昂贵全量验证。

## Execution Modes

Light：

- 使用一个 agent。
- 遵守 `01-light-feature.md`。
- 范围保持小且可回退。
- 验证记录写在 Light Feature 文档里。

Standard：

- 使用一个主 agent。
- 遵守 `06-implementation-plan.md`。
- 遵守 `08-context-pack.md`。
- 不得把一个 Epic 下的多个 Feature 连续实现后再统一验收。
- 执行 `EXECUTION_DISCIPLINE.md` 中的 Scope Lock 和 Self Review。
- 应用 `EXECUTION_DISCIPLINE.md` 中的可维护性规则。
- 测试后更新 `07-verification-report.md`，并立即运行 `finish-feature.mjs`。
- 对已批准 Feature 内的小缺陷修复，允许只补相关验收和验证证据，但仍必须运行 `finish-feature.mjs`。

Epic：

- 不直接从 Epic 实现代码。
- 先把 Epic 拆分为 Features。
- 只实现 gate 通过的 Features。

Strict：

- 默认一个主 agent，除非 agent plan 已经定义清楚的独立工作边界。
- 未明确批准时，保持认证、支付、权限、数据迁移、部署和老项目兼容边界不变。
- 触发条件成立时使用 TDD 和 systematic debugging。
- 在 `07-verification-report.md` 记录执行证据。
- 根据风险扩大验证范围。
- 每个 Feature 都必须独立通过 `finish-feature.mjs` 后才能继续下一个 Feature。

## Verification

根据技术栈和风险运行合适检查：

- typecheck
- lint
- unit tests
- API tests
- Playwright tests
- smoke tests
- build
- 相关时执行部署或回滚检查

验证报告必须包含执行命令、结果、未验证项和剩余风险。

实现阶段优先选择能覆盖当前改动的 targeted checks；昂贵全量验证应尽量集中到最终完成出口。若提前执行了全量 typecheck、lint、build 或 e2e，必须记录为验证证据，不要在没有代码变化或风险变化时重复执行同类全量命令。

没有新的验证证据时，不要声称完成。
长时间运行不是完成证据。Stall Guard 触发时，应先报告当前证据和卡点，再继续或中止；它不作为 `finish-feature.mjs` 的完成门禁。

构建通过、类型检查通过或 lint 通过不能单独代表完成。完成必须同时满足：

- 需求 ID 有实现证据。
- 验收 ID 有测试或人工验证证据。
- 启用 Coverage Matrix 时，每个 `COV-*` 有实现证据、验证证据和 Passed 状态。
- 变更文件能映射到需求或测试。
- Scope Lock 没有被突破。
- 性能、闭环、可维护性风险已记录或标记为不适用。
- `finish-feature.mjs` 返回 PASS，并写入 `COMPLETION_PROOF.json`。
