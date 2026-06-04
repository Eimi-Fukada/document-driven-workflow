# Execution Discipline

这份规则用于防止 AI 在 Feature gate 通过后实现跑偏。它不是要复制一套很重的通用工程方法，而是让实现持续绑定到已批准的 Feature 文档。

## Feature Execution Contract

用户批准进入开发，只表示当前 Feature 可以按已批准文档进入实现，不表示实现 agent 可以按最快路径自由落地。

实现 agent 必须遵守：

- 一次只执行一个 Feature。即使一个 Epic 下有多个 Feature，也不能连续实现多个模块后再统一验收。
- 每个 Feature 开工前重新锁定 `08-context-pack.md`、`04-acceptance-criteria.md` 和 `06-implementation-plan.md`。
- 每个 Feature 完成后必须立即更新 `07-verification-report.md`，运行 `finish-feature.mjs`，并确认结果为 `PASS`。
- 当前 Feature 没有通过 `finish-feature.mjs` 并写入 `COMPLETION_PROOF.json` 前，不得开始下一个 Feature。
- 构建、类型检查或 lint 通过，只能作为验证证据的一部分，不能替代需求 ID、验收 ID、范围和变更文件映射。
- Build/typecheck alone is not completion evidence.
- 如果 `04-acceptance-criteria.md` 启用了 Coverage Matrix，每个 `COV-*` 都是完成范围。实现 agent 可以按 3-5 个覆盖项分批推进，但每批完成后都要补充验证证据；全部覆盖项没有实现证据、验证证据和 Passed 状态前，不得报告完成。
- 使用 Stall Guard 观察长任务：短任务不要求定时汇报；长时间无输出或无进展时才暂停报告卡点。
- 不要手动把 `00-workflow.yaml` 标记为 `verified`；真正完成以 `finish-feature.mjs` 的 PASS 结果、`COMPLETION_PROOF.json` 和验证报告为准。

## 必读输入

代码修改前，实现 agent 必须阅读：

```text
00-workflow.yaml
00-intake-review.md
01-prd.md
03-technical-contract.md
04-acceptance-criteria.md
06-implementation-plan.md
08-context-pack.md
```

Light Feature 使用 `01-light-feature.md`，不强制使用完整 Feature 文档包。

## Scope Lock

实现必须留在以下范围内：

- 已批准 requirement IDs
- 已批准 acceptance IDs
- 允许范围
- 允许文件或模块
- 已批准 Stack Preset

实现不能改动：

- 文档里的非目标
- 禁止范围
- 认证、支付、权限、会员权益、数据库、任务状态、部署或迁移边界，除非文档明确批准
- 老项目兼容契约
- 无关 UI、文案、行为或重构

如果代码现状与已批准文档冲突，先停下来报告冲突，再继续编辑。

## Implementation Deviation Stop Rule

当实现路径与文档不一致时，必须停下来报告，不得自行用更快、更简单或更小改动的方案替代。

必须暂停并让用户确认的情况包括：

- 文档有推荐方案，而实现 agent 想采用另一个方案。
- 文档把某个方案标为 rejected、fallback、仅小规模可用或非推荐方案，而实现 agent 想采用它。
- 为了少改后端、少改接口或快速上线，准备把服务端方案降级为前端兜底方案。
- 计划只实现部分保护、部分接口、部分状态或部分验收项。
- Feature 文档声明了 Coverage Matrix，但计划只实现其中一部分 `COV-*` 覆盖项。
- 需要修改 allowed scope 之外的文件或模块。
- 需要触碰 forbidden scope、非目标、兼容契约、认证、支付、权限、额度、会员、任务状态、数据库、部署或迁移边界。
- 只能证明 build/typecheck 通过，但还没有证明 REQ / AC 逐项满足。

暂停时，输出应包含：

- 冲突的文档位置。
- 原批准方案。
- 准备采用的新方案。
- 差异、风险和影响的验收项。
- 是否需要更新 Feature 文档、ADR 或重新获得用户批准。

用户没有确认前，不能继续实现偏离方案。

## Stall Guard

Stall Guard 用于防止 AI worker 长时间运行但没有任务推进。它不是新的审批流程，不是完成门禁，也不替代 `finish-feature.mjs`；它只提供长任务的执行可观测性。

短任务不需要额外汇报。只有出现下面任一情况时才触发 Stall Guard：

- Feature 预计执行时间超过 30 分钟。
- Coverage Matrix 超过 5 个覆盖项，需要分批执行。
- 单个命令、构建、测试或调试过程预计较长。
- Maestro 或其他上层编排器正在派发多个 worker。
- 实际已经超过 15 分钟，但没有文件变更、命令输出、验证证据或明确阶段结果。

触发后，agent 应遵守：

- 每 15-30 分钟向用户或上层编排器报告一次进展。
- 进展报告必须包含当前处理的 `REQ-*` / `AC-*` / `COV-*`、已修改文件、正在运行的命令、已获得的验证证据和下一步。
- 如果 15 分钟内没有文件变更、没有命令输出、没有验证证据或没有明确阶段结果，必须暂停并报告卡点。
- 如果单个命令 15 分钟没有任何输出，应检查进程、日志或中止后报告原因；不要无限等待。
- 如果预计单个 Feature 会超过 60-90 分钟，应按 Coverage Matrix、模块或执行批次拆分推进；这不代表拆成多个 Feature，除非业务闭环本身应该拆。
- 不能用“仍在处理”“继续实现中”作为有效进展。有效进展必须能映射到文档、文件、命令或验证证据。

Stall Guard 触发时，agent 应输出：

- 当前 Feature 路径和本批次目标。
- 已完成的 REQ / AC / COV。
- 已修改或计划修改的文件。
- 卡住的命令、文件、接口或不确定点。
- 下一步建议：继续等待、缩小批次、补充文档、请求用户决策，或中止当前命令。

Stall Guard 只影响执行过程透明度，不影响完成判定。没有触发或没有记录 Stall Guard，不应导致 `finish-feature.mjs` 失败；但触发后仍沉默运行时，agent 应先报告卡点，再继续。

## TDD Trigger

高风险或规则密集行为需要 TDD：

- 权限
- 会员或额度
- 定价或权益
- 任务状态
- 文件上传或下载
- API 校验
- 数据转换
- 有可复现症状的 bug 修复

低风险纯 UI 改动建议使用 TDD，但不强制。

当 TDD required 时，实现计划和验证报告必须记录：

- 实现前失败测试或缺失测试
- 实现改动
- 实现后通过测试

## Debugging Trigger

Feature 是 bug 修复，或实现过程中发现非预期行为时，需要 systematic debugging。

验证报告必须记录：

- 症状
- 复现路径
- 观察到的证据
- 根因
- 修复位置
- 回归测试或验证命令

不知道根因时，不要靠猜测打补丁。

## Self Review

声称完成前，对照已批准文档审查 diff：

- 每个改动文件都能映射到需求或测试
- 每个需求都有实现证据
- 每个验收项都有验证证据
- 启用 Coverage Matrix 时，每个 `COV-*` 都有实现证据、验证证据和 Passed 状态
- 禁止范围没有被触碰
- 非目标仍然保持不变
- 适用时已更新产品追溯
- 未验证项和剩余风险明确写出

## Maintainability Guardrails

实现应在不突破已批准 Feature 范围的前提下保持可维护。

默认规则如下，除非目标项目已有更强本地约定：

- 如果同一页面结构、UI 块、有状态逻辑、数据映射或校验逻辑出现 2 or more times，考虑抽取 component、hook、helper、service 或 shared module。
- 不要为了只出现一次的代码强行抽象，除非它确实降低风险或符合项目既有模式。
- 避免文件无限膨胀。单个源文件尽量保持在 1000 lines 以下；如果触碰的文件已经接近或超过该大小，优先考虑聚焦抽取，而不是继续叠加职责。
- 技术栈专属实现规则以当前 Feature 的 Stack Preset 为准，例如 Next.js、Flutter、FastAPI 或 Express 的目录结构、样式方案、API 契约和测试要求。
- 引入新抽象前，先遵守目标项目既有结构和命名。
- 不要因为发现重复就做大范围重构。抽取必须绑定当前 Feature 和已批准范围。

## Performance Discipline

性能要求使用触发式规则，不把所有小改动都变成压测任务。

当 Feature 命中下面任一场景时，技术契约、实现计划和验证报告必须记录性能判断：

- 后端大表查询、子查询、聚合、分页、批处理、定时任务、队列或并发写入。
- 数据库索引、事务、缓存、幂等、重试、超时、N+1 查询或数据迁移。
- 文件上传、下载、音视频、图片处理或第三方接口轮询。
- 前端长列表、大表格、无限滚动、复杂图表、canvas、频繁轮询、大量状态更新或大文件处理。
- 任何可能随数据量增长明显变慢的路径。

命中后至少记录：

- 数据量或并发量假设。
- 主要性能风险。
- 推荐方案的性能理由。
- 需要的索引、分页、缓存、虚拟滚动、批处理、限流或异步化策略。
- 验证方式，例如 explain plan、接口耗时、分页 smoke、长列表渲染验证或关键操作手工验证。

不命中性能风险时，可以明确写 `not-applicable`，不要制造无意义的性能工作。

## Option And Closure Advisory

当实现方案不唯一，或用户提出的方向可能不闭环时，AI 必须先提示，再实施。

需要提示用户的情况包括：

- 存在多个可行方案，且成本、风险、维护性或性能差异明显。
- 当前需求缺少入口、出口、状态流转、异常处理、权限、日志、回滚、部署或验证条件。
- 当前改动可能影响登录、支付、额度、会员、任务状态、数据统计、SEO、移动端或跨项目接口。
- 用户提出的技术路线明显老旧，主流方案已有更好选择。
- 继续实施会让产品、技术或测试闭环断裂。

提示方式：

- 明显阻断闭环或高风险时，停在文档阶段，要求补充或用户确认。
- 只是存在更优方案时，给出方案对比、推荐结论和风险说明。
- 用户选择旧方案或高风险方案时，把决定写入实现计划、ADR 或 assumptions，再继续。

## Evidence Rule

没有新的命令输出或明确的人工验证证据，就不能声称完成。

验证报告是记录证据的必填位置。

## Option Decision Contract

<!-- zh: 方案偏离要显性化。机器不假装完全读懂代码语义，但必须要求文档和验证报告记录真实选择。 -->

When implementation has multiple viable paths, the Feature documents must use stable option IDs:

```text
OPT-001
OPT-002
```

The implementation plan must record:

- `Selected option`
- `Rejected options`
- `Fallback options`
- `User override required`
- `User override reason`

The agent must implement the selected option. If implementation needs a rejected or fallback option, the agent must stop before editing further and ask the user to update and approve the Feature documents.

Completion checks only enforce explicit traceability. They do not pretend to fully infer implementation semantics from code.
