# Context Pack

这份文档是给实现 agent 的紧凑交接上下文。它不替代 PRD 和验收文档，但实现前应先读它。

## Feature Summary

-

## Source Links

- Product source:
- Epic:
- Change Request:

## Requirement IDs

-

## Acceptance IDs

-

## Allowed Scope

-

## Forbidden Scope

-

## Scope Lock

- Approved requirement IDs:
- Approved acceptance IDs:
- Allowed files / modules:
- Forbidden files / modules:
- Non-goals:
- Compatibility constraints:

如果实现需要跨过这个锁定范围，先停下来更新 Feature 文档，不要继续编辑代码。

## Code Entry Points

-

## Execution Discipline

- TDD required: yes / no
- TDD reason:
- Debugging required: yes / no
- Debugging reason:
- Self review required: yes
- Single Feature closure required: yes
- Finish-feature required before next Feature: yes
- Completion proof required: yes
- Build/typecheck alone is completion evidence: no

如果实现路径与推荐方案、已拒绝方案、allowed scope、forbidden scope 或验收标准冲突，必须先停下来让用户确认，不要擅自降级实现或扩大范围。

## Maintainability Guardrails

- Reuse threshold: consider extraction when structure or logic appears 2 or more times
- Max single-file size: 1000 lines
- Tailwind CSS preferred for Next.js UI: yes / no / not-applicable
- Planned component / hook / helper extraction:
- CSS exception reason:

## Performance Guardrails

- Performance risk: yes / no / not-applicable
- Risk trigger:
- Required mitigation:
- Verification required:

## Option And Closure Notes

- Selected option:
- Option tradeoff:
- Closure risk: yes / no
- User warning:
- Required document update:

## Test Commands

- Typecheck:
- Lint:
- Unit:
- API:
- Playwright:
- Smoke:

## Open Risk

-

实现 agent 应先读本文件，再按需打开引用到的需求文档和代码路径。
