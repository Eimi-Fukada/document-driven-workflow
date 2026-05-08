import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function parseOption(args, name, fallback, { startIndex = 0 } = {}) {
  for (let i = startIndex; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === `--${name}`) {
      return args[i + 1] || fallback;
    }
    if (arg.startsWith(`--${name}=`)) {
      return arg.slice(name.length + 3) || fallback;
    }
  }
  return fallback;
}

export function createWorkflowContext(args) {
  const packageRoot = path.resolve(__dirname, "..", "..");
  const sourceMode = existsSync(path.join(packageRoot, "docs", "workflow", "templates"));
  const templateRoot = sourceMode
    ? path.join(packageRoot, "docs", "workflow", "templates")
    : path.join(packageRoot, "templates");

  const targetArg = parseOption(args, "target", process.env.WORKFLOW_TARGET || process.cwd());
  const targetRoot = path.resolve(targetArg);

  return {
    packageRoot,
    sourceMode,
    targetRoot,
    templateRoot,
    resolveTarget(inputPath) {
      return path.isAbsolute(inputPath) ? inputPath : path.join(targetRoot, inputPath);
    },
    relativeToTarget(inputPath) {
      return path.relative(targetRoot, inputPath).replaceAll("\\", "/");
    },
  };
}

export function isWorkflowOptionWithValue(arg) {
  return ["--target", "--features", "--stack", "--agent", "--epic"].includes(arg);
}
