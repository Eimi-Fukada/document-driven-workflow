import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { readText } from "../../shared/document-utils.mjs";
import { readManifest } from "../../shared/workflow-manifest.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const subjectArg = parseOption(args, "subject", args[0] || "", { startIndex: 0 });
const force = args.includes("--force");

if (!subjectArg) {
  console.error("Missing Feature path.");
  console.error("Usage: node scripts/workflow/automation/context-pack.mjs docs/features/<feature-id> --target <project-root>");
  process.exit(1);
}

const featurePath = workflow.resolveTarget(subjectArg);
if (!existsSync(featurePath)) {
  console.error(`Feature path not found: ${workflow.relativeToTarget(featurePath)}`);
  process.exit(1);
}

const manifest = readManifest(featurePath);
if (!manifest || manifest.type !== "feature") {
  console.error("Context Pack can only be generated for a Feature with 00-workflow.yaml.");
  process.exit(1);
}

if (manifest.mode === "light") {
  console.error("Light Feature keeps context inside 01-light-feature.md. No separate Context Pack is required.");
  process.exit(1);
}

const outputPath = path.join(featurePath, "08-context-pack.md");
if (existsSync(outputPath) && !force) {
  console.error(`Context Pack already exists: ${workflow.relativeToTarget(outputPath)}`);
  console.error("Use --force to overwrite.");
  process.exit(1);
}

const prd = readText(path.join(featurePath, "01-prd.md"));
const uiSpec = readText(path.join(featurePath, "02-ui-spec.md"));
const acceptance = readText(path.join(featurePath, "04-acceptance-criteria.md"));
const technical = readText(path.join(featurePath, "03-technical-contract.md"));
const plan = readText(path.join(featurePath, "06-implementation-plan.md"));

function collectIds(pattern, ...texts) {
  const ids = new Set();
  for (const text of texts) {
    for (const match of text.matchAll(pattern)) {
      ids.add(match[0]);
    }
  }
  return [...ids];
}

function sectionLine(pattern, text, fallback = "-") {
  const match = pattern.exec(text);
  return match?.[1]?.trim() || fallback;
}

const requirementIds = collectIds(/\bREQ-[A-Z0-9-]+\b/g, prd, acceptance, plan);
const acceptanceIds = collectIds(/\bAC-[A-Z0-9-]+\b/g, acceptance, plan);
const allowedScope = sectionLine(/Allowed changes:\s*\n+([\s\S]*?)(?:\n##|\nForbidden changes:|$)/i, plan);
const forbiddenScope = sectionLine(/Forbidden changes:\s*\n+([\s\S]*?)(?:\n##|$)/i, plan);
const tddRequired = sectionLine(/TDD required:\s*(.*)$/im, plan, "no");
const tddReason = sectionLine(/TDD reason:\s*(.*)$/im, plan, "-");
const debuggingRequired = sectionLine(/Root cause evidence required:\s*(.*)$/im, plan, "no");
const debuggingReason = sectionLine(/Bug fix:\s*(.*)$/im, plan, "-");
const plannedExtractions = sectionLine(/Planned extractions:\s*([\s\S]*?)(?:\n##|\nFiles expected|$)/i, plan);
const stackPreset = manifest.stack_preset || sectionLine(/Stack Preset:\s*(.*)$/im, technical, "next-fullstack");
const builtInStackPresets = new Set(["next-fullstack", "flutter-app"]);
const presetReference = builtInStackPresets.has(stackPreset) ? `docs/workflow/presets/${stackPreset}.md` : "not-applicable";
const frameworkConstraints = sectionLine(/Framework-specific constraints:\s*(.*)$/im, plan);
const stylingRules = sectionLine(/Styling \/ UI rules:\s*(.*)$/im, plan);
const apiDataRules = sectionLine(/API \/ data access rules:\s*(.*)$/im, plan);
const clientStateEffectRules = sectionLine(/Client state \/ effect rules:\s*(.*)$/im, plan);
const backendQueryRules = sectionLine(/Backend query rules:\s*(.*)$/im, plan);
const renderingCacheStrategy = sectionLine(/Rendering \/ cache strategy:\s*(.*)$/im, plan);
const formMutationAuthBoundary = sectionLine(/Form \/ mutation \/ auth boundary:\s*(.*)$/im, plan);
const libraryChoices = sectionLine(/Library choices:\s*(.*)$/im, plan);
const bundleClientJsImpact = sectionLine(/Bundle \/ client JS impact:\s*(.*)$/im, plan);
const stackTestRules = sectionLine(/Test rules:\s*(.*)$/im, plan);
const stackExceptionReason = sectionLine(/Exception reason:\s*(.*)$/im, plan);
const performanceRisk = sectionLine(/Performance risk:\s*(.*)$/im, plan, "not-applicable");
const performanceTrigger = sectionLine(/Risk trigger:\s*(.*)$/im, plan);
const performanceMitigation = [
  sectionLine(/Backend mitigation:\s*(.*)$/im, plan),
  sectionLine(/Frontend mitigation:\s*(.*)$/im, plan),
  sectionLine(/Database\/index mitigation:\s*(.*)$/im, plan),
  sectionLine(/Cache\/async\/batch strategy:\s*(.*)$/im, plan),
]
  .filter((item) => item && item !== "-")
  .join("; ") || "-";
const performanceVerification = sectionLine(/Verification command or manual check:\s*(.*)$/im, plan);
const selectedOption = sectionLine(/Selected option:\s*(.*)$/im, plan);
const optionTradeoff = sectionLine(/Selection reason:\s*(.*)$/im, plan);
const closureRisk = sectionLine(/Closure risk:\s*(.*)$/im, plan, "no");
const userWarning = sectionLine(/User warning:\s*(.*)$/im, plan);
const requiredDocumentUpdate = sectionLine(/Required document update:\s*(.*)$/im, plan);
const uiSourceType = sectionLine(/Source type:\s*(.*)$/im, uiSpec, "none");
const uiSourceUrlOrPath = sectionLine(/Source URL or path:\s*(.*)$/im, uiSpec);
const targetUiSurface = sectionLine(/Target screen \/ frame \/ artboard:\s*(.*)$/im, uiSpec);
const sourceUiId = sectionLine(/Source node \/ page \/ artboard ID:\s*(.*)$/im, uiSpec);
const implementSelectedTargetOnly = sectionLine(/Implement selected target only:\s*(.*)$/im, uiSpec);
const hiddenLayers = sectionLine(/Hidden layers:\s*(.*)$/im, uiSpec);
const offCanvasContent = sectionLine(/Off-canvas content:\s*(.*)$/im, uiSpec);
const unknownContentPurpose = sectionLine(/Unknown content purpose:\s*(.*)$/im, uiSpec);
const requiredStates = sectionLine(/Required states:\s*([\s\S]*?)(?:\n##|$)/i, uiSpec);

const content = `# Context Pack

这份文档是给实现 agent 的紧凑交接上下文。它不替代 PRD 和验收文档，但实现前应先读它。

## Feature Summary

- Feature ID: ${manifest.id}
- Mode: ${manifest.mode}
- Stack Preset: ${manifest.stack_preset}
- Epic ID: ${manifest.epic_id || "none"}

## Source Links

- Product source: ${manifest.source_path || "none"}
- Epic: ${manifest.epic_id && manifest.epic_id !== "none" ? `docs/epics/${manifest.epic_id}` : "none"}
- Change Request: none

## Requirement IDs

${requirementIds.length ? requirementIds.map((id) => `- ${id}`).join("\n") : "- pending"}

## Acceptance IDs

${acceptanceIds.length ? acceptanceIds.map((id) => `- ${id}`).join("\n") : "- pending"}

## Allowed Scope

${allowedScope}

## Forbidden Scope

${forbiddenScope}

## Scope Lock

- Approved requirement IDs: ${requirementIds.length ? requirementIds.join(", ") : "pending"}
- Approved acceptance IDs: ${acceptanceIds.length ? acceptanceIds.join(", ") : "pending"}
- Allowed files / modules: ${allowedScope}
- Forbidden files / modules: ${forbiddenScope}
- Non-goals: ${sectionLine(/## Non Goals\s*\n+([\s\S]*?)(?:\n##|$)/i, plan)}
- Compatibility constraints: ${sectionLine(/Compatibility constraints:\s*([\s\S]*?)(?:\n##|$)/i, technical)}

如果实现需要跨过这个锁定范围，先停下来更新 Feature 文档，不要继续编辑代码。

## Code Entry Points

${sectionLine(/Code Entry Points:\s*\n+([\s\S]*?)(?:\n##|$)/i, technical)}

## UI Handoff

- UI source type: ${uiSourceType}
- Source URL or path: ${uiSourceUrlOrPath}
- Target screen / frame / artboard: ${targetUiSurface}
- Source node / page / artboard ID: ${sourceUiId}
- Implement selected target only: ${implementSelectedTargetOnly}
- Hidden layers: ${hiddenLayers}
- Off-canvas content: ${offCanvasContent}
- Unknown content purpose: ${unknownContentPurpose}
- Required states: ${requiredStates}

If a Feature uses a design file, screenshot, image, Pencil, Figma, or existing page as UI source, implement only the documented target. Hidden content, non-target content, reference drafts, deprecated screens, and unclear content do not expand implementation scope. Ask the user before implementing unclear UI content.

## Execution Discipline

- TDD required: ${tddRequired}
- TDD reason: ${tddReason}
- Debugging required: ${debuggingRequired}
- Debugging reason: ${debuggingReason}
- Self review required: yes
- Single Feature closure required: yes
- Finish-feature required before next Feature: yes
- Completion proof required: yes
- Build/typecheck alone is completion evidence: no

If implementation conflicts with the selected option, rejected option, allowed scope, forbidden scope, non-goals, or acceptance criteria, stop and ask for user confirmation before changing code.

## Maintainability Guardrails

- Reuse threshold: consider extraction when structure or logic appears 2 or more times
- Max single-file size: 1000 lines
- Planned component / hook / helper extraction: ${plannedExtractions}

## Stack Preset Guardrails

- Stack Preset: ${stackPreset}
- Preset reference: ${presetReference}
- Framework-specific constraints: ${frameworkConstraints}
- Styling / UI rules: ${stylingRules}
- API / data access rules: ${apiDataRules}
- Client state / effect rules: ${clientStateEffectRules}
- Backend query rules: ${backendQueryRules}
- Rendering / cache strategy: ${renderingCacheStrategy}
- Form / mutation / auth boundary: ${formMutationAuthBoundary}
- Library choices: ${libraryChoices}
- Bundle / client JS impact: ${bundleClientJsImpact}
- Test rules: ${stackTestRules}
- Exception reason: ${stackExceptionReason}

## Performance Guardrails

- Performance risk: ${performanceRisk}
- Risk trigger: ${performanceTrigger}
- Required mitigation: ${performanceMitigation}
- Verification required: ${performanceVerification}

## Option And Closure Notes

- Selected option: ${selectedOption}
- Option tradeoff: ${optionTradeoff}
- Closure risk: ${closureRisk}
- User warning: ${userWarning}
- Required document update: ${requiredDocumentUpdate}

## Test Commands

- Typecheck: ${sectionLine(/Typecheck:\s*(.*)$/im, plan)}
- Lint: ${sectionLine(/Lint:\s*(.*)$/im, plan)}
- Unit: ${sectionLine(/Unit:\s*(.*)$/im, plan)}
- API: ${sectionLine(/API:\s*(.*)$/im, plan)}
- Playwright: ${sectionLine(/Playwright:\s*(.*)$/im, plan)}
- Smoke: ${sectionLine(/Smoke:\s*(.*)$/im, plan)}

## Open Risk

${sectionLine(/Risks:\s*([\s\S]*?)(?:\n##|$)/i, plan)}

实现 agent 应先读本文件，再按需打开引用到的需求文档和代码路径。
`;

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, content, "utf8");

console.log(`Context Pack written: ${workflow.relativeToTarget(outputPath)}`);
