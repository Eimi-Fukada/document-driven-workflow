# Integration Contract

> 用途：描述多个项目之间的接口、依赖、联调顺序和跨项目验收。  
> document-driven-workflow 不负责跨项目调度；这个文件给 Maestro 作为编排依据。

## Basic Info

- Contract ID: ICONTRACT-HERE-001
- Related Epic: EPIC_ID_HERE
- Coordinator: Maestro
- Worker Agents: Codex / Claude Code
- Status: draft

## Participating Projects

| Project ID | Root / Repo | Role | Required Feature IDs |
| --- | --- | --- | --- |
| PROJECT_ID_HERE | ROOT_OR_REPO_HERE | Producer / Consumer / Shared | REQUIRED_FEATURE_IDS_HERE |

## Interface Map

| Interface ID | Producer Project | Consumer Project | Contract | Version / Stability |
| --- | --- | --- | --- | --- |
| IFACE-CONTRACT-001 | PRODUCER_PROJECT_HERE | CONSUMER_PROJECT_HERE | CONTRACT_SUMMARY_HERE | draft |

## Dependency Order

| Step | Project | Feature ID | Depends On | Exit Criteria |
| --- | --- | --- | --- | --- |
| 1 | PROJECT_ID_HERE | FEATURE_ID_HERE | none | Feature finish-feature PASS with COMPLETION_PROOF.json |

## Cross-project Acceptance

| Acceptance ID | Scenario | Required Projects | Evidence |
| --- | --- | --- | --- |
| IAC-CONTRACT-001 | SCENARIO_HERE | REQUIRED_PROJECTS_HERE | EVIDENCE_HERE |

## Integration Risks

| Risk ID | Description | Owner | Mitigation |
| --- | --- | --- | --- |
| IRISK-CONTRACT-001 | RISK_DESCRIPTION_HERE | OWNER_HERE | MITIGATION_HERE |

## Maestro Execution Notes

- Maestro owns mission state, task dependencies, cross-project dispatch, and final synthesis.
- Each project still uses document-driven-workflow for its own Feature docs, gates, handoff pack, verification report, and finish-feature completion proof.
- Cross-project acceptance must be recorded here or in Maestro mission evidence; do not hide it inside a single Feature verification report.
