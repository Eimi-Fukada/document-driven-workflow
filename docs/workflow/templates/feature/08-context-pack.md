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

## UI Handoff

- UI source type:
- Figma URL:
- Target frame:
- Node ID:
- Implement selected frame only:
- Hidden layers:
- Off-canvas frames:
- Unknown layer purpose:
- Required states:

如果 UI source type 是 `figma`，实现 agent 只能读取和实现指定 target frame / node id。隐藏图层、非目标 Frame、参考稿、旧稿和用途不明的 layer 不得自动进入实现范围；如有疑问必须先询问用户。

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
- Planned component / hook / helper extraction:

## Stack Preset Guardrails

- Stack Preset:
- Preset reference: docs/workflow/presets/<built-in-preset>.md / not-applicable for custom stack
- Framework-specific constraints:
- Styling / UI rules:
- API / data access rules:
- Client state / effect rules:
- Backend query rules:
- Rendering / cache strategy:
- Form / mutation / auth boundary:
- Library choices:
- Bundle / client JS impact:
- Test rules:
- Exception reason:

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

<!-- custom stack 必须填写目标项目自己的验证命令；工作流核心不会为所有语言维护默认命令。 -->

- Typecheck:
- Lint:
- Unit:
- API:
- Playwright:
- Smoke:

## Open Risk

-

实现 agent 应先读本文件，再按需打开引用到的需求文档和代码路径。
