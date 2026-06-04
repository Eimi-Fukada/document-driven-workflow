# 老项目接入工作流

老项目接入文档驱动工作流时，目标不是立刻现代化，而是先把现状、兼容边界和后续变更流程固定下来。

## 1. 接入原则

- 先记录现状，再改功能。
- 先保护兼容边界，再讨论技术升级。
- 新增和修改功能必须走 Feature 文档包。
- 技术升级必须单独 ADR。
- 第一次接入不做大范围重构。

## 2. 接入分级

### Minimal：只做现状扫描

适合第一次了解老项目、准备评估，但还不进入研发。

需要产物：

```text
docs/legacy/BASELINE.md
```

Minimal 只能用于理解项目现状、补齐运行命令、识别风险和准备后续文档，不允许作为 `legacy-existing` Feature gate 的通过条件。

### Standard：允许开发老项目 Feature

适合绝大多数老项目功能修改。

需要产物：

```text
docs/legacy/BASELINE.md
docs/legacy/COMPATIBILITY_CONTRACT.md
```

当 `Stack Preset: legacy-existing` 时，Feature gate 按 Standard 要求检查 baseline 和 compatibility contract。

### Strict：高风险老项目接入

适合认证、支付、权限、会员权益、数据库结构、任务状态、生产部署、框架升级、路由体系迁移、核心兼容性变化。

建议额外产物：

```text
docs/legacy/MODERNIZATION_PLAN.md
docs/decisions/ADR-xxxx.md
docs/contracts/project-contract.md
docs/contracts/integration-contract.md
```

Strict 不代表必须一次性重构；它只表示需要更完整的风险记录、回滚方案、验证证据和用户确认。

## 3. 推荐接入步骤

```text
扫描项目现状
-> 生成 Legacy Baseline
-> 判断是否只停留在 Minimal
-> 如果要开发老项目 Feature，补 Compatibility Contract
-> 识别测试和部署命令
-> 创建第一个 Feature 文档包
-> 通过 Feature gate
-> 实现小功能
-> 输出验证报告和复盘
```

## 4. Legacy 门禁

当 `Stack Preset: legacy-existing` 时，开发门禁会额外检查：

- `docs/legacy/BASELINE.md` 存在。
- `docs/legacy/COMPATIBILITY_CONTRACT.md` 存在。
- `Project Mode: legacy`。
- `Context Pack` 使用 `Preset reference: not-applicable`。
- 功能实现计划没有把技术迁移混入普通 Feature。

Light Feature 不能使用 `legacy-existing`。老项目即使是小改动，也至少应该走 Standard，因为兼容边界需要被明确保护。

## 5. 第一次试运行建议

选择低风险功能：

- 文案或布局小改。
- 只读列表增加筛选。
- 新增一个独立设置项。
- 修复一个有明确验收标准的小 bug。

不要选择：

- 登录。
- 支付。
- 权限。
- 数据迁移。
- 框架升级。
- 路由体系迁移。
