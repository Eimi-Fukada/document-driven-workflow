import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { readManifest } from "../../shared/workflow-manifest.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const subjectArg = parseOption(args, "subject", args[0] || "", { startIndex: 0 });
const extraCommand = parseOption(args, "command", "", { startIndex: 0 });

if (!subjectArg) {
  console.error("Missing Feature path.");
  console.error("Usage: node scripts/workflow/automation/verify.mjs docs/features/<feature-id> --target <project-root> [--command \"npm test\"]");
  process.exit(1);
}

const featurePath = workflow.resolveTarget(subjectArg);
if (!existsSync(featurePath)) {
  console.error(`Feature path not found: ${workflow.relativeToTarget(featurePath)}`);
  process.exit(1);
}

const manifest = readManifest(featurePath);
if (!manifest || manifest.type !== "feature") {
  console.error("workflow:verify only supports Feature subjects with 00-workflow.yaml.");
  process.exit(1);
}

function readIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function sanitizeCommand(rawCommand) {
  const raw = String(rawCommand || "").trim();
  let command = raw;
  command = command.replace(/^```[A-Za-z0-9_-]*\s*/, "").replace(/\s*```$/, "").trim();
  command = command.replace(/^`+/, "").replace(/`+$/, "").trim();
  if (
    (command.startsWith('"') && command.endsWith('"')) ||
    (command.startsWith("'") && command.endsWith("'"))
  ) {
    command = command.slice(1, -1).trim();
  }
  if (!command || command.includes("```") || /\r?\n/.test(command)) {
    return {
      ok: false,
      raw,
      command: "",
      reason: "verification command must be one clean shell command, not a markdown code fence or multi-line block",
    };
  }
  return { ok: true, raw, command, changed: raw !== command };
}

function collectCommands(text) {
  const commands = [];
  const labels = ["Typecheck", "Lint", "Unit", "API", "Playwright", "Smoke", "Build", "Format"];
  for (const label of labels) {
    const pattern = new RegExp(`^-\\s*${label}:\\s*(.+)$`, "gim");
    for (const match of text.matchAll(pattern)) {
      const sanitized = sanitizeCommand(match[1]);
      if (!sanitized.ok) {
        throw new Error(`${label}: ${sanitized.reason}. Raw value: ${sanitized.raw}`);
      }
      const command = sanitized.command;
      if (!command || ["-", "none", "n/a", "not-applicable", "pending"].includes(command.toLowerCase())) {
        continue;
      }
      commands.push({ label, command, raw_command: sanitized.raw, sanitized: sanitized.changed });
    }
  }
  return commands;
}

const commandSources = [
  readIfExists(path.join(featurePath, "08-context-pack.md")),
  readIfExists(path.join(featurePath, "06-implementation-plan.md")),
  readIfExists(path.join(featurePath, "01-light-feature.md")),
];

const commandMap = new Map();
for (const item of commandSources.flatMap((source) => collectCommands(source))) {
  if (!commandMap.has(item.command)) {
    commandMap.set(item.command, item);
  }
}
if (extraCommand) {
  const sanitized = sanitizeCommand(extraCommand);
  if (!sanitized.ok) {
    console.error(`Manual: ${sanitized.reason}. Raw value: ${sanitized.raw}`);
    process.exit(1);
  }
  commandMap.set(sanitized.command, {
    label: "Manual",
    command: sanitized.command,
    raw_command: sanitized.raw,
    sanitized: sanitized.changed,
  });
}

const commands = [...commandMap.values()];
if (commands.length === 0) {
  console.error("No verification commands found. Add Test Commands to 08-context-pack.md or pass --command.");
  process.exit(1);
}

function limit(text, max = 4000) {
  if (!text) {
    return "";
  }
  return text.length > max ? `${text.slice(0, max)}\n... output truncated ...` : text;
}

const results = [];
for (const item of commands) {
  console.log(`Running ${item.label}: ${item.command}`);
  const result = spawnSync(item.command, {
    cwd: workflow.targetRoot,
    encoding: "utf8",
    shell: true,
  });
  results.push({
    ...item,
    status: result.status ?? 1,
    stdout: limit(result.stdout || ""),
    stderr: limit(result.stderr || result.error?.message || ""),
  });
}

const failed = results.filter((item) => item.status !== 0);
const reportPath =
  manifest.mode === "light"
    ? path.join(featurePath, "01-light-feature.md")
    : path.join(featurePath, "07-verification-report.md");
const existing = readIfExists(reportPath) || "# Verification Report\n";
const timestamp = new Date().toISOString();
const section = `\n\n## Automated Verification Run - ${timestamp}\n\n| Label | Command | Exit Code | Result |\n| --- | --- | --- | --- |\n${results
  .map((item) => `| ${item.label} | \`${item.command.replaceAll("|", "\\|")}\` | ${item.status} | ${item.status === 0 ? "Passed" : "Failed"} |`)
  .join("\n")}\n\n${results
  .map((item) => {
    const sanitizedNote =
      item.sanitized && item.raw_command
        ? `\n\nSanitized from markdown-wrapped command: \`${item.raw_command.replaceAll("|", "\\|")}\``
        : "";
    return `### ${item.label}: ${item.command}\n\nExit code: ${item.status}${sanitizedNote}\n\nStdout:\n\n\`\`\`text\n${item.stdout}\n\`\`\`\n\nStderr:\n\n\`\`\`text\n${item.stderr}\n\`\`\``;
  })
  .join("\n\n")}\n`;

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${existing.trimEnd()}${section}`, "utf8");

console.log("");
console.log(`Verification report updated: ${workflow.relativeToTarget(reportPath)}`);
if (failed.length > 0) {
  console.error(`Verification failed: ${failed.length} command(s) failed.`);
  process.exit(1);
}

console.log("Verification passed.");
