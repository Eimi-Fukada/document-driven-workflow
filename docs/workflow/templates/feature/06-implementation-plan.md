# Implementation Plan

这份计划用于把已批准需求翻译成可执行实现步骤。它不是批准状态来源，批准只看 `00-workflow.yaml`。

## Basic Info

- Feature name:
- Related requirements:
- Execution Mode: standard

## Goal

本次实现要达成的结果：

-

## Non Goals

本次明确不做、不能顺手扩展的内容：

-

## Readiness Conclusion

- Status: Ready / Ready with Assumptions / Not Ready
- Assumptions:
- Risks:

## Change Scope

Allowed changes:

-

Forbidden changes:

-

## Scope Lock

改代码前确认：

- Approved requirement IDs:
- Approved acceptance IDs:
- Allowed files / modules:
- Forbidden files / modules:
- Non-goals that must remain unchanged:
- Existing behavior that must remain compatible:

如果代码现状与 Scope Lock 冲突，必须停下来更新文档，不能继续实现。

## TDD / Debugging Triggers

- TDD required: yes / no
- TDD reason:
- Bug fix: yes / no
- Reproduction path:
- Root cause evidence required: yes / no

权限、会员、额度、定价、权益、任务状态、上传下载、API 校验、数据转换和可复现 bug 修复，默认需要 TDD。

## Implementation Steps

| Step | Task | Allowed Changes | Forbidden Changes | Verification |
| --- | --- | --- | --- | --- |
| 1 |  |  |  |  |

## Maintainability Plan

- Reuse check: if any structure or logic appears 2 or more times, consider component / hook / helper extraction.
- Planned extractions:
- Files expected to approach 1000 lines:
- Tailwind CSS preferred for Next.js UI: yes / no / not-applicable
- CSS exception reason:
- Existing project convention to follow:

## Agent Assignment

- Default execution: single-agent
- Parallelizable tasks:
- Serial tasks:
- Tasks requiring extra review:

Strict mode 可能需要额外需求审查、代码质量审查或多 agent 计划。Standard mode 通常由一个主 AI agent 执行。

## Test Plan

- Typecheck:
- Lint:
- Unit:
- API:
- Playwright:
- Smoke:

## Self Review Checklist

- Requirement coverage:
- Acceptance coverage:
- Forbidden scope untouched:
- Non-goals preserved:
- Reuse and extraction reviewed:
- Touched files remain below 1000 lines or have an extraction note:
- Tailwind CSS used for Next.js UI unless exception is documented:
- Traceability updated:
- Verification evidence ready:

## Deployment Plan

- Environment variables:
- Data migration:
- Deployment command:
- Rollback:

## Approval Boundary

实现批准不保存在本文件。唯一机器可读状态是 `00-workflow.yaml`。
