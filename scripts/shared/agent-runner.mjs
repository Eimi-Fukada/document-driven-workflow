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

  return (process.env.WORKFLOW_HYDRATE_AGENT || "codex").toLowerCase();
}

function runCommand({ agentName, command, args, cwd, installHint }) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(`Failed to run ${agentName}: ${result.error.message}`);
    console.error(installHint);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${agentName} failed with exit code ${result.status}.`);
    process.exit(result.status || 1);
  }
}

function runCodex({ cwd, prompt }) {
  runCommand({
    agentName: "Codex CLI",
    command: "codex",
    args: [
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
    cwd,
    installHint: "Install or login to Codex CLI, or run with --agent none to only scaffold files.",
  });
}

function runClaude({ cwd, prompt }) {
  runCommand({
    agentName: "Claude Code CLI",
    command: "claude",
    args: [
      "--permission-mode",
      "acceptEdits",
      "--max-turns",
      "20",
      "-p",
      prompt,
    ],
    cwd,
    installHint: "Install or login to Claude Code CLI, or run with --agent none to only scaffold files.",
  });
}

export function runAgent({ agent, cwd, prompt }) {
  const selectedAgent = (agent || "codex").toLowerCase();

  if (selectedAgent === "none") {
    console.log("AI generation skipped because --agent none was provided.");
    return;
  }

  if (selectedAgent === "codex") {
    runCodex({ cwd, prompt });
    return;
  }

  if (selectedAgent === "claude") {
    runClaude({ cwd, prompt });
    return;
  }

  if (!["codex", "claude", "none"].includes(selectedAgent)) {
    console.error(`Unsupported hydrate agent: ${agent}`);
    console.error("Supported values: codex, claude, none");
    process.exit(1);
  }
}
