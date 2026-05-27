# Claude Code 协作入口

Claude Code 使用本仓库时，遵守 `AGENTS.md` 以及 `docs/workflow/` 下的工作流参考文档。

## 强制规则

- 实现前先按 Direct、Light、Standard、Epic、Strict 路由。
- `00-workflow.yaml` 是唯一机器可读状态文件。
- 通过 `docs/product/requirement-ledger.md` 和 `docs/product/traceability.md` 保留产品历史。
- 相关门禁未通过时，不进入代码实现。
- Feature gate 通过后，遵守 `EXECUTION_DISCIPLINE.md`，并在验证报告中记录证据。
- 执行可维护性规则：2 repeated uses 复用检查、1000 lines 单文件限制；技术栈专属规则以当前 Stack Preset 为准。
- 不为了暴露工作流命令而修改目标项目 `package.json`。
- 新 Next.js 项目只使用 App Router。
- 老项目必须先建立 Legacy Baseline 和 Compatibility Contract，再进入 Feature 工作。
- Maestro 负责多项目调度和跨项目验收；本工作流只负责单项目文档、门禁、验证和交接包。

## 必要检查

```bash
npm run check
```

目标项目通过已安装 Skill 的内置脚本执行门禁，并传入 `--target <project-root>`。

```bash
node scripts/workflow/feature/gate-feature.mjs docs/features/<feature-id> --target <project-root>
node scripts/workflow/epic/gate-epic.mjs docs/epics/<epic-id> --target <project-root>
```

## Maestro 机器接口

```bash
node scripts/workflow/automation/doctor.mjs --target <project-root> --json
node scripts/workflow/automation/status.mjs --target <project-root> --json
node scripts/workflow/automation/handoff-pack.mjs docs/features/<feature-id> --target <project-root> --json
node scripts/workflow/automation/completion-check.mjs docs/features/<feature-id> --target <project-root> --json
```

`status` 只是状态快照；进入实现前仍然必须运行 Feature gate。
