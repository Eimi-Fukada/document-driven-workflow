# Agent Plan

- Epic ID: unset
- Agent Plan Status: Draft

<!--
Allowed Status Values

- Agent Plan Status: Draft / Reviewed / Approved
- Review Status: Draft / Reviewed
- User Approval: Pending / Approved
-->

## Parallelization Rule

Only run multiple agents when Feature boundaries, dependencies, allowed files, forbidden files, and verification commands are clear.

## Assignment Matrix

| Feature ID | Suggested Agent | Parallelization | Allowed Scope | Forbidden Scope | Verification | Merge Risk |
| --- | --- | --- | --- | --- | --- | --- |
| feature-id | Agent 1 | Parallel if dependencies are clear | docs/features/feature-id and files approved by 06-implementation-plan.md | Auth/payment/deployment/data migration unless explicitly approved | Run Feature gate, project tests, and update 07-verification-report.md | Review file overlap before merge |

## User Review

- Review Status: Draft
- User Approval: Pending
