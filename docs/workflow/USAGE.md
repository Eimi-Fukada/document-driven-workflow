# 工作流功能使用说明

本文说明这套文档驱动工作流的每个功能怎么使用。它面向两类场景：

- 在本仓库维护和打包工作流 Skill。
- 在目标项目中让 Codex 或 Claude Code 按文档驱动方式接入、拆需求、开发、测试和验证。

## 1. 仓库自检

用途：检查工作流仓库的核心文档、模板、脚本和 Skill 入口是否齐全。

命令：

```bash
npm run check
```

什么时候用：

- 修改模板后。
- 修改门禁脚本后。
- 修改 Skill 入口后。
- 准备提交前。

通过标准：

- 必要文档存在。
- 必要模板存在。
- `package.json` 暴露关键命令。
- Skill 能指向目标项目接入、Epic、Feature、Gate、Stack Policy。

## 2. 打包 Skill

用途：把源文件打包成 Codex / Claude Code 可安装的 Skill。

命令：

```bash
npm run build
```

输入来源：

- `skills/document-driven-workflow/SKILL.md`
- `docs/workflow/*.md`
- `docs/workflow/presets/`
- `docs/workflow/templates/`
- `scripts/workflow/`

输出目录：

```text
dist/skills/document-driven-workflow/
```

说明：

- `dist/` 是构建产物，不需要提交。
- 修改源文档、模板或脚本后，重新运行 `npm run build`。

## 3. 安装 Skill

用途：把打包后的 Skill 安装到本机 AI 工具。

安装到 Codex：

```bash
npm run setup:codex
```

安装到 Claude Code：

```bash
npm run setup:claude
```

同时安装到 Codex 和 Claude Code：

```bash
npm run setup:all
```

什么时候用：

- 第一次安装工作流。
- 修改 Skill 后想让 Codex / Claude Code 使用新版本。

注意：

- 安装后通常需要重启 Codex 或 Claude Code 才能加载最新 Skill。
- 安装命令会先自动执行一次构建。

## 4. 目标项目接入

用途：把这套工作流应用到一个真实项目。

推荐对 AI 的指令：

```text
使用 document-driven-workflow skill，把文档驱动工作流接入当前项目。
先阅读项目现有文档和脚本，不要覆盖已有文档。
只添加必要的 docs/workflow、模板、门禁脚本和 package.json 命令。
如果是老项目，先建立 legacy baseline 和 compatibility contract。
```

AI 应该做的事：

- 阅读目标项目现有 `README`、`AGENTS.md`、`CLAUDE.md`、`docs/`、`package.json`。
- 判断项目是新项目还是老项目。
- 复制必要工作流文档到目标项目 `docs/workflow/`。
- 复制必要模板到目标项目 `docs/workflow/templates/`。
- 复制必要脚本到目标项目 `scripts/workflow/`。
- 给目标项目增加高层命令，例如 `feature:new`、`epic:new`、`gate:dev`、`gate:epic`、`test:gates`。
- 保留目标项目原有 `build`、`dev`、`test`、`lint` 等命令。

当前边界：

- 目标项目接入由 AI 根据 Skill 执行，不是一个固定的一键脚手架。
- 这样做是为了避免覆盖老项目已有结构。

## 5. 创建 Epic

用途：处理一次跨多个模块的产品迭代。

命令：

```bash
npm run epic:new -- ai-fooler-upgrade
```

生成目录：

```text
docs/epics/ai-fooler-upgrade/
  00-source.md
  01-epic-brief.md
  02-requirement-inventory.md
  03-scope-breakdown.md
  04-risk-map.md
  05-release-plan.md
  06-acceptance-map.md
  07-progress-board.md
  08-retrospective.md
```

什么时候用：

- 一份需求文档涉及多个功能模块。
- 一次迭代需要分批发布。
- 需求里同时包含 UI、接口、权限、任务状态、计费、部署等多类风险。
- 需要先拆清楚优先级和风险，再进入单个功能开发。

不应该什么时候用：

- 只是一个明确的小功能。
- 只是文案、样式或低风险 UI 修改。
- 已经能直接写清楚目标、边界、验收和实现计划。

## 6. Epic 门禁

用途：判断 Epic 是否已经可以拆成多个 Feature。

命令：

```bash
npm run gate:epic -- -EpicPath docs/epics/ai-fooler-upgrade
```

门禁检查：

- 原始产品材料是否保留。
- Epic 状态是否可拆分。
- 是否有 `EREQ-*` 级需求清单。
- 是否有 Feature 拆分候选。
- 是否有 `RISK-*` 风险项。
- 是否有 Batch 1 发布计划。
- 验收映射是否能追溯到 Epic 需求。
- 是否存在 `TODO`、`TBD`、待确认、未确认、待补充。

通过后能做什么：

- 可以创建多个 Feature。

不能代表什么：

- 不代表可以直接写代码。
- 每个 Feature 仍必须通过 `gate:dev`。

## 7. 创建 Feature

用途：创建一个可以独立开发和验收的功能文档包。

命令：

```bash
npm run feature:new -- login-phone --stack next-fullstack
```

如果来自 Epic：

```bash
npm run feature:new -- drag-upload-hint --stack legacy-existing --epic ai-fooler-upgrade
```

生成目录：

```text
docs/features/login-phone/
  01-prd.md
  02-ui-spec.md
  03-technical-contract.md
  04-acceptance-criteria.md
  05-readiness-review.md
  06-implementation-plan.md
```

允许的 Stack Preset：

- `next-fullstack`
- `flutter-fastapi`
- `flutter-express`
- `legacy-existing`

约束：

- 新 Next.js 项目只支持 App Router。
- Pages Router 不能作为新项目方案。
- 老项目使用 `legacy-existing`，并先补齐 Legacy Baseline 和 Compatibility Contract。

## 8. Feature 门禁

用途：强制阻止不清楚的需求进入研发阶段。

命令：

```bash
npm run gate:dev -- -FeaturePath docs/features/login-phone
```

门禁检查：

- PRD、UI Spec、Technical Contract、Acceptance Criteria、Readiness Review、Implementation Plan 是否齐全。
- Readiness 是否为 `Ready`。
- 未确认问题是否为 `0`。
- 阻塞问题是否为 `0`。
- 假设是否已接受。
- 用户是否批准。
- 实现计划是否批准。
- 验收标准是否引用 `REQ-*`。
- 验收用例是否包含 `AC-*`。
- 技术栈是否符合 Stack Policy。
- 是否存在 `TODO`、`TBD`、待确认、未确认、待补充。

门禁失败时：

- AI 必须停留在文档阶段。
- 只能输出缺失项、阻塞项、未确认项和下一步补文档建议。
- 不能开始代码实现。

## 9. Legacy Baseline

用途：老项目第一次接入工作流时，记录项目现状。

模板：

```text
docs/workflow/templates/legacy/baseline.md
```

目标项目建议路径：

```text
docs/legacy/BASELINE.md
```

应记录：

- 技术栈和运行方式。
- 主要目录结构。
- 已有功能模块。
- 已有测试和部署方式。
- 已知风险。
- 不能轻易改动的行为。

什么时候必须有：

- `Stack Preset: legacy-existing`。
- 老项目第一次接入工作流。
- 涉及登录、支付、权限、数据库、任务状态、部署架构等高风险区域。

## 10. Compatibility Contract

用途：定义老项目不能破坏的兼容边界。

模板：

```text
docs/workflow/templates/legacy/compatibility-contract.md
```

目标项目建议路径：

```text
docs/legacy/COMPATIBILITY_CONTRACT.md
```

应记录：

- 不能改变的用户路径。
- 不能改变的 API 合约。
- 不能改变的数据结构或迁移边界。
- 不能改变的支付、登录、会员、权限行为。
- 必须保留的部署和环境变量约束。

作用：

- 防止 AI 把“接入工作流”误当成“顺手重构老项目”。
- 后续 Feature 修改必须尊重该契约。

## 11. Change Request

用途：修改已有功能时，避免只靠对话覆盖旧需求。

模板：

```text
docs/workflow/templates/change/change-request.md
```

目标项目建议路径：

```text
docs/changes/CR-0001.md
```

应记录：

- 当前行为。
- 期望行为。
- 影响的需求 ID。
- 影响的 UI、API、数据、权限、测试。
- 不允许改变的部分。
- 新增或修改后的验收标准。

使用方式：

- 先写 CR。
- 再更新相关 Feature 文档。
- 再重新运行 `gate:dev`。
- 最后实现、测试、更新验证报告。

## 12. ADR

用途：记录长期有效的技术或产品决策。

模板：

```text
docs/workflow/templates/decision/adr.md
```

目标项目建议路径：

```text
docs/decisions/ADR-0001.md
```

适用场景：

- 技术栈选择。
- 数据库选择。
- 认证方案。
- 支付方案。
- 部署架构。
- 是否引入第三方服务。

原则：

- ADR 记录决策，不记录普通代码细节。
- 旧 ADR 不直接删除，后续变更用新 ADR 替代。

## 13. Verification Report

用途：功能完成后记录验证结果，作为是否可上线的依据。

模板：

```text
docs/workflow/templates/feature/verification-report.md
```

目标项目建议路径：

```text
docs/features/<feature-id>/07-verification-report.md
```

应记录：

- 执行过的命令。
- 通过的测试。
- 失败项和修复结果。
- 未验证项。
- 剩余风险。
- 每个需求 ID 的覆盖情况。
- 是否达到上线要求。

## 14. 门禁回归测试

用途：验证门禁脚本没有失效。

命令：

```bash
npm run test:gates
```

检查内容：

- 不完整 Epic 必须失败。
- Ready Epic 必须通过。
- 不完整 Feature 必须失败。
- Ready Feature 必须通过。
- Next.js Pages Router 必须被拦截。

什么时候用：

- 修改门禁脚本后。
- 修改模板字段后。
- 修改 Stack Policy 后。
- 提交前。

## 15. 完整测试

用途：一次性验证构建、自检和门禁回归。

命令：

```bash
npm test
```

等价于：

```bash
npm run build
npm run check
npm run test:gates
```

提交前应至少运行一次。

## 16. 推荐使用路径

新项目：

```text
选择 Stack Preset
-> 创建 Feature
-> 补齐 PRD / UI Spec / Technical Contract / Acceptance
-> Readiness Review
-> Implementation Plan
-> gate:dev
-> 实现
-> 测试
-> Verification Report
```

老项目：

```text
Legacy Baseline
-> Compatibility Contract
-> 创建 Feature 或 Epic
-> gate
-> 实现
-> 测试
-> Verification Report
```

产品迭代：

```text
Epic
-> gate:epic
-> 多个 Feature
-> 每个 Feature 独立 gate:dev
-> 分批实现和验证
-> Epic Progress Board
-> Retrospective
```

修改已有功能：

```text
Change Request
-> 影响分析
-> 更新 Feature 文档
-> gate:dev
-> 实现
-> 回归测试
-> Verification Report
```

