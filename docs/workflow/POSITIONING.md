# 定位与取舍

这套工作流的定位是“产品需求结构化 Skill”，不是通用工程方法论大全。它的核心价值是把产品输入变成可追溯、可审核、可执行、可验证的研发单元。

## 适合谁

适合以下使用者：

- 用中文产品文档、UI 图、验收标准和 AI 协作的独立开发者或小团队。
- 希望从需求、拆解、实现、测试到部署都有留痕的产品负责人。
- 有多个 Next.js 全栈项目或 Flutter App 项目，需要统一交付方式的人。
- 希望用 Maestro 管多个项目，但仍然让每个项目按同一套文档、门禁和验证证据执行的人。
- 已有老项目，希望 AI 先理解当前行为和兼容边界，再安全迭代的人。
- 不希望每个项目都复制一套 workflow scripts，也不希望目标项目的 `package.json` 被工作流污染的人。

不适合以下场景：

- 只想让 AI 临时改一行代码，不关心需求来源和验收留痕。
- 团队已经有成熟的 Jira / Linear / CI / QA 体系，并且不需要 AI 生成结构化文档。
- 希望工作流自动完成所有产品判断、自动批准、自动上线且无人审查。
- 需要强制级别的工程训练框架，例如每个任务都必须严格 TDD、强制多 agent 代码审查、强制 worktree 分支收尾。

## 核心优势

1. 文档是需求源头  
   原始需求、Epic、Feature、验收标准、验证报告和产品追溯之间有明确关系。

2. 面向产品迭代，而不是只面向代码任务  
   一个大需求可以先进入 Epic，再拆成多个可独立开发和测试的 Features。

3. 单次用户批准  
   用户只需要审查文档后批准一次，批准状态只写入 `00-workflow.yaml`，避免多个 Markdown 文件里到处改状态。

4. 硬门禁阻止跑偏  
   没有明确需求 ID、验收标准、Scope Lock、测试计划和用户批准时，Feature 不能进入实现。

5. 目标项目轻量  
   脚本、模板和门禁留在 Skill 内。目标项目只保存自己的 `docs/` 交付文档，不需要修改项目 `package.json` 暴露工作流命令。

6. 适合长期维护  
   通过 `docs/product/requirement-ledger.md`、`docs/product/traceability.md`、验证报告和变更请求保留产品历史。

7. 对老项目更安全  
   老项目先建立 baseline 和 compatibility contract，再进入 Feature 开发，减少 AI 误改已有行为。

8. 可被 Maestro 驾驭  
   通过 `doctor --json`、`status --json`、`handoff-pack --json` 和 `finish-feature --json`，让 Maestro 读取项目状态、派发单 Feature 任务、收集完成证据，而不需要目标项目复制 workflow scripts。

9. 适合多项目并行的单项目协议  
   它不自己调度多个项目，而是把每个项目的状态、边界、交接输入和完成证据标准化。Maestro 可以据此判断哪些项目能并行、哪些 Feature 必须等待依赖完成。

10. 可维护性默认进入实现约束  
    Feature 执行阶段要求遵守 Scope Lock、自审、重复逻辑抽取、单文件膨胀控制和验证证据更新，减少 AI 按文档实现但代码失控的问题。

## 与 Superpowers 的区别

Superpowers 更像一套通用工程纪律框架，强项是：

- 系统化 debugging。
- 严格 TDD。
- 代码审查流程。
- 多 agent 执行纪律。
- worktree / branch 收尾流程。

`document-driven-workflow` 更像产品需求到研发交付的主流程，强项是：

- 从产品文档开始。
- 自动生成 Epic / Feature 文档包。
- 用 gate 判断能不能进入研发。
- 用验证报告和 traceability 留下交付证据。
- 让不同项目共用同一套需求结构化方式。

两者不是同一种东西。Superpowers 管的是“怎么严谨地写代码和排错”，本工作流管的是“需求如何被结构化、批准、实现、验证和追溯”。

## 为什么不用 Superpowers 做主流程

Superpowers 的问题不是能力不足，而是对本工作流目标来说过重：

- 它默认更偏工程执行，不是从产品需求、UI 图和验收标准开始组织交付。
- 它的步骤多，适合高风险工程任务，但对普通产品迭代会变慢。
- 它不天然沉淀 Epic / Feature / Requirement Ledger / Traceability 这种产品历史结构。
- 它不能直接解决“新用户只用产品文档跟 AI 对接”的问题。

因此本工作流应该作为主流程；Superpowers 中有效的 debugging、TDD、review discipline 可以被轻量吸收为执行纪律，而不是反过来让 Superpowers 主导产品交付。

## 替代边界

可以替代：

- 需求接入。
- 需求拆解。
- Epic / Feature 文档生成。
- 用户批准。
- 开发前 gate。
- 实现交接。
- 验证报告。
- 产品追溯。
- 多项目调度里的单项目任务协议。
- Codex / Claude worker 的 Feature 交接包。

暂不完全替代：

- 复杂 bug 的强制根因分析训练。
- 每个任务都必须 red-green-refactor 的严格 TDD。
- 真正自动调度多个 subagent 写代码并合并结果。
- 完整代码评审体系。
- Maestro 这类多项目 mission 调度器。

本工作流的策略是：主流程轻量、门禁刚性、执行纪律够用；只有真实项目证明需要时，才增加更重的自动化。

## 与 Maestro 组合后的定位

`document-driven-workflow + Codex + Maestro` 的合理分工是：

- `document-driven-workflow` 定义单个项目如何从需求进入、如何拆成 Feature、何时允许实现、完成时需要哪些证据。
- Codex / Claude Code 执行具体 Feature，实现代码、跑测试、修复问题并更新验证报告。
- Maestro 负责多个项目之间的 mission、依赖、派发、状态汇总和跨项目集成验收。

这意味着它适合同时推进多个项目，但稳定运行的前提是：每个目标项目先通过 `doctor --json`，每个可开发 Feature 都有 `handoff-pack.json`，worker 完成后 `finish-feature --json` 通过并生成 `COMPLETION_PROOF.json`，跨项目接口和联调风险由 Maestro 的 mission 或 Integration Contract 管理。
