import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "fs";
import path from "path";

export function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}

export function resetTarget(targetPath) {
  if (existsSync(targetPath)) {
    rmSync(targetPath, { recursive: true, force: true });
  }
  ensureDir(targetPath);
}

export function copyDirectoryRecursive(source, target) {
  ensureDir(target);

  for (const entry of readdirSync(source)) {
    const src = path.join(source, entry);
    const dst = path.join(target, entry);
    const stat = statSync(src);

    if (stat.isDirectory()) {
      copyDirectoryRecursive(src, dst);
    } else {
      cpSync(src, dst);
    }
  }
}

