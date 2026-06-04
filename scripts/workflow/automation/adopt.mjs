import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { printJsonForCli } from "../../shared/document-utils.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const outputArg = parseOption(args, "output", "AGENTS.md", { startIndex: 0 });
const jsonOutput = args.includes("--json");
const noWrite = args.includes("--no-write");

const startMarker = "<!-- document-driven-workflow:start -->";
const endMarker = "<!-- document-driven-workflow:end -->";
const targetFile = workflow.resolveTarget(outputArg);
const targetRel = workflow.relativeToTarget(targetFile);

const block = `${startMarker}
## document-driven-workflow

This project uses document-driven-workflow for non-trivial product delivery.
The workflow source of truth is the approved Epic / Feature document package.

Hard rules:
- Check \`docs/epics\`, \`docs/features\`, and the current \`00-workflow.yaml\` before non-trivial code changes.
- Continue the current Feature when one exists. If none exists, create or hydrate a document package first.
- Do not implement before the Feature gate passes.
- Implement exactly the current Feature according to \`08-context-pack.md\`, acceptance criteria, Scope Lock, selected option, allowed scope, and forbidden scope.
- Do not treat user approval as permission for free implementation.
- Stop for user confirmation before using a rejected/fallback option, expanding scope, weakening acceptance criteria, or resolving a document/code conflict by changing code first.
- Build, typecheck, and lint are evidence only. They are not completion.
- Completion requires an updated verification report plus \`finish-feature.mjs\` PASS and \`COMPLETION_PROOF.json\`.
- Close one Feature at a time before starting another Feature.
- Do not add workflow scripts to the target project's \`package.json\`; run Skill-owned scripts with \`--target <project-root>\`.
${endMarker}`;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyBlock(existing) {
  if (!existing.trim()) {
    return `# AI Collaboration Rules\n\n${block}\n`;
  }

  const pattern = new RegExp(`${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}`, "m");
  if (pattern.test(existing)) {
    return existing.replace(pattern, block);
  }

  const needsBlank = existing.endsWith("\n") ? "\n" : "\n\n";
  return `${existing}${needsBlank}${block}\n`;
}

const before = existsSync(targetFile) ? readFileSync(targetFile, "utf8") : "";
const after = applyBlock(before);
const changed = before !== after;

if (!noWrite && changed) {
  mkdirSync(path.dirname(targetFile), { recursive: true });
  writeFileSync(targetFile, after, "utf8");
}

const payload = {
  schema_version: "1",
  kind: "workflow_adoption",
  generated_at: new Date().toISOString(),
  target_root: workflow.targetRoot,
  file: targetRel,
  result: noWrite ? "DRY_RUN" : "PASS",
  changed,
  markers: {
    start: startMarker,
    end: endMarker,
  },
};

if (jsonOutput) {
  printJsonForCli(payload);
} else {
  console.log(`${noWrite ? "Workflow adoption dry run" : "Workflow adoption updated"}: ${targetRel}`);
  console.log(`Changed: ${changed ? "yes" : "no"}`);
  console.log("Next step: reload or start a new Codex/Claude session so project instructions are re-read.");
}
