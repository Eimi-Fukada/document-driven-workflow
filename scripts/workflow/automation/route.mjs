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
- Routing Status: Draft
- Recommended Mode: unset

<!--
Allowed Status Values

- Routing Status: Draft / Reviewed
- Recommended Mode: Direct / Light / Standard / Epic / Strict
-->

## Recommendation

-

## Reasoning

-

## Risk Triggers

-

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
- If the source touches auth, payment, permission, database, task state, deployment, migration, legacy core behavior, or multi-agent execution, recommend Strict unless it is clearly an Epic first.
- If the source spans multiple modules or release batches, recommend Epic.
- If it is low-risk and single-scope, recommend Light.
- If it is clear and trivial, recommend Direct.
- Explain what the user should review next.

Source excerpt:

\`\`\`text
${sourceSummary}
\`\`\`
`;

runAgent({ agent, cwd: workflow.targetRoot, prompt });
