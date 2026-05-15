# Claude Code 协作入口

Claude Code 使用本仓库时，遵守 `AGENTS.md` 以及 `docs/workflow/` 下的工作流参考文档。

## 强制规则

- 实现前先按 Direct、Light、Standard、Epic、Strict 路由。
- `00-workflow.yaml` 是唯一机器可读状态文件。
- 通过 `docs/product/requirement-ledger.md` 和 `docs/product/traceability.md` 保留产品历史。
- 相关门禁未通过时，不进入代码实现。
- Feature gate 通过后，遵守 `EXECUTION_DISCIPLINE.md`，并在验证报告中记录证据。
- 执行可维护性规则：2 repeated uses 复用检查、1000 lines 单文件限制、Next.js UI 优先 Tailwind CSS。
- 不为了暴露工作流命令而修改目标项目 `package.json`。
- 新 Next.js 项目只使用 App Router。
- 老项目必须先建立 Legacy Baseline 和 Compatibility Contract，再进入 Feature 工作。

## 必要检查

```bash
npm run check
npm run gate:dev -- docs/features/<feature-id>
npm run gate:epic -- docs/epics/<epic-id>
```

目标项目通过已安装 Skill 的内置脚本执行门禁，并传入 `--target <project-root>`。
