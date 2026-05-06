# 强制门禁

本文定义文档驱动交付中的强制门禁。门禁不是提醒，而是进入下一阶段前必须通过的检查。

## 1. 门禁层级

### 结构门禁

结构门禁检查仓库是否具备基本工作流能力。

执行命令：

```bash
npm run check
```

检查内容：

- 工作流文档存在。
- AI 协作入口存在。
- Codex 和 Claude Code 入口存在。
- 模板存在。
- 脚本存在。
- 本地技能源文件存在。
- 文档中明确写入开发门禁规则。

### 开发门禁

开发门禁检查某个功能是否允许进入代码实现阶段。

执行命令：

```bash
npm run gate:dev -- -FeaturePath docs/features/<feature-id>
```

只有开发门禁通过，AI 才能开始实现代码。

## 2. 功能文档包结构

每个功能建议放在独立目录：

```text
docs/features/<feature-id>/
  01-prd.md
  02-ui-spec.md
  03-technical-contract.md
  04-acceptance-criteria.md
  05-readiness-review.md
  06-implementation-plan.md
```

## 3. 开发门禁通过条件

`05-readiness-review.md` 中必须包含：

```text
- Readiness: Ready
- Unresolved Questions: 0
- Blocking Issues: 0
- Assumptions Accepted: yes
- User Approval: Approved
- Implementation Plan Status: Approved
```

同时必须满足：

- PRD 存在。
- UI Spec 存在。
- Technical Contract 存在。
- Acceptance Criteria 存在。
- Readiness Review 存在。
- Implementation Plan 存在。
- 验收标准中至少包含一个 `REQ-` 和一个 `AC-`。
- 功能文档中不能包含 `TODO`、`TBD`、`待确认`、`未确认`、`待补充`。

## 4. 门禁失败时怎么办

如果门禁失败，AI 必须停在文档阶段，并输出：

- 缺失文件。
- 未确认问题。
- 阻塞问题。
- 需要用户确认的假设。
- 建议下一步只补哪一份文档。

不能绕过门禁进入代码实现。

## 5. 允许的例外

只有一种例外：用户明确要求“生成草案”或“做技术探索”，并且不进入正式研发。

这种情况下，输出必须显式标注：

- 关键假设
- 未确认问题
- 不可用于开发

