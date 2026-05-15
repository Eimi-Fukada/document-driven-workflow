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
- 执行 `EXECUTION_DISCIPLINE.md` 中的 Scope Lock 和 Self Review。
- 应用 `EXECUTION_DISCIPLINE.md` 中的可维护性规则。
- 测试后更新 `07-verification-report.md`。

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

没有新的验证证据时，不要声称完成。
