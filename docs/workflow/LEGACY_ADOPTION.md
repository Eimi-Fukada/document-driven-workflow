# 老项目接入工作流

老项目接入文档驱动工作流时，目标不是立即现代化，而是先把现状、兼容边界和后续变更流程固定下来。

## 1. 接入原则

- 先记录现状，再改功能。
- 先保护兼容边界，再讨论技术升级。
- 新增和修改功能必须走功能文档包。
- 技术升级必须单独 ADR。
- 第一次接入不做大范围重构。

## 2. 接入步骤

```text
扫描项目现状
-> 生成 Legacy Baseline
-> 生成 Compatibility Contract
-> 识别测试和部署命令
-> 创建第一个功能文档包
-> 通过 Feature gate
-> 实现小功能
-> 输出验证报告和复盘
```

## 3. 必备文档

```text
docs/legacy/BASELINE.md
docs/legacy/COMPATIBILITY_CONTRACT.md
docs/legacy/MODERNIZATION_PLAN.md
```

## 4. Legacy 门禁

当 `Stack Preset: legacy-existing` 时，开发门禁会额外检查：

- `docs/legacy/BASELINE.md` 存在。
- `docs/legacy/COMPATIBILITY_CONTRACT.md` 存在。
- `Project Mode: legacy`。
- 功能实现计划没有要求无 ADR 的技术迁移。

## 5. 老项目第一次试运行建议

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
