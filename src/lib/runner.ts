import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";

export interface RunResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  spawnError?: string;
}

export interface CommandExecution {
  command: string;
  env?: NodeJS.ProcessEnv;
}

export interface SupabaseCommandResolution extends CommandExecution {
  source: "repository" | "path";
  localBinDir?: string;
}

function getSupabaseBinaryCandidates(): string[] {
  if (process.platform === "win32") {
    return ["supabase.cmd", "supabase.exe", "supabase"];
  }

  return ["supabase"];
}

function hasLocalSupabaseBinary(binDir: string): boolean {
  return getSupabaseBinaryCandidates().some((candidate) =>
    existsSync(join(binDir, candidate)),
  );
}

function getPathEnvKey(env: NodeJS.ProcessEnv): string {
  return Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
}

export function findLocalSupabaseBinDir(
  startDir: string = process.cwd(),
): string | undefined {
  let currentDir = resolve(startDir);

  while (true) {
    const binDir = join(currentDir, "node_modules", ".bin");
    if (hasLocalSupabaseBinary(binDir)) {
      return binDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

export function resolveSupabaseCommand(
  startDir: string = process.cwd(),
  env: NodeJS.ProcessEnv = process.env,
): SupabaseCommandResolution {
  const localBinDir = findLocalSupabaseBinDir(startDir);

  if (!localBinDir) {
    return {
      command: "supabase",
      env: { ...env },
      source: "path",
    };
  }

  const pathKey = getPathEnvKey(env);
  const currentPath = env[pathKey];

  return {
    command: "supabase",
    env: {
      ...env,
      [pathKey]: currentPath
        ? `${localBinDir}${delimiter}${currentPath}`
        : localBinDir,
    },
    source: "repository",
    localBinDir,
  };
}

export interface RunHandle {
  promise: Promise<RunResult>;
  abort: () => void;
}

export function runCommand(
  execution: string | CommandExecution,
  args: string[],
  cwd: string = process.cwd(),
  options?: { quiet?: boolean; onData?: (stdout: string, stderr: string) => void },
): RunHandle {
  let stdout = "";
  let stderr = "";
  const resolvedExecution =
    typeof execution === "string" ? { command: execution } : execution;

  const child = spawn(resolvedExecution.command, args, {
    cwd,
    env: resolvedExecution.env,
    shell: true,
    stdio: [options?.quiet ? "pipe" : "inherit", "pipe", "pipe"],
  });

  if (options?.quiet) {
    child.stdin?.end();
  }

  const promise = new Promise<RunResult>((resolve) => {
    child.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      if (!options?.quiet) process.stdout.write(text);
      options?.onData?.(stdout, stderr);
    });

    child.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      stderr += text;
      if (!options?.quiet) process.stderr.write(text);
      options?.onData?.(stdout, stderr);
    });

    child.on("error", (err: Error) => {
      resolve({
        exitCode: null,
        signal: null,
        stdout,
        stderr,
        spawnError: err.message,
      });
    });

    child.on("exit", (code: number | null, signal: NodeJS.Signals | null) => {
      resolve({ exitCode: code, signal, stdout, stderr });
    });
  });

  return {
    promise,
    abort: () => child.kill("SIGTERM"),
  };
}

export function runInteractiveCommand(
  execution: string | CommandExecution,
  args: string[],
  cwd: string = process.cwd(),
): RunResult {
  const resolved =
    typeof execution === "string" ? { command: execution } : execution;
  const result = spawnSync(resolved.command, args, {
    cwd,
    env: resolved.env,
    shell: true,
    stdio: "inherit",
  });
  return {
    exitCode: result.status,
    signal: result.signal,
    stdout: "",
    stderr: "",
    spawnError: result.error?.message,
  };
}

export async function runSupabaseCommand(
  args: string[],
  cwd: string = process.cwd(),
): Promise<RunResult> {
  return runCommand(resolveSupabaseCommand(cwd), args, cwd).promise;
}
