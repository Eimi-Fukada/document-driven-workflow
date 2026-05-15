# AI 协作规则

本仓库维护 `document-driven-workflow` Skill。这个仓库的产物不是某一个业务项目，而是一套可以接入不同项目的文档驱动交付流程。

## 工作原则

- 文档是需求源头。
- 代码是实现产物。
- 测试和验证报告是验收证据。
- 非平凡功能必须能追溯到需求 ID，例如 `REQ-AUTH-001`。
- 产品源头历史保存在 `docs/product/requirement-ledger.md`，交付覆盖关系保存在 `docs/product/traceability.md`。
- 没有明确验收标准、没有通过门禁时，不进入代码实现。
- Feature gate 通过后，必须遵守 `EXECUTION_DISCIPLINE.md` 中的 Scope Lock、TDD / debugging 触发条件、自审和证据规则。
- 实现时要考虑长期维护性：出现 2 repeated uses 以上的重复结构或逻辑时考虑抽取；触碰的单文件尽量不超过 1000 lines；Next.js UI 优先使用 Tailwind CSS。
- 工作流本身不保留历史兼容补丁，除非有明确迁移理由。

## 状态模型

每个 Epic、Feature、Light Feature 都只使用一个机器可读控制文件：

```text
00-workflow.yaml
```

批准状态、可开发状态、当前状态、技术栈预设、未解决问题数、阻塞问题数、假设是否接受，都只放在这个文件里。

不要再在 PRD、readiness review、hydration notes、agent plan 等 Markdown 文件里添加独立批准字段。

## 默认交付顺序

1. 按 `docs/workflow/MODE_ROUTER.md` 判断 Direct、Light、Standard、Epic 或 Strict。
2. 创建或补全最小安全文档包。
3. 当已有明确来源、需求 ID 和验收 ID 时，同步产品追溯文档。
4. 让用户审查文档。
5. 用户明确批准后，只通过 `workflow:approve` 更新一次批准状态。
6. 运行 `gate:epic` 或 `gate:dev`。
7. 门禁通过后才进入实现。
8. 完成后执行自审、验证、追溯更新，并更新验证报告。

## 命令

维护本仓库：

```bash
npm run check
npm test
```

Feature gate：

```bash
npm run gate:dev -- docs/features/<feature-id>
```

Epic gate：

```bash
npm run gate:epic -- docs/epics/<epic-id>
```

目标项目不要为了暴露工作流命令而修改自己的 `package.json`。安装后的 Skill 会用 `--target <project-root>` 调用内置脚本。

## 边界

- 新 Next.js 项目只支持 App Router。
- 老项目使用 `legacy-existing`，并且必须先有 `docs/legacy/BASELINE.md` 与 `docs/legacy/COMPATIBILITY_CONTRACT.md`。
- 修改已有行为时使用 `docs/changes/CR-xxxx.md`。
- Standard 和 Strict Feature 应包含 `00-intake-review.md` 与 `08-context-pack.md`。
- 尊重文档里的非目标和禁止改动。
- 如果代码现状与文档冲突，先报告冲突和方案，不要直接实现。
