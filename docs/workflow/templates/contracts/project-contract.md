# Project Contract

> 用途：给 Maestro 或其他上层编排器描述“这个项目能承担什么、边界是什么、怎么验收”。  
> 这不是需求文档，也不是 Feature 文档；它是跨项目调度时的项目能力说明。

## Basic Info

- Project ID: PROJECT_ID_HERE
- Project Root: PROJECT_ROOT_HERE
- Owner Agent: codex
- Workflow Target: WORKFLOW_TARGET_HERE
- Stack Preset: next-fullstack
- Runtime: RUNTIME_HERE
- Deployment Target: DEPLOYMENT_TARGET_HERE

## Responsibility

- This project owns:
  - PROJECT_RESPONSIBILITY_HERE
- This project does not own:
  - OUT_OF_SCOPE_RESPONSIBILITY_HERE

## Public Interfaces

| Interface ID | Type | Path / Endpoint / Package | Producer | Consumer | Stability |
| --- | --- | --- | --- | --- | --- |
| IFACE-CONTRACT-001 | API / UI / Package / Event | PATH_OR_ENDPOINT_HERE | PRODUCER_HERE | CONSUMER_HERE | draft |

## Data Ownership

| Data / Entity | Owner | Read By | Write By | Notes |
| --- | --- | --- | --- | --- |
| DATA_ENTITY_HERE | OWNER_HERE | READERS_HERE | WRITERS_HERE | NOTES_HERE |

## Required Workflow Checks

- Before implementation:
  - document-driven-workflow doctor JSON
  - Feature gate for `docs/features/<feature-id>`
- Before reporting done:
  - document-driven-workflow verification run
  - document-driven-workflow finish-feature JSON

## Maestro Notes

- Maestro may schedule Features from this project only after the Feature is approved and ready.
- Maestro should treat `handoff-pack.json` as the machine-readable worker input.
- Maestro should not bypass Feature gate or finish-feature.
