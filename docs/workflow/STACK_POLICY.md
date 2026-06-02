# 技术栈策略

固定常用技术栈的目的，是减少常见项目分叉、降低维护成本，并让文档模板、门禁、测试和部署流程可以复用。

本工作流的核心是文档驱动，不是技术栈驱动。内置 Stack Preset 只为常用技术栈提供额外约束；没有内置 preset 的 Java、Go、Python、Rust、桌面端、CLI 或其他项目，仍然可以使用文档驱动流程。

## 1. 总原则

- 使用主流、稳定、长期可维护的技术栈。
- 新项目优先使用标准 Stack Preset；没有内置 preset 的技术栈可以使用自定义 stack 名称。
- 不把过时路线、冷门框架或实验性方案作为默认选择。
- 技术栈变更必须通过 ADR 记录。
- 老项目优先保护兼容边界，不借接入工作流强行重写。
- 自定义 stack 不触发 Next / Flutter 专属门禁，但必须在技术契约、实现计划和 Context Pack 中写清框架边界、验证命令和验收证据。

## 2. 标准 Stack Preset

### next-fullstack

用于 Web、SaaS、官网、管理后台和工具类全栈产品。

硬规则：

- 只支持 Next.js App Router。
- 新项目不允许使用 Pages Router。
- 使用 TypeScript。
- 默认需要 Playwright 覆盖关键路径。

### flutter-fastapi

用于 Flutter 移动端加独立后端。

硬规则：

- Flutter 使用 stable 通道。
- 后端使用 FastAPI。
- API 契约以 OpenAPI / Pydantic 模型为准。
- 默认需要 Flutter 测试、后端 pytest 和关键路径集成测试。

### flutter-express

用于已有 Node.js / Express 后端资产的项目。

硬规则：

- 这是例外预设，不是新项目默认方案。
- 必须填写 Exception Reason。
- 后端必须使用 TypeScript。
- API 入参和返回建议使用 Zod 或等价 schema 校验。

### legacy-existing

用于老项目接入。

硬规则：

- 必须存在 `docs/legacy/BASELINE.md`。
- 必须存在 `docs/legacy/COMPATIBILITY_CONTRACT.md`。
- 技术升级必须通过 ADR。
- 新增和修改功能仍必须通过功能级 gate。

### custom stack

用于当前工作流没有内置规则的技术栈，例如 Java / Spring Boot、Go、Python、Rust、Electron、桌面端、CLI 工具或其他框架。

规则：

- `stack_preset` 可以使用小写字母、数字和 hyphen，例如 `java-springboot`、`go-service`、`python-fastapi`。
- 不触发 Next.js、Flutter 或 Express 的专属规则。
- 必须在 `03-technical-contract.md` 写清真实技术栈、框架、数据库、部署方式和测试命令。
- 必须在 `06-implementation-plan.md` 和 `08-context-pack.md` 写清该技术栈的实现规则、性能边界和验证方式。
- 工作流核心不维护 custom stack 的默认验证命令；每个 Feature 必须根据目标项目现状声明自己的验证命令，例如 Gradle、Maven、Go、pytest 或其他项目已有命令。
- AI 可以根据项目已有代码和框架常识补充建议，但不能把未内置的技术栈当作工作流阻塞项。

## 3. 禁止项

新项目禁止：

- Next.js Pages Router。
- 非 TypeScript 的 Next.js 全栈项目。
- 未声明数据库和部署方式。
- 未声明测试命令。
- 随意选择 Firebase、MongoDB、Supabase、SQLite、MySQL 等替代默认数据方案，除非有 ADR。

老项目禁止：

- 借接入工作流顺手做大版本升级。
- 借新增功能重写登录、支付、权限、数据模型。
- 未写兼容契约就修改已有 API 返回结构。
- 未写 ADR 就替换框架、ORM、数据库或部署平台。

## 4. 门禁字段

每个功能的 `03-technical-contract.md` 必须包含：

```text
- Stack Preset: next-fullstack
- Project Mode: greenfield
- Exception Reason: none
```

老项目使用：

```text
- Stack Preset: legacy-existing
- Project Mode: legacy
- Legacy Baseline: docs/legacy/BASELINE.md
- Compatibility Contract: docs/legacy/COMPATIBILITY_CONTRACT.md
```

自定义技术栈示例：

```text
- Stack Preset: java-springboot
- Project Mode: greenfield
- Exception Reason: custom stack; no built-in preset
```
