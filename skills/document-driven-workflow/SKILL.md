---
name: "document-driven-workflow"
description: "Use when a project should be delivered from product documents, UI specs, acceptance criteria, Epic/Feature breakdown, readiness gates, legacy adoption, Maestro/Codex handoff, or AI-managed implementation evidence."
---

# Document Driven Workflow

<!-- zh: 文档驱动交付 Skill。用户用产品文档、UI 图和验收标准对接 AI，AI 负责结构化文档、门禁、实现、验证和留痕。 -->

Treat this Skill as a document-driven delivery workflow, not as a project template.
The user provides product material, UI references, and acceptance criteria.
The agent creates or hydrates reviewable documents, runs gates, implements only after approval, verifies the work, and records completion evidence.

## Language Policy

<!-- zh: 用户生成文档用中文；机器字段、脚本、JSON 和协议用英文/ASCII；内部规则英文为主，中文注释只帮助维护者阅读。 -->

Follow `references/LANGUAGE_POLICY.md`.

- User-facing generated documents must be written in Chinese.
- Machine-readable protocol must stay English / ASCII.
- Internal Skill references use English normative rules, with optional short Chinese maintainer notes in HTML comments.
- Machine fields, status values, JSON, CLI output, gate names, and IDs stay English.

## Core Rules

<!-- zh: 这些是执行层硬规则。用户批准开发不等于允许 AI 自由落地。 -->

- Keep reusable scripts, gates, templates, and rules inside the Skill.
- Target projects keep only their own project documents under `docs/`.
- Do not modify a target project's `package.json` just to expose workflow commands.
- Long-lived target projects should run `adopt.mjs --target <project-root>` so project-level `AGENTS.md` keeps future Codex / Claude turns aligned with this workflow.
- Every Epic, Feature, and Light Feature uses exactly one machine-readable state source: `00-workflow.yaml`.
- Implementation may start only after the relevant gate passes.
- Route and risk are `AI draft + one user confirmation`. The executable state is the `00-workflow.yaml` values such as `route_decision: user_confirmed`, `risk_level`, `hard_risk_blockers`, `expected_runtime`, and `execution_slicing`.
- Only objective hard risks can block user downgrade: authentication/session/token, payment, permission, database/schema migration, destructive data change, security, production deployment, task-state consistency, or legacy core compatibility breakage.
- User approval to start development does not permit free implementation. The agent must implement only the current Feature according to `08-context-pack.md`, acceptance criteria, and Scope Lock.
- One Feature must close independently before another Feature starts.
- `finish-feature.mjs` is the only valid completion exit. Build, typecheck, or lint success is verification evidence only.
- Do not manually mark `00-workflow.yaml` as `verified`; completion requires `finish-feature.mjs` PASS and `COMPLETION_PROOF.json`.
- If implementation conflicts with the approved option, rejected/fallback options, allowed scope, forbidden scope, non-goals, or acceptance criteria, stop and ask the user to confirm a document change before continuing.
- Maintainability matters inside the approved scope: consider extraction after 2 repeated uses, avoid touched source files growing past 1000 lines when practical, and follow the active Stack Preset.
- Use Coverage Matrix when a Feature contains multiple modules, pages, tools, states, APIs, or enumerated coverage items. All `COV-*` rows must have implementation evidence, changed-file evidence, verification evidence, and Passed status before completion.
- For a small defect inside an already approved Feature, use the defect-fix fast path: keep the existing Feature, confirm the fix is inside Scope Lock, update only necessary acceptance / verification evidence, and finish through `finish-feature.mjs`; do not rehydrate or redraft the whole workflow package.
- Avoid duplicate expensive verification. During implementation, prefer targeted checks; let `finish-feature.mjs` be the final completion exit. If an expensive full check is run before finish, record it as evidence, but do not rerun broad checks casually unless code changed after the evidence or coverage/risk requires it.
- Use Stall Guard only for long or silent work: if expected runtime is over 30 minutes or no file change / command output / verification evidence appears for 15 minutes, pause and report the blocker. Stall Guard is not a completion gate.
- When performance-sensitive paths appear, record the performance risk, mitigation, and verification evidence.
- When the user direction may not close the product or technical loop, provide option and closure advice before implementation.

## Execution Order

<!-- zh: AI 按这个顺序执行。用户不需要记脚本名，AI 根据自然语言选择内置入口。 -->

1. Read `references/MODE_ROUTER.md` and choose Direct, Light, Standard, Epic, or Strict.
2. If the target project lacks persistent workflow instructions, run `adopt.mjs --target <project-root>` and maintain only the `AGENTS.md` marker block.
3. Create or hydrate the smallest safe document package.
4. For Epic or Feature subjects, produce a concise `REVIEW.md` so the user can review summary, risk, option, and acceptance decisions without reading every detailed file first.
5. Fill product, UI, technical contract, acceptance, implementation plan, context pack, and verification documents as needed.
6. When concrete requirement IDs exist, update `docs/product/requirement-ledger.md` and `docs/product/traceability.md`.
7. Ask the user to review the document package.
8. Only after explicit user approval, write approval once with `approve.mjs` or `continue.mjs --user-approved`.
9. Run the built-in gate.
10. After the gate passes, implement inside the approved scope using `08-context-pack.md` and `references/EXECUTION_DISCIPLINE.md`.
11. Complete self-review, verification, product traceability updates, and verification report updates for the current Feature only.
12. Before reporting completion, run `finish-feature.mjs` and use `COMPLETION_PROOF.json` as the delivery proof.

## Main Entrypoints

<!-- zh: 对用户隐藏脚本复杂度。AI 主要使用这几个入口，其他脚本是内部工具。 -->

Use natural language from the user first. When scripts are needed, run Skill-owned scripts with `--target <project-root>`.

- `adopt.mjs`: persist workflow constraints into target `AGENTS.md`.
- `process.mjs`: route a requirement source, create or hydrate documents, and generate pre-approval review artifacts.
- `continue.mjs`: write explicit user approval once, refresh context, and run the relevant gate.
- `finish-feature.mjs`: the only valid Feature completion exit.

Use `references/USER_GUIDE.md` for user-facing explanation and `references/USAGE.md` for maintainer commands.

## Maestro Integration

<!-- zh: Maestro 负责多项目调度；本 Skill 只负责单项目文档、门禁、验证和交接证据。 -->

When Maestro owns the larger mission, this Skill still manages only one target project at a time.
Expose machine-readable interfaces:

- `doctor.mjs --target <project-root> --json`
- `status.mjs --target <project-root> --json`
- `handoff-pack.mjs docs/features/<feature-id> --target <project-root> --json`
- `finish-feature.mjs docs/features/<feature-id> --target <project-root> --json`
- `completion-check.mjs docs/features/<feature-id> --target <project-root> --json` for diagnostics only; it does not replace `finish-feature.mjs`.

Do not treat this Skill as a multi-project scheduler. Maestro owns mission state, dependencies, dispatch, and cross-project integration evidence.

## Agent Options

Hydration and generation scripts support:

- `--agent codex`
- `--agent claude`
- `--agent none`

The default is `codex`. `WORKFLOW_HYDRATE_AGENT=claude` can switch the default.

## References

- `references/LANGUAGE_POLICY.md`: language split between user-facing docs, internal rules, and machine protocol.
- `references/WORKFLOW.md`: core model and document packages.
- `references/POSITIONING.md`: audience, advantages, and Superpowers boundary.
- `references/MODE_ROUTER.md`: mode selection.
- `references/GATES.md`: hard gate rules.
- `references/AUTOMATION.md`: automation script boundaries.
- `references/MAESTRO_INTEGRATION.md`: Maestro integration.
- `references/EXECUTION_PROTOCOL.md`: implementation flow after gates.
- `references/EXECUTION_DISCIPLINE.md`: Scope Lock, TDD/debugging, performance, closure, self-review, and evidence rules.
- `references/PRODUCT_TRACEABILITY.md`: Requirement Ledger, Traceability Matrix, and snapshots.
- `references/STACK_POLICY.md`: Stack Presets.
- `references/EPIC_WORKFLOW.md`: Epic breakdown flow.
- `references/LEGACY_ADOPTION.md`: legacy project adoption.
- `references/USER_GUIDE.md` and `references/USAGE.md`: user and maintainer guides.
