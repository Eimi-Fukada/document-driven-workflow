# Project Contract

> 用途：给 Maestro 或其他上层编排器描述“这个项目能承担什么、边界是什么、怎么验收”。  
> 这不是需求文档，也不是 Feature 文档；它是跨项目调度时的项目能力说明。

## Basic Info

- Project ID: TODO
- Project Root: TODO
- Owner Agent: codex
- Workflow Target: TODO
- Stack Preset: next-fullstack
- Runtime: TODO
- Deployment Target: TODO

## Responsibility

- This project owns:
  - TODO
- This project does not own:
  - TODO

## Public Interfaces

| Interface ID | Type | Path / Endpoint / Package | Producer | Consumer | Stability |
| --- | --- | --- | --- | --- | --- |
| IFACE-TODO-001 | API / UI / Package / Event | TODO | TODO | TODO | draft |

## Data Ownership

| Data / Entity | Owner | Read By | Write By | Notes |
| --- | --- | --- | --- | --- |
| TODO | TODO | TODO | TODO | TODO |

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
