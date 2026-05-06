---
name: "document-driven-workflow"
description: "Use when turning product documents, UI specs, and acceptance criteria into implementation plans, code, tests, verification reports, and deployment readiness with a mandatory pre-development gate."
---

# Document Driven Workflow

本技能用于执行文档驱动产品交付。

用户用产品文档、UI 图和验收标准表达需求；AI 负责需求体检、实现计划、代码实现、测试、修复和部署准备。

## 强制开发门禁

进入代码实现前必须运行：

```bash
npm run gate:dev -- -FeaturePath docs/features/<feature-id>
```

如果开发门禁失败，不能进入代码实现。

失败时只能停留在文档阶段，输出：

- 缺失文件
- 未确认问题
- 阻塞问题
- 未批准假设
- 需要补充的下一份文档

## 交互闸门

在生成实现计划或写代码前，必须先完成：

1. 复述产品目标、功能范围和非目标。
2. 检查 PRD、UI Spec、Technical Contract、Acceptance Criteria 是否齐全。
3. 判断需求状态：`Ready`、`Ready with Assumptions` 或 `Not Ready`。
4. 如果仍有不确定需求，一次只问一个问题。
5. 所有阻塞问题清零后，输出 Readiness Review。
6. 用户批准后，再输出 Implementation Plan。
7. Implementation Plan 批准并通过 `gate:dev` 后，才能实现代码。

确认后再输出实现计划。

## 文档入口

优先读取：

- `AGENTS.md`
- `CLAUDE.md`
- `docs/workflow/WORKFLOW.md`
- `docs/workflow/GATES.md`
- `docs/workflow/templates/`
- `docs/features/<feature-id>/`

## 功能文档包

每个功能目录应包含：

```text
01-prd.md
02-ui-spec.md
03-technical-contract.md
04-acceptance-criteria.md
05-readiness-review.md
06-implementation-plan.md
```

## 结束条件

一个功能只有在验证报告完成后才算交付结束。验证报告必须说明：

- 执行过的命令
- 通过的测试
- 失败后修复的内容
- 未验证项
- 剩余风险
- 是否达到上线要求

