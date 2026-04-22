import { execSync } from "node:child_process";
import which from "which";

export function commandExists(command: string): boolean {
  try {
    which.sync(command);
    return true;
  } catch {
    return false;
  }
}

export function execCapture(command: string): string {
  return execSync(command, {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}
