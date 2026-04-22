import { spawn, exec } from "node:child_process";

export async function openInBrowser(url: string): Promise<void> {
  return new Promise((resolve) => {
    const cmd =
      process.platform === "darwin"
        ? `open "${url}"`
        : process.platform === "win32"
          ? `start "${url}"`
          : `xdg-open "${url}"`;

    exec(cmd, () => resolve());
  });
}

export async function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve) => {
    const cmd =
      process.platform === "darwin"
        ? "pbcopy"
        : process.platform === "win32"
          ? "clip"
          : "xclip -selection clipboard";

    const child = spawn(cmd, [], { shell: true });
    child.stdin?.write(text);
    child.stdin?.end();
    child.on("exit", () => resolve());
    child.on("error", () => resolve());
  });
}
