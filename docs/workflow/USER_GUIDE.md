# User Guide

这套工作流面向长期、多项目的 AI 协作。它的目的不是制造文档负担，而是减少返工、跑偏和上线风险。

## 使用入口

普通使用者不需要记脚本，也不需要修改目标项目的 `package.json`。安装 Skill 后，在 Codex 或 Claude Code 里说：

```text
使用 document-driven-workflow，处理这个需求文档，生成需要的 Epic / Feature 文档，等待我审查。
```

审查通过后说：

```text
我已经批准这些文档。使用 document-driven-workflow 写入批准、运行门禁，并在通过后开始实现。
```

实现完成前说：

```text
使用 document-driven-workflow 执行验证和完成前检查，并更新验证报告。
```

AI 会选择 Skill 内置脚本执行，目标项目只保留自己的 `docs/` 文档。

首次在一个项目中长期使用时，先让 AI 执行：

```text
使用 document-driven-workflow 接入这个项目，让后续 Codex / Claude 对话持续遵守这套工作流。
```

它会在目标项目 `AGENTS.md` 中写入一段带 marker 的持久约束。这样后续你说“继续实现这个需求”时，AI 也应该先检查当前 Epic / Feature、gate 和完成出口，而不是只补轻量文档后直接写代码。

## 一次确认

AI 生成的 Epic / Feature 是初版，不是最终决策。默认先看当前 Epic 或 Feature 目录下的 REVIEW.md。它是给用户看的审核摘要，包含这次要做什么、不做什么、风险选择、方案选择、验收表和需要你确认的事项。只有当摘要不清楚或你要追溯细节时，再继续看完整文档包。

你审查时主要看五件事：

- 需求和验收是否表达正确。
- Mode 是否过轻或过重：Direct / Light / Standard / Epic / Strict。
- Risk level 是否合理：low / medium / high。
- 是否真的存在客观硬风险。
- 预计时长和是否需要分批是否合理。

只有客观硬风险可以阻止降级，例如鉴权/会话/token、支付、权限、数据库或结构迁移、数据破坏、安全、生产部署、任务状态一致性、老项目核心兼容破坏。其他风险只是 AI 提醒，你可以决定保持、降级、升级或拆分。

确认结果只写入：

```text
00-workflow.yaml
```

不要在多个 Markdown 文件里改批准状态。

## 分层职责

| 层级 | 负责什么 | 不负责什么 | 什么时候用 |
| --- | --- | --- | --- |
| Epic | 产品迭代拆分、优先级、风险、发布批次 | 直接写代码 | 一个需求跨多个模块 |
| Feature | 一个可独立开发的功能单元、范围、验收、实现计划 | 承载大型产品迭代 | 一个单元能独立开发和测试 |
| Gate | 判断能否进入下一阶段 | 代替用户补需求 | Epic 拆 Feature 前或 Feature 开发前 |
| Legacy Baseline | 老项目当前行为 | 授权重构 | 老项目第一次接入 |
| Compatibility Contract | 不能破坏的兼容边界 | 新功能范围 | 老项目继续迭代 |
| Requirement Ledger | 原始需求来源和产品决策 | 实现细节 | 需要长期保留产品历史 |
| Traceability Matrix | 需求来源到测试证据的覆盖 | 替代 Feature 文档 | 交付前后追踪覆盖关系 |
| ADR | 长期有效的产品或技术决策 | 普通实现笔记 | 架构、支付、认证、数据、部署选择 |
| Verification Report | 测试证据和剩余风险 | 测试本身 | 实现完成后 |
| Context Pack | 紧凑的实现交接材料 | 完整产品历史 | 实现前或多 agent 协作前 |
| Execution Discipline | Scope Lock、TDD / debugging、自审、证据规则 | 替代产品文档 | Feature gate 通过后 |

## Epic vs Feature

当你还需要回答这些问题时，用 Epic：

- 哪些需求应该拆开
- 哪些 Features 先做
- 哪些模块风险最高
- 哪些工作依赖认证、支付、数据、部署或任务状态
- 哪一批可以先上线

当你已经能回答这些问题时，用 Feature：

- 目标是什么
- 非目标是什么
- 涉及哪些页面、API、数据或行为
- 哪些验收标准可以证明完成
- 应该跑哪些测试

## 复杂度等级

Level 0：Direct

- 极小、清楚、低风险
- 通常不需要文档包

Level 1：Light

- 低风险、单一范围改动
- 使用 `00-workflow.yaml` 和 `01-light-feature.md`

Level 2：Standard

- 普通单 Feature
- 使用完整 Feature 文档包

Level 3：Epic

- 多模块产品迭代
- 先 Epic，再拆 Features

Level 4：Strict / Legacy

- 认证、支付、权限、数据库、迁移、部署、任务状态、老项目核心行为或高风险范围
- 需要更强的边界和验证

## 批准

用户对每个 Epic 或 Feature 只批准一次。

批准只保存在：

```text
00-workflow.yaml
```

不要要求用户在多个 Markdown 文件里改批准状态。

## 推荐路径

新项目：

```text
Stack Preset -> Feature -> Feature gate -> implementation -> verification report
```

老项目：

```text
Legacy Baseline -> Compatibility Contract -> Feature -> Feature gate -> implementation -> verification report
```

产品迭代：

```text
Epic -> Epic gate -> Features -> Feature gate per Feature -> implementation -> verification -> retrospective
```

长期产品追溯：

```text
Requirement Ledger -> Epic/Feature -> Traceability Matrix -> Verification Report -> Snapshot or Change Request
```

Feature 实现防跑偏：

```text
Feature gate -> Scope Lock -> implementation -> self review -> verification report -> traceability update
```

## 长期演进原则

- 不为了某一个项目把通用工作流改得过度定制。
- 只有当现有层级无法表达重复出现的真实需求时，才增加新层级。
- 只有当新门禁能减少真实返工或风险时，才增加新门禁。
- 目标项目事实留在目标项目。
- 可复用流程规则留在 Skill。
