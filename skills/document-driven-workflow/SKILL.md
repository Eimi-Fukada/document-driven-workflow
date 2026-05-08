---
name: "document-driven-workflow"
description: "Use when a project should be driven by product documents, UI specs, acceptance criteria, Epic/Feature breakdown, readiness gates, legacy adoption, or AI-managed implementation handoff."
---

# Document Driven Workflow

Use this skill to connect a target project to a document-driven AI delivery workflow, then operate that workflow.

## Core Rule

Do not treat this as a project template. This is an AI workflow skill.

The skill should help the agent:

1. Inspect the target project.
2. Decide whether the request is Level 0-4.
3. Add or update only the project documentation artifacts needed by that project.
4. Hydrate Epic or Feature draft documents from raw product material.
5. Create Epic or Feature document packages.
6. Run readiness gates before implementation.
7. Keep project-specific facts inside the target project, not in this skill.

## What To Read

- For role separation and complexity levels, read `references/USER_GUIDE.md`.
- For command and feature usage, read `references/USAGE.md`.
- For normal feature delivery, read `references/WORKFLOW.md`.
- For product iterations, read `references/EPIC_WORKFLOW.md`.
- For old projects, read `references/LEGACY_ADOPTION.md`.
- For stack choices, read `references/STACK_POLICY.md`.
- For gate rules, read `references/GATES.md`.

## Target Project Adoption

When asked to apply this workflow to a project:

1. Read the target project's existing docs and scripts first.
2. Preserve existing project docs; treat them as evidence, not clutter.
3. Do not copy workflow scripts into the target project by default.
4. Do not modify the target project's `package.json` just to expose workflow commands.
5. Keep reusable workflow rules, templates, generators, and gates inside this Skill.
6. Keep project-specific facts and delivery artifacts inside the target project:
   - `docs/epics/`
   - `docs/features/`
   - `docs/legacy/`
   - `docs/changes/`
   - `docs/decisions/`
7. For old projects, create `docs/legacy/BASELINE.md` and `docs/legacy/COMPATIBILITY_CONTRACT.md` before any feature work.

## Epic vs Feature

If the input is a product iteration with multiple modules, create an Epic first.

If the input is a single independently developable unit, create a Feature.

Never use one large Feature to hide a multi-module Epic.

## Hydration Rule

Users may provide only raw source material first.

When `00-source.md` exists, run the hydrate flow with the Skill-bundled scripts against the target project.

In a target project, prefer natural language orchestration:

- "Use document-driven-workflow to process this requirement document."
- "I filled the Epic 00-source.md; continue generating the Epic and Features."
- "I reviewed and approved the documents; run the gates and start implementation."

If a direct script call is needed, run the Skill script with `--target <project-root>`:

- Epic: `node scripts/workflow/epic/hydrate-epic.mjs docs/epics/<epic-id> --target <project-root>`
- Feature: `node scripts/workflow/feature/hydrate-feature.mjs docs/features/<feature-id> --target <project-root>`
- Epic to Features: `node scripts/workflow/epic/create-features.mjs docs/epics/<epic-id> --target <project-root> --features feature-a,feature-b --stack <preset>`

The hydrate command should call Codex CLI to complete the generated draft documents for user review. Use `--agent none` only when scaffolding or testing without AI generation.

Never mark hydrated documents as approved yourself. The user must review before gates can pass.

## Implementation Gate

Before code changes, the Feature gate must pass. Run it from the Skill scripts against the target project, or perform the equivalent document checks manually when scripting is unavailable.

If the gate fails, stay in documentation mode and report what is missing or unresolved.

## Bundled Resources

- `templates/feature/`
- `templates/epic/`
- `templates/legacy/`
- `templates/change/`
- `templates/decision/`
- `scripts/`
- `references/`
