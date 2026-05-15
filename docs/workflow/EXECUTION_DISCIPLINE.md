# Execution Discipline

这份规则用于防止 AI 在 Feature gate 通过后实现跑偏。它不是要复制一套很重的通用工程方法，而是让实现持续绑定到已批准的 Feature 文档。

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
- Next.js 前端工作优先使用 Tailwind CSS utility classes。只有在项目既有约定、第三方库集成、全局样式或 Tailwind 难以清楚表达时，才使用单独 CSS。
- 引入新抽象前，先遵守目标项目既有结构和命名。
- 不要因为发现重复就做大范围重构。抽取必须绑定当前 Feature 和已批准范围。

## Evidence Rule

没有新的命令输出或明确的人工验证证据，就不能声称完成。

验证报告是记录证据的必填位置。
