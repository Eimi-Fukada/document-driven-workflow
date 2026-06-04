import { createHash } from "crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { createWorkflowContext, parseOption } from "../../shared/workflow-context.mjs";
import { printJsonForCli } from "../../shared/document-utils.mjs";

const args = process.argv.slice(2);
const workflow = createWorkflowContext(args);
const host = parseOption(args, "host", "all", { startIndex: 0 }).toLowerCase();
const outputArg = parseOption(args, "output", "", { startIndex: 0 });
const skipInstallCheck = args.includes("--skip-install-check");
const skipCliCheck = args.includes("--skip-cli-check");
const jsonOutput = args.includes("--json");
const noWrite = args.includes("--no-write") || (jsonOutput && !outputArg);

const validHosts = new Set(["all", "codex", "claude"]);
if (!validHosts.has(host)) {
  console.error(`Invalid --host value: ${host}. Allowed values: all, codex, claude.`);
  process.exit(1);
}

const referenceFiles = [
  "USER_GUIDE.md",
  "USAGE.md",
  "WORKFLOW.md",
  "AUTOMATION.md",
  "LANGUAGE_POLICY.md",
  "MODE_ROUTER.md",
  "EXECUTION_PROTOCOL.md",
  "EXECUTION_DISCIPLINE.md",
  "PRODUCT_TRACEABILITY.md",
  "EPIC_WORKFLOW.md",
  "GATES.md",
  "LEGACY_ADOPTION.md",
  "STACK_POLICY.md",
  "POSITIONING.md",
  "MAESTRO_INTEGRATION.md",
];

const requiredSkillFiles = [
  "SKILL.md",
  "scripts/workflow/automation/adopt.mjs",
  "scripts/workflow/automation/process.mjs",
  "scripts/workflow/automation/continue.mjs",
  "scripts/workflow/automation/verify.mjs",
  "scripts/workflow/automation/doctor.mjs",
  "scripts/workflow/automation/completion-check.mjs",
  "scripts/workflow/automation/finish-feature.mjs",
  "scripts/workflow/automation/status.mjs",
  "scripts/workflow/automation/handoff-pack.mjs",
  "scripts/workflow/feature/gate-feature.mjs",
  "scripts/workflow/epic/gate-epic.mjs",
  "templates/feature/00-workflow.yaml",
  "templates/feature/REVIEW.md",
  "templates/feature/01-prd.md",
  "templates/feature/07-verification-report.md",
  "templates/contracts/integration-contract.md",
  "templates/contracts/project-contract.md",
  "templates/epic/00-source.md",
  "templates/epic/REVIEW.md",
  "references/USAGE.md",
  "references/POSITIONING.md",
  "references/MAESTRO_INTEGRATION.md",
];

const checks = [];

function classifyCheck(area, check) {
  if (area === "Installed skill" || area === "CLI" || area === "Skill files") {
    return "environment_blocker";
  }
  if (area === "Legacy" || area === "Target docs") {
    return "doc_blocker";
  }
  if (area === "Target project") {
    return check === "target root" ? "environment_blocker" : "doc_blocker";
  }
  return "doc_blocker";
}

function addCheck(area, status, check, detail, blockerType = classifyCheck(area, check)) {
  checks.push({ area, status, check, detail, blocker_type: blockerType });
}

function normalizeRel(input) {
  return input.replaceAll("\\", "/").replace(/^\/+/, "");
}

function listFiles(root, prefix = "") {
  if (!existsSync(root)) {
    return [];
  }

  const output = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      output.push(...listFiles(full, rel));
    } else if (entry.isFile()) {
      output.push(normalizeRel(rel));
    }
  }
  return output.sort();
}

function addFileToHash(hash, root, rel) {
  const full = path.join(root, rel);
  if (!existsSync(full)) {
    hash.update(`missing:${normalizeRel(rel)}\0`);
    return;
  }
  hash.update(`file:${normalizeRel(rel)}\0`);
  hash.update(readFileSync(full));
  hash.update("\0");
}

function hashInstalledSkill(skillRoot) {
  if (!existsSync(skillRoot)) {
    return "";
  }
  const hash = createHash("sha256");
  for (const rel of listFiles(skillRoot)) {
    addFileToHash(hash, skillRoot, rel);
  }
  return hash.digest("hex");
}

function addDirectoryMapping(hash, sourceRoot, sourcePrefix, outputPrefix) {
  const root = path.join(sourceRoot, sourcePrefix);
  for (const rel of listFiles(root)) {
    const sourceRel = path.join(sourcePrefix, rel);
    const outputRel = normalizeRel(path.join(outputPrefix, rel));
    hash.update(`file:${outputRel}\0`);
    hash.update(readFileSync(path.join(sourceRoot, sourceRel)));
    hash.update("\0");
  }
}

function hashSourceBundle(packageRoot) {
  const hash = createHash("sha256");
  const mappings = [["skills/document-driven-workflow/SKILL.md", "SKILL.md"]];
  for (const file of referenceFiles) {
    mappings.push([`docs/workflow/${file}`, `references/${file}`]);
  }
  for (const [sourceRel, outputRel] of mappings) {
    const source = path.join(packageRoot, sourceRel);
    if (!existsSync(source)) {
      hash.update(`missing:${normalizeRel(outputRel)}\0`);
      continue;
    }
    hash.update(`file:${normalizeRel(outputRel)}\0`);
    hash.update(readFileSync(source));
    hash.update("\0");
  }
  addDirectoryMapping(hash, packageRoot, "docs/workflow/presets", "references/presets");
  addDirectoryMapping(hash, packageRoot, "docs/workflow/templates", "templates");
  addDirectoryMapping(hash, packageRoot, "scripts/workflow", "scripts/workflow");
  addDirectoryMapping(hash, packageRoot, "scripts/shared", "scripts/shared");
  return hash.digest("hex");
}

function findCommand(command) {
  const result = spawnSync(process.platform === "win32" ? "where.exe" : "which", [command], {
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function targetExists(rel) {
  return existsSync(path.join(workflow.targetRoot, rel));
}

const projectMarkers = [
  ["package.json", "node"],
  ["pnpm-workspace.yaml", "node-workspace"],
  ["pubspec.yaml", "flutter"],
  ["pyproject.toml", "python"],
  ["requirements.txt", "python"],
  ["pom.xml", "java-maven"],
  ["build.gradle", "java-gradle"],
  ["build.gradle.kts", "java-gradle"],
  ["settings.gradle", "java-gradle"],
  ["settings.gradle.kts", "java-gradle"],
  ["go.mod", "go"],
  ["Cargo.toml", "rust"],
  ["composer.json", "php"],
  ["Gemfile", "ruby"],
];

function findProjectMarkers() {
  const direct = projectMarkers
    .filter(([file]) => targetExists(file))
    .map(([file, kind]) => `${file}:${kind}`);
  const dotnet = listFiles(workflow.targetRoot)
    .filter((rel) => /\.(csproj|fsproj|vbproj|sln)$/i.test(rel))
    .slice(0, 8)
    .map((rel) => `${rel}:dotnet`);
  return [...direct, ...dotnet];
}

const sourceMode = existsSync(path.join(workflow.packageRoot, "docs", "workflow", "templates"));
const bundleHash = sourceMode ? hashSourceBundle(workflow.packageRoot) : hashInstalledSkill(workflow.packageRoot);

function resolvePackageFile(rel) {
  if (!sourceMode) {
    return path.join(workflow.packageRoot, rel);
  }

  if (rel === "SKILL.md") {
    return path.join(workflow.packageRoot, "skills", "document-driven-workflow", "SKILL.md");
  }
  if (rel.startsWith("references/presets/")) {
    return path.join(workflow.packageRoot, "docs", "workflow", "presets", rel.slice("references/presets/".length));
  }
  if (rel.startsWith("references/")) {
    return path.join(workflow.packageRoot, "docs", "workflow", rel.slice("references/".length));
  }
  if (rel.startsWith("templates/")) {
    return path.join(workflow.packageRoot, "docs", "workflow", "templates", rel.slice("templates/".length));
  }
  return path.join(workflow.packageRoot, rel);
}

for (const file of requiredSkillFiles) {
  const filePath = resolvePackageFile(file);
  addCheck(
    "Skill files",
    existsSync(filePath) ? "PASS" : "BLOCKER",
    file,
    existsSync(filePath) ? "required file exists" : "required workflow file is missing",
  );
}

if (!skipInstallCheck) {
  const homeDir = os.homedir();
  const hostRoots = {
    codex: path.join(homeDir, ".codex", "skills", "document-driven-workflow"),
    claude: path.join(homeDir, ".claude", "skills", "document-driven-workflow"),
  };
  const hostsToCheck = host === "all" ? ["codex", "claude"] : [host];

  for (const item of hostsToCheck) {
    const installedRoot = hostRoots[item];
    if (!existsSync(installedRoot)) {
      addCheck(
        "Installed skill",
        host === "all" ? "WARN" : "BLOCKER",
        `${item} installed skill`,
        `not found at ${installedRoot}`,
      );
      continue;
    }

    const installedHash = hashInstalledSkill(installedRoot);
    addCheck(
      "Installed skill",
      installedHash === bundleHash ? "PASS" : "BLOCKER",
      `${item} installed skill is current`,
      installedHash === bundleHash
        ? `installed skill matches ${sourceMode ? "source bundle" : "running skill"}`
        : `installed skill is stale; run npm run setup:${item} from the workflow repo`,
    );
  }
} else {
  addCheck("Installed skill", "WARN", "install freshness check", "skipped by --skip-install-check");
}

if (!skipCliCheck) {
  const codexPaths = findCommand("codex");
  const claudePaths = findCommand("claude");
  if (host === "codex") {
    addCheck("CLI", codexPaths.length ? "PASS" : "BLOCKER", "Codex CLI", codexPaths[0] || "not found");
  } else if (host === "claude") {
    addCheck("CLI", claudePaths.length ? "PASS" : "BLOCKER", "Claude Code CLI", claudePaths[0] || "not found");
  } else {
    addCheck("CLI", codexPaths.length ? "PASS" : "WARN", "Codex CLI", codexPaths[0] || "not found");
    addCheck("CLI", claudePaths.length ? "PASS" : "WARN", "Claude Code CLI", claudePaths[0] || "not found");
    if (!codexPaths.length && !claudePaths.length) {
      addCheck("CLI", "BLOCKER", "AI CLI availability", "neither codex nor claude command is available");
    }
  }
} else {
  addCheck("CLI", "WARN", "CLI availability check", "skipped by --skip-cli-check");
}

addCheck("Target project", existsSync(workflow.targetRoot) ? "PASS" : "BLOCKER", "target root", workflow.targetRoot);
const detectedProjectMarkers = findProjectMarkers();
addCheck(
  "Target project",
  detectedProjectMarkers.length
    ? "PASS"
    : "WARN",
  "project marker",
  detectedProjectMarkers.length
    ? `detected project marker(s): ${detectedProjectMarkers.join(", ")}`
    : "no common project marker detected; custom stacks are still allowed, but technical contract must record project commands",
);
addCheck("Target project", targetExists(".git") ? "PASS" : "WARN", "git repository", "git is recommended for scope checks");
addCheck("Target docs", targetExists("docs") ? "PASS" : "WARN", "docs directory", "missing docs/ means workflow is not adopted yet");
const agentsPath = path.join(workflow.targetRoot, "AGENTS.md");
const agentsContent = existsSync(agentsPath) ? readFileSync(agentsPath, "utf8") : "";
const hasAdoptionBlock =
  agentsContent.includes("<!-- document-driven-workflow:start -->") &&
  agentsContent.includes("<!-- document-driven-workflow:end -->");
const hasExistingWorkflowInstructions =
  /document-driven-workflow/i.test(agentsContent) &&
  /gate-feature\.mjs|Feature gate/i.test(agentsContent) &&
  /finish-feature\.mjs|COMPLETION_PROOF\.json/i.test(agentsContent);
addCheck(
  "Target project",
  hasAdoptionBlock || hasExistingWorkflowInstructions ? "PASS" : "WARN",
  "persistent workflow instructions",
  hasAdoptionBlock
    ? "AGENTS.md contains document-driven-workflow adoption block"
    : hasExistingWorkflowInstructions
      ? "AGENTS.md contains existing document-driven-workflow instructions"
    : "ask document-driven-workflow to adopt this project so later Codex/Claude turns keep using the workflow without repeating the skill name",
);
addCheck("Target docs", targetExists("docs/features") ? "PASS" : "WARN", "docs/features", "missing Feature directory");
addCheck("Target docs", targetExists("docs/epics") ? "PASS" : "WARN", "docs/epics", "missing Epic directory");
addCheck(
  "Target docs",
  targetExists("docs/product/requirement-ledger.md") && targetExists("docs/product/traceability.md") ? "PASS" : "WARN",
  "product traceability docs",
  "run the product init flow before long-lived product work",
);

if (targetExists("docs/legacy")) {
  addCheck(
    "Legacy",
    targetExists("docs/legacy/BASELINE.md") || targetExists("docs/legacy/baseline.md") ? "PASS" : "BLOCKER",
    "legacy baseline",
    "legacy-existing requires BASELINE.md or baseline.md",
  );
  addCheck(
    "Legacy",
    targetExists("docs/legacy/COMPATIBILITY_CONTRACT.md") || targetExists("docs/legacy/compatibility-contract.md")
      ? "PASS"
      : "BLOCKER",
    "compatibility contract",
    "legacy-existing requires COMPATIBILITY_CONTRACT.md or compatibility-contract.md",
  );
}

const workflowSubjects = [
  ...listFiles(path.join(workflow.targetRoot, "docs", "features"))
    .filter((rel) => rel.endsWith("00-workflow.yaml"))
    .map((rel) => `docs/features/${rel}`),
  ...listFiles(path.join(workflow.targetRoot, "docs", "epics"))
    .filter((rel) => rel.endsWith("00-workflow.yaml"))
    .map((rel) => `docs/epics/${rel}`),
];
addCheck(
  "Target docs",
  workflowSubjects.length ? "PASS" : "WARN",
  "workflow subjects",
  workflowSubjects.length ? `${workflowSubjects.length} subjects found` : "no Epic or Feature workflow subjects found",
);

const blockers = checks.filter((item) => item.status === "BLOCKER");
const warnings = checks.filter((item) => item.status === "WARN");
const reportPath = outputArg
  ? workflow.resolveTarget(outputArg)
  : path.join(workflow.targetRoot, "docs", "workflow", "DOCTOR_REPORT.md");

const report = `# Workflow Doctor Report

- Generated at: ${new Date().toISOString()}
- Workflow package: ${workflow.packageRoot}
- Target project: ${workflow.targetRoot}
- Host check: ${host}
- Result: ${blockers.length ? "BLOCKED" : "PASS"}

## Summary

- Blockers: ${blockers.length}
- Warnings: ${warnings.length}
- Checks: ${checks.length}

## Checks

| Area | Status | Blocker Type | Check | Detail |
| --- | --- | --- | --- | --- |
${checks
  .map((item) => `| ${item.area} | ${item.status} | ${item.blocker_type} | ${item.check} | ${String(item.detail).replaceAll("|", "\\|")} |`)
  .join("\n")}

## Next Step

${
  blockers.length
    ? "- Fix the BLOCKER items before using the workflow for implementation."
    : "- The workflow is usable. WARN items should be handled before a high-risk delivery."
}
`;

if (!noWrite) {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, report, "utf8");
}

const payload = {
  schema_version: "1",
  kind: "workflow_doctor",
  generated_at: new Date().toISOString(),
  package_root: workflow.packageRoot,
  target_root: workflow.targetRoot,
  host,
  result: blockers.length ? "BLOCKED" : "PASS",
  report_path: noWrite ? null : reportPath,
  summary: {
    blockers: blockers.length,
    warnings: warnings.length,
    checks: checks.length,
  },
  checks,
};

if (jsonOutput) {
  printJsonForCli(payload);
} else {
  if (!noWrite) {
    console.log(`Doctor report written: ${workflow.relativeToTarget(reportPath)}`);
  }
  console.log(`Workflow doctor result: ${blockers.length ? "BLOCKED" : "PASS"}`);
  console.log(`Blockers: ${blockers.length}`);
  console.log(`Warnings: ${warnings.length}`);
}

if (blockers.length) {
  process.exit(1);
}
