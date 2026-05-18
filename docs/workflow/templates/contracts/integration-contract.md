# Integration Contract

> 用途：描述多个项目之间的接口、依赖、联调顺序和跨项目验收。  
> document-driven-workflow 不负责跨项目调度；这个文件给 Maestro 作为编排依据。

## Basic Info

- Contract ID: ICONTRACT-TODO-001
- Related Epic: TODO
- Coordinator: Maestro
- Worker Agents: Codex / Claude Code
- Status: draft

## Participating Projects

| Project ID | Root / Repo | Role | Required Feature IDs |
| --- | --- | --- | --- |
| TODO | TODO | Producer / Consumer / Shared | TODO |

## Interface Map

| Interface ID | Producer Project | Consumer Project | Contract | Version / Stability |
| --- | --- | --- | --- | --- |
| IFACE-TODO-001 | TODO | TODO | TODO | draft |

## Dependency Order

| Step | Project | Feature ID | Depends On | Exit Criteria |
| --- | --- | --- | --- | --- |
| 1 | TODO | TODO | none | Feature completion-check PASS |

## Cross-project Acceptance

| Acceptance ID | Scenario | Required Projects | Evidence |
| --- | --- | --- | --- |
| IAC-TODO-001 | TODO | TODO | TODO |

## Integration Risks

| Risk ID | Description | Owner | Mitigation |
| --- | --- | --- | --- |
| IRISK-TODO-001 | TODO | TODO | TODO |

## Maestro Execution Notes

- Maestro owns mission state, task dependencies, cross-project dispatch, and final synthesis.
- Each project still uses document-driven-workflow for its own Feature docs, gates, handoff pack, verification report, and completion-check.
- Cross-project acceptance must be recorded here or in Maestro mission evidence; do not hide it inside a single Feature verification report.
