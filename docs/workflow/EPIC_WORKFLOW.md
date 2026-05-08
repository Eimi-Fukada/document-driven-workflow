# 产品迭代工作流

Epic 用于承载一次产品迭代。一次迭代可能包含多个功能模块、多个风险等级和多批发布计划，不能直接塞进单个 feature 文档包。

Epic 是通用产品迭代层，不是某个项目的特化规则。是否需要 Epic，应按 `docs/workflow/USER_GUIDE.md` 的复杂度分级判断。

## 1. 适用场景

使用 Epic 的情况：

- 一份需求文档包含多个功能模块。
- 需求跨支付、登录、会员、任务、数据、UI、移动端、部署等多个区域。
- 需要分批交付。
- 需要先做风险分级和依赖排序。
- 需要把原始产品文档保留下来，再拆成可执行 feature。

不使用 Epic 的情况：

- 单个页面文案调整。
- 单个低风险 UI 小改。
- 单个明确 bug 修复。
- 一个功能包就能清楚表达目标、边界和验收。

如果需求可以独立开发、独立验收，就使用 Feature；如果还需要先拆模块、排批次、控风险，才使用 Epic。

## 2. Epic 目录

```text
docs/epics/<epic-id>/
  00-source.md
  01-epic-brief.md
  02-requirement-inventory.md
  03-scope-breakdown.md
  04-risk-map.md
  05-release-plan.md
  06-acceptance-map.md
  07-progress-board.md
  08-retrospective.md
  09-agent-plan.md
```

`09-agent-plan.md` 只在需要多 Agent 并行开发时使用，不是 Epic 门禁的必需文件。

## 3. Epic 和 Feature 的关系

Epic 负责：

- 保存原始产品材料。
- 拆解需求。
- 标记风险。
- 排发布批次。
- 记录 feature 之间的依赖。
- 汇总验收状态。

Feature 负责：

- 单个可开发单元的 PRD。
- UI Spec。
- Technical Contract。
- Acceptance Criteria。
- Readiness Review。
- Implementation Plan。
- Verification Report。

## 4. 推荐入口

目标项目中推荐使用自然语言入口：

```text
使用 document-driven-workflow，处理这个需求文档。
```

```text
我已经填好 docs/epics/<epic-id>/00-source.md，继续生成 Epic 和 Features。
```

AI 应使用 Skill 内置模板、生成器和门禁操作目标项目，不要求目标项目配置 workflow npm scripts。

本仓库维护时仍可使用 `npm run epic:new`、`npm run gate:epic`、`npm run epic:features` 做回归验证。


## 5. Epic 门禁

Epic 门禁通过只代表“可以开始拆 feature”，不代表可以写代码。

通过条件：

- 原始需求材料已保存。
- 需求清单已拆分。
- 每个需求有风险等级。
- 已经有第一批 release plan。
- 至少有一个 feature 候选。
- 高风险需求没有被放进第一批，除非有明确说明。
- 没有 `TODO`、`TBD`、`待确认`、`未确认`、`待补充` 等未解决标记。

代码实现仍然必须通过 feature 级 `gate:dev`。

## 6. 分批策略

默认分三批：

### Batch 1

低风险、高确定性、少依赖，用于验证工作流和快速反馈。

### Batch 2

中风险，需要少量代码联动或 UI 改造，但不碰核心支付、登录、数据库写入。

### Batch 3

高风险，涉及支付、登录、会员权益、数据库、任务状态、权限或迁移。必须单独 feature、单独验收、必要时单独 ADR。
