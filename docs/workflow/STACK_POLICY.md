# 技术栈策略

本工作流固定技术栈是为了减少项目分叉、降低维护成本，并让测试、部署、文档模板和门禁规则可复用。

## 1. 总原则

- 使用主流、稳定、长期维护的技术栈。
- 新项目只允许使用标准 Stack Preset。
- 不使用过时路线、冷门框架或实验性方案作为默认技术栈。
- 技术栈变更必须通过 ADR 记录。
- 老项目优先保护兼容边界，不强行重写。

## 2. 标准 Stack Preset

### next-fullstack

用于 Web、SaaS、官网、管理后台和工具类全栈产品。

硬性规则：

- 只支持 Next.js App Router。
- 不允许使用 Pages Router 作为新项目方案。
- 使用 TypeScript。
- 默认需要 Playwright 覆盖关键路径。

### flutter-fastapi

用于 Flutter 移动端加独立后端。

硬性规则：

- Flutter 使用 stable 通道。
- 后端使用 FastAPI。
- API 契约必须以 OpenAPI / Pydantic 模型为准。
- 默认需要 Flutter 测试、后端 pytest 和关键路径集成测试。

### flutter-express

用于已有 Node.js / Express 后端资产的项目。

硬性规则：

- 这是例外预设，不是新项目默认方案。
- 必须填写 Exception Reason。
- 后端必须使用 TypeScript。
- API 入参和返回建议使用 Zod 或等价 schema 校验。

### legacy-existing

用于老项目接入。

硬性规则：

- 必须存在 `docs/legacy/BASELINE.md`。
- 必须存在 `docs/legacy/COMPATIBILITY_CONTRACT.md`。
- 技术升级必须通过 ADR。
- 新增和修改功能仍必须通过功能级开发门禁。

## 3. 禁止项

新项目禁止：

- Next.js Pages Router。
- 无 TypeScript 的 Next.js 全栈项目。
- 未声明数据库和部署方式。
- 未声明测试命令。
- 随意选择 Firebase、MongoDB、Supabase、SQLite、MySQL 等替代默认数据方案，除非有 ADR。

老项目禁止：

- 借接入工作流顺手大版本升级。
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

