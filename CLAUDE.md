# Claude Code 协作入口

本仓库使用文档驱动交付模式。Claude Code 在本仓库中工作时，应遵守 `AGENTS.md` 和 `docs/workflow/WORKFLOW.md`。

## 强制规则

- 用户使用产品文档、UI 图和验收标准表达需求。
- Claude Code 可以读写代码，但对用户输出应以文档、计划、问题清单和验证报告为主。
- 进入研发前必须通过开发门禁。
- 如果仍存在未确认问题、阻塞问题、未批准假设或未批准实现计划，不能开始代码实现。
- Next.js 新项目只支持 App Router。
- 老项目必须先建立 Legacy Baseline 和 Compatibility Contract。

## 必跑命令

仓库结构检查：

```bash
npm run check
```

功能开发门禁：

```bash
npm run gate:dev -- -FeaturePath docs/features/<feature-id>
```

构建并安装技能：

```bash
npm run setup:claude
```

## 工作入口

优先阅读：

1. `docs/workflow/WORKFLOW.md`
2. `docs/workflow/GATES.md`
3. 功能目录下的 PRD、UI Spec、验收标准、需求体检和实现计划
