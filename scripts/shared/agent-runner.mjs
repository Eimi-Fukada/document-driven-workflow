import { spawnSync } from "child_process";

export function parseAgentOption(args) {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--agent") {
      return args[i + 1] || "codex";
    }
    if (arg.startsWith("--agent=")) {
      return arg.split("=")[1] || "codex";
    }
  }

  return process.env.WORKFLOW_HYDRATE_AGENT || "codex";
}

export function runAgent({ agent, cwd, prompt }) {
  if (agent === "none") {
    console.log("AI generation skipped because --agent none was provided.");
    return;
  }

  if (agent !== "codex") {
    console.error(`Unsupported hydrate agent: ${agent}`);
    console.error("Supported values: codex, none");
    process.exit(1);
  }

  const result = spawnSync(
    "codex",
    [
      "exec",
      "--cd",
      cwd,
      "--sandbox",
      "workspace-write",
      "--ask-for-approval",
      "never",
      "--skip-git-repo-check",
      "--",
      prompt,
    ],
    {
      cwd,
      encoding: "utf8",
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  if (result.error) {
    console.error(`Failed to run Codex CLI: ${result.error.message}`);
    console.error("Install or login to Codex CLI, or run with --agent none to only scaffold files.");
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`Codex hydrate agent failed with exit code ${result.status}.`);
    process.exit(result.status || 1);
  }
}
