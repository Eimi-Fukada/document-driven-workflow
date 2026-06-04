# Language Policy

<!-- zh: 语言分层策略：用户看中文，机器读英文，内部规则英文为主并用中文注释帮助维护。 -->

This workflow uses a split language model:

- User-facing generated documents are written in Chinese.
- Machine-readable protocol is written in English / ASCII.
- Internal Skill references use English normative rules, with optional Chinese maintainer notes in HTML comments.
- Technical stack presets use English normative rules, with Chinese notes only when they help maintainers.

## User-Facing Documents

<!-- zh: 目标项目里给用户审核、验收、追溯的文档保持中文。 -->

Generated project documents should be readable by Chinese users:

- `docs/epics/*`
- `docs/features/*`
- `docs/product/*`
- `docs/legacy/*`
- `REVIEW.md`
- `APPROVAL_REVIEW.md`
- `07-verification-report.md`

The human-facing body should be Chinese. Machine fields inside those documents stay English when they are matched by scripts or shared with agents.

Example:

```yaml
approval: approved # 已批准
readiness: ready # 可进入开发
status: verified # 已通过完成门禁
```

## Internal Skill References

<!-- zh: Skill 内部文档给 AI 和维护者看，英文规则更稳定，中文只做维护注释。 -->

Internal references should prefer English normative text:

- `SKILL.md`
- `GATES.md`
- `EXECUTION_DISCIPLINE.md`
- `EXECUTION_PROTOCOL.md`
- `AUTOMATION.md`
- `MODE_ROUTER.md`
- `STACK_POLICY.md`
- `MAESTRO_INTEGRATION.md`
- `references/presets/*`

Chinese maintainer notes may be added as HTML comments:

```md
## Completion Gate

<!-- zh: 完成门禁：AI 不能用 build 通过代替完成。 -->

`finish-feature.mjs` is the only valid completion exit.
Build, typecheck, or lint success is verification evidence only.
```

The English text is the normative execution rule. Chinese comments are for maintainers and should not introduce separate behavior.

## Machine Protocol

<!-- zh: 机器协议必须稳定，避免中文编码、全角符号和状态匹配问题。 -->

The following surfaces must stay English / ASCII:

- `00-workflow.yaml` field names and values
- JSON output
- CLI stdout / stderr
- gate check names
- blocker types
- status values
- `COMPLETION_PROOF.json`
- `handoff-pack.json`
- Maestro machine interfaces
- test assertions

Examples:

```text
approved
ready
blocked
not-applicable
verification_blocker
```

Do not use Chinese status values for machine checks.

## Review Surface

<!-- zh: 用户主要审核摘要、风险选择和验收表，不需要每次读完整文档包。 -->

Every Epic or Feature should provide a concise `REVIEW.md` for user review. Full documents remain available for traceability and implementation, but the default user review path should focus on:

- Review summary
- Scope and non-goals
- Risk and mode decision
- Option decision
- Acceptance table
- Coverage table when needed
- User confirmation checklist

