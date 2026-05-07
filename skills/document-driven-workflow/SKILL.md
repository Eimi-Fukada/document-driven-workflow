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
3. Add the minimum workflow files, scripts, and commands needed by that project.
4. Create Epic or Feature document packages.
5. Run readiness gates before implementation.
6. Keep project-specific facts inside the target project, not in this skill.

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
3. Copy only the workflow assets the project needs:
   - `references/*.md` to `docs/workflow/`
   - `templates/` to `docs/workflow/templates/`
   - needed gate/generator scripts to the project scripts directory
4. Add project-local commands without overwriting existing build/dev/test commands.
5. For old projects, create `docs/legacy/BASELINE.md` and `docs/legacy/COMPATIBILITY_CONTRACT.md` before any feature work.

## Epic vs Feature

If the input is a product iteration with multiple modules, create an Epic first.

If the input is a single independently developable unit, create a Feature.

Never use one large Feature to hide a multi-module Epic.

## Implementation Gate

Before code changes, the target project's feature gate must pass.

If the gate fails, stay in documentation mode and report what is missing or unresolved.

## Bundled Resources

- `templates/feature/`
- `templates/epic/`
- `templates/legacy/`
- `templates/change/`
- `templates/decision/`
- `scripts/`
- `references/`
