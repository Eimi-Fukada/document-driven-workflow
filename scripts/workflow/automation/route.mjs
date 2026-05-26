import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { parseAgentOption, runAgent } from "../../shared/agent-runner.mjs";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { readText } from "../../shared/document-utils.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const agent = parseAgentOption(args);
const sourceArg = parseOption(args, "source", args[0] || "", { startIndex: 0 });
const outputArg = parseOption(args, "output", "", { startIndex: 0 });

if (!sourceArg) {
  console.error("Missing requirement source.");
  console.error("Usage: node scripts/workflow/automation/route.mjs --source <file-or-dir> --target <project-root>");
  process.exit(1);
}

const sourcePath = workflow.resolveTarget(sourceArg);
if (!existsSync(sourcePath)) {
  console.error(`Requirement source not found: ${workflow.relativeToTarget(sourcePath)}`);
  process.exit(1);
}

let sourceSummary = "";
if (sourcePath.endsWith(".md") || sourcePath.endsWith(".txt")) {
  const source = readText(sourcePath).trim();
  sourceSummary = source.slice(0, 8000);
} else {
  sourceSummary = `需求来源是目录：${workflow.relativeToTarget(sourcePath)}。路由前应检查该目录内容。`;
}

const outputPath = outputArg
  ? workflow.resolveTarget(outputArg)
  : path.join(workflow.targetRoot, "docs", "workflow", "ROUTING_REVIEW.md");

mkdirSync(path.dirname(outputPath), { recursive: true });

const scaffold = `# Workflow Routing Review

- Source: ${workflow.relativeToTarget(sourcePath)}
- Recommended Mode: unset

## Recommendation

-

## Reasoning

-

## Risk Triggers

-

## User Confirmation Draft

- AI suggested mode: unset
- AI suggested risk level: unset
- Objective hard risk blockers: none
- Expected runtime: unset
- Execution slicing: unset
- User can confirm / downgrade / upgrade / split:

## Required Artifacts

-

## Next Step

-
`;

writeFileSync(outputPath, scaffold, "utf8");

console.log(`Routing review scaffold ready: ${workflow.relativeToTarget(outputPath)}`);
console.log(`Running route agent: ${agent}`);

const prompt = `Use document-driven-workflow.

Task: route the requirement source to the lightest safe workflow mode.

Read:
- ${workflow.relativeToTarget(sourcePath)}
- docs/workflow/MODE_ROUTER.md if present in the target project.

Output:
- Complete ${workflow.relativeToTarget(outputPath)} in Chinese-first prose. Keep status values, mode names, paths, and command names in English.

Rules:
- Recommend exactly one mode: Direct, Light, Standard, Epic, or Strict.
- Choose the lightest safe mode.
- Do not approve implementation. Approval is recorded only in the selected Epic or Feature 00-workflow.yaml.
- Treat routing as an AI draft for user review, not as final approval.
- Only objective hard risks can block downgrade: authentication/session/token changes, payment, permission, database/schema migration, destructive data change, security, production deployment, task-state consistency, or legacy core compatibility breakage.
- If objective hard risk blockers exist, recommend Strict unless the work should be an Epic first.
- Do not make ordinary API/data/UI/state uncertainty automatically Strict. Explain the uncertainty and what the user should confirm.
- If the source spans multiple modules or release batches, recommend Epic.
- If it is low-risk and single-scope, recommend Light.
- If it is clear and trivial, recommend Direct.
- Estimate expected runtime and execution slicing. If expected runtime is over 90 minutes or coverage is large, recommend splitting or execution slicing.
- Explain what the user should review next.

Source excerpt:

\`\`\`text
${sourceSummary}
\`\`\`
`;

runAgent({ agent, cwd: workflow.targetRoot, prompt });
