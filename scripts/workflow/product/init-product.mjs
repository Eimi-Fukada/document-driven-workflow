import { createWorkflowContext } from "../../shared/workflow-context.mjs";
import { ensureProductArtifacts } from "../../shared/product-artifacts.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const force = args.includes("--force");

const result = ensureProductArtifacts(workflow, { force });

console.log("Product workflow artifacts are ready.");
console.log(`Target: ${workflow.relativeToTarget(workflow.targetRoot) || "."}`);
console.log(`Created: ${result.created.length}`);
for (const item of result.created) {
  console.log(` - ${item}`);
}
console.log(`Skipped existing: ${result.skipped.length}`);
