import { existsSync } from "fs";
import path from "path";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { readText, stripHtmlComments } from "../../shared/document-utils.mjs";
import { MANIFEST_FILE, readManifest, validateRouteDecision } from "../../shared/workflow-manifest.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const subjectArg = parseOption(args, "subject", args[0] || "", { startIndex: 0 });

if (!subjectArg) {
  console.error("Gate failed: missing subject path.");
  console.error("Usage: node scripts/workflow/gate/gate-subject.mjs <docs/features/id|docs/epics/id> --target <project-root>");
  process.exit(1);
}

const subjectPath = workflow.resolveTarget(subjectArg);
if (!existsSync(subjectPath)) {
  console.error(`Gate failed: subject path not found: ${workflow.relativeToTarget(subjectPath)}`);
  process.exit(1);
}

const manifest = readManifest(subjectPath);
const failures = [];

function requireFile(file) {
  const filePath = path.join(subjectPath, file);
  if (!existsSync(filePath)) {
    failures.push(`Missing required file: ${file}`);
    return "";
  }
  return stripHtmlComments(readText(filePath));
}

function requireManifest() {
  if (!manifest) {
    failures.push(`Missing required workflow control file: ${MANIFEST_FILE}`);
    return false;
  }
  return true;
}

function requireManifestField(name, expected) {
  if (!manifest) {
    return;
  }
  const actual = String(manifest[name] || "");
  if (Array.isArray(expected)) {
    if (!expected.includes(actual)) {
      failures.push(`Invalid ${MANIFEST_FILE} field '${name}': expected ${expected.join(" | ")}, got '${actual || "unset"}'.`);
    }
    return;
  }
  if (actual !== expected) {
    failures.push(`Gate not satisfied: ${MANIFEST_FILE} ${name}: ${expected}`);
  }
}

function requireApprovedManifest() {
  requireManifestField("readiness", "ready");
  requireManifestField("unresolved_questions", "0");
  requireManifestField("blocking_issues", "0");
  requireManifestField("assumptions_accepted", "true");
  requireManifestField("approval", ["approved", "inherited"]);
  for (const failure of validateRouteDecision(manifest)) {
    failures.push(`Route decision not satisfied: ${failure}`);
  }
}

function checkNoBlockedMarkers(file, content) {
  const blockedPatterns = [
    "TODO",
    "TBD",
    "REQ-AREA-001",
    "AC-AREA-001",
    "REQ-EXAMPLE-001",
    "AC-EXAMPLE-001",
    "feature-id",
    "unset",
    "待确认",
    "未确认",
    "待补充",
  ];

  for (const pattern of blockedPatterns) {
    if (content.includes(pattern)) {
      failures.push(`Unresolved marker '${pattern}' found in ${file}`);
    }
  }
}

function checkStack(stackPreset, technical, { light = false } = {}) {
  const allowedStacks = ["next-fullstack", "flutter-fastapi", "flutter-express", "legacy-existing"];
  if (!allowedStacks.includes(stackPreset)) {
    failures.push(`Invalid stack_preset in ${MANIFEST_FILE}: ${stackPreset || "unset"}`);
    return;
  }

  if (light && stackPreset === "legacy-existing") {
    failures.push("Light Feature cannot use legacy-existing. Use the standard legacy workflow.");
  }

  if (stackPreset === "next-fullstack") {
    if (!/Next\.js App Router:\s*(yes|not-applicable)/.test(technical) && !/app router/i.test(technical)) {
      failures.push("next-fullstack must use Next.js App Router.");
    }
    if (/Next\.js Pages Router:\s*yes/i.test(technical) || /pages router:\s*yes/i.test(technical)) {
      failures.push("next-fullstack must not use Next.js Pages Router.");
    }
  }

  if (stackPreset === "flutter-express" && /Exception Reason:\s*(none|unset)?\s*$/m.test(technical)) {
    failures.push("flutter-express requires a non-empty Exception Reason.");
  }

  if (stackPreset === "legacy-existing") {
    const baseline = /Legacy Baseline:\s*(.+)$/m.exec(technical)?.[1]?.trim() || "";
    const contract = /Compatibility Contract:\s*(.+)$/m.exec(technical)?.[1]?.trim() || "";
    if (!baseline || baseline === "none" || !existsSync(path.join(workflow.targetRoot, baseline))) {
      failures.push(`Legacy Baseline not found: ${baseline || "unset"}`);
    }
    if (!contract || contract === "none" || !existsSync(path.join(workflow.targetRoot, contract))) {
      failures.push(`Compatibility Contract not found: ${contract || "unset"}`);
    }
  }
}

function requireSection(file, content, sectionName) {
  const pattern = new RegExp(`##\\s+${sectionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
  if (!pattern.test(content)) {
    failures.push(`${file} must include section: ${sectionName}.`);
  }
}

function gateLightFeature() {
  requireManifestField("type", "feature");
  requireManifestField("mode", "light");
  requireApprovedManifest();

  const light = requireFile("01-light-feature.md");
  checkNoBlockedMarkers("01-light-feature.md", light);

  if (!/REQ-/.test(light)) {
    failures.push("Light Feature must reference at least one REQ-* requirement.");
  }
  if (!/AC-/.test(light)) {
    failures.push("Light Feature must include at least one AC-* acceptance case.");
  }
  checkStack(manifest?.stack_preset, light, { light: true });
}

function gateFeature() {
  requireManifestField("type", "feature");
  requireManifestField("mode", ["standard", "strict"]);
  requireApprovedManifest();

  const files = [
    "00-intake-review.md",
    "01-prd.md",
    "02-ui-spec.md",
    "03-technical-contract.md",
    "04-acceptance-criteria.md",
    "05-readiness-review.md",
    "06-implementation-plan.md",
    "08-context-pack.md",
  ];
  const content = Object.fromEntries(files.map((file) => [file, requireFile(file)]));
  for (const [file, text] of Object.entries(content)) {
    checkNoBlockedMarkers(file, text);
  }

  if (!/REQ-/.test(content["01-prd.md"]) && !/REQ-/.test(content["04-acceptance-criteria.md"])) {
    failures.push("Feature must reference at least one REQ-* requirement.");
  }
  if (!/AC-/.test(content["04-acceptance-criteria.md"])) {
    failures.push("Acceptance criteria must include at least one AC-* acceptance case.");
  }
  if (!/Requirement IDs/i.test(content["08-context-pack.md"]) || !/Test Commands/i.test(content["08-context-pack.md"])) {
    failures.push("Context Pack must include requirement IDs and test commands for implementation handoff.");
  }
  if (!/REQ-/.test(content["08-context-pack.md"])) {
    failures.push("Context Pack must include at least one concrete REQ-* requirement.");
  }
  if (!/AC-/.test(content["08-context-pack.md"])) {
    failures.push("Context Pack must include at least one concrete AC-* acceptance case.");
  }
  requireSection("06-implementation-plan.md", content["06-implementation-plan.md"], "Scope Lock");
  requireSection("06-implementation-plan.md", content["06-implementation-plan.md"], "TDD / Debugging Triggers");
  requireSection("06-implementation-plan.md", content["06-implementation-plan.md"], "Option Decision");
  requireSection("06-implementation-plan.md", content["06-implementation-plan.md"], "Performance Plan");
  requireSection("06-implementation-plan.md", content["06-implementation-plan.md"], "Closure Advisory");
  requireSection("06-implementation-plan.md", content["06-implementation-plan.md"], "Maintainability Plan");
  requireSection("06-implementation-plan.md", content["06-implementation-plan.md"], "Self Review Checklist");
  requireSection("08-context-pack.md", content["08-context-pack.md"], "Scope Lock");
  requireSection("08-context-pack.md", content["08-context-pack.md"], "Execution Discipline");
  requireSection("08-context-pack.md", content["08-context-pack.md"], "Maintainability Guardrails");
  requireSection("08-context-pack.md", content["08-context-pack.md"], "Stack Preset Guardrails");
  requireSection("08-context-pack.md", content["08-context-pack.md"], "Performance Guardrails");
  requireSection("08-context-pack.md", content["08-context-pack.md"], "Option And Closure Notes");
  if (!/TDD required:\s*(yes|no)/i.test(content["08-context-pack.md"])) {
    failures.push("Context Pack must state whether TDD is required.");
  }
  if (!/Debugging required:\s*(yes|no)/i.test(content["08-context-pack.md"])) {
    failures.push("Context Pack must state whether systematic debugging is required.");
  }
  if (!/Self review required:\s*yes/i.test(content["08-context-pack.md"])) {
    failures.push("Context Pack must require self review before completion.");
  }
  if (!/Reuse threshold:\s*.*2 or more times/i.test(content["08-context-pack.md"])) {
    failures.push("Context Pack must include the reuse threshold for maintainability.");
  }
  if (!/Max single-file size:\s*1000 lines/i.test(content["08-context-pack.md"])) {
    failures.push("Context Pack must include the 1000-line single-file limit.");
  }
  if (!/Stack Preset:\s*[\w-]+/i.test(content["08-context-pack.md"])) {
    failures.push("Context Pack must state the active Stack Preset.");
  }
  if (!/Preset reference:\s*(docs\/workflow\/presets\/[\w-]+\.md|not-applicable)/i.test(content["08-context-pack.md"])) {
    failures.push("Context Pack must reference the active Stack Preset rules.");
  }
  if (manifest?.stack_preset === "next-fullstack" && !/Styling \/ UI rules:\s*(?!\s*(-|not-applicable)\s*$).+/im.test(content["08-context-pack.md"])) {
    failures.push("next-fullstack Context Pack must include styling/UI rules from the Stack Preset or document an exception.");
  }
  if (!/Performance risk:\s*(yes|no|not-applicable)/i.test(content["08-context-pack.md"])) {
    failures.push("Context Pack must state whether performance risk applies.");
  }
  if (!/Closure risk:\s*(yes|no)/i.test(content["08-context-pack.md"])) {
    failures.push("Context Pack must state whether closure risk applies.");
  }
  checkStack(manifest?.stack_preset, content["03-technical-contract.md"]);
}

function gateEpic() {
  requireManifestField("type", "epic");
  requireManifestField("mode", "epic");
  requireApprovedManifest();

  const files = [
    "00-source.md",
    "01-epic-brief.md",
    "02-requirement-inventory.md",
    "03-scope-breakdown.md",
    "04-risk-map.md",
    "05-release-plan.md",
    "06-acceptance-map.md",
    "07-progress-board.md",
  ];
  const content = Object.fromEntries(files.map((file) => [file, requireFile(file)]));
  for (const [file, text] of Object.entries(content)) {
    checkNoBlockedMarkers(file, text);
  }

  if ((content["00-source.md"] || "").trim().length < 80) {
    failures.push("Epic source must preserve original product material or source path.");
  }
  if (!/EREQ-/.test(content["02-requirement-inventory.md"])) {
    failures.push("Requirement inventory must include at least one EREQ-* item.");
  }
  if (!/Feature ID/.test(content["03-scope-breakdown.md"])) {
    failures.push("Scope breakdown must include feature candidates.");
  }
  if (!/RISK-/.test(content["04-risk-map.md"])) {
    failures.push("Risk map must include at least one RISK-* item.");
  }
  if (!/Batch 1/.test(content["05-release-plan.md"])) {
    failures.push("Release plan must include Batch 1.");
  }
  if (!/EREQ-/.test(content["06-acceptance-map.md"])) {
    failures.push("Acceptance map must reference EREQ-* items.");
  }
}

if (requireManifest()) {
  if (manifest.type === "feature" && manifest.mode === "light") {
    gateLightFeature();
  } else if (manifest.type === "feature") {
    gateFeature();
  } else if (manifest.type === "epic") {
    gateEpic();
  } else {
    failures.push(`Unsupported workflow type in ${MANIFEST_FILE}: ${manifest.type || "unset"}`);
  }
}

if (failures.length > 0) {
  console.error("Workflow gate failed. Do not start implementation yet.");
  console.error("");
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  console.error("");
  console.error("Next step: fix the workflow documents or approval state, then rerun the gate.");
  process.exit(1);
}

console.log("Workflow gate passed.");
console.log(`Subject: ${workflow.relativeToTarget(subjectPath)}`);
console.log(`Type: ${manifest.type}`);
console.log(`Mode: ${manifest.mode}`);
