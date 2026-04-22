import { execa, execaSync, type ResultPromise } from "execa";
import { existsSync } from "./fs.js";
import { delimiter, dirname, join, resolve } from "node:path";
import pRetry from "p-retry";

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
  pid: number | undefined;
  subprocess: ResultPromise;
}

export function runCommand(
  execution: string | CommandExecution,
  args: string[],
  cwd: string = process.cwd(),
  options?: { quiet?: boolean; onData?: (stdout: string, stderr: string) => void },
): RunHandle {
  let stdoutBuf = "";
  let stderrBuf = "";
  const resolvedExecution =
    typeof execution === "string" ? { command: execution } : execution;

  const subprocess = execa(resolvedExecution.command, args, {
    cwd,
    env: resolvedExecution.env,
    shell: true,
    detached: true,
    stdin: options?.quiet ? "pipe" : "inherit",
    stdout: "pipe",
    stderr: "pipe",
    reject: false,
  });

  if (options?.quiet) {
    subprocess.stdin?.end();
  }

  subprocess.stdout?.on("data", (data: Buffer) => {
    const text = data.toString();
    stdoutBuf += text;
    if (!options?.quiet) process.stdout.write(text);
    options?.onData?.(stdoutBuf, stderrBuf);
  });

  subprocess.stderr?.on("data", (data: Buffer) => {
    const text = data.toString();
    stderrBuf += text;
    if (!options?.quiet) process.stderr.write(text);
    options?.onData?.(stdoutBuf, stderrBuf);
  });

  const promise = subprocess.then(
    (result) => ({
      exitCode: result.exitCode ?? null,
      signal: (result.signal ?? null) as NodeJS.Signals | null,
      stdout: stdoutBuf,
      stderr: stderrBuf,
    }),
    (err: Error) => ({
      exitCode: null,
      signal: null,
      stdout: stdoutBuf,
      stderr: stderrBuf,
      spawnError: err.message,
    }),
  );

  return {
    promise,
    abort: () => {
      if (subprocess.pid) {
        try { process.kill(-subprocess.pid, "SIGTERM"); } catch { /* already gone */ }
      }
    },
    pid: subprocess.pid,
    subprocess,
  };
}

export function runInteractiveCommand(
  execution: string | CommandExecution,
  args: string[],
  cwd: string = process.cwd(),
): RunResult {
  const resolved =
    typeof execution === "string" ? { command: execution } : execution;
  try {
    const result = execaSync(resolved.command, args, {
      cwd,
      env: resolved.env,
      shell: true,
      stdio: "inherit",
    });
    return {
      exitCode: result.exitCode ?? null,
      signal: null,
      stdout: "",
      stderr: "",
    };
  } catch (err) {
    if (err && typeof err === "object" && "exitCode" in err) {
      const execaErr = err as { exitCode: number; signal?: string; message?: string };
      return {
        exitCode: execaErr.exitCode,
        signal: (execaErr.signal ?? null) as NodeJS.Signals | null,
        stdout: "",
        stderr: "",
      };
    }
    return {
      exitCode: null,
      signal: null,
      stdout: "",
      stderr: "",
      spawnError: (err as Error).message,
    };
  }
}

export async function runSupabaseCommand(
  args: string[],
  cwd: string = process.cwd(),
): Promise<RunResult> {
  return runCommand(resolveSupabaseCommand(cwd), args, cwd).promise;
}

export async function runCommandWithRetry(
  execution: string | CommandExecution,
  args: string[],
  cwd: string = process.cwd(),
  options?: { quiet?: boolean; onData?: (stdout: string, stderr: string) => void },
): Promise<RunResult> {
  return pRetry(
    async () => {
      const result = await runCommand(execution, args, cwd, options).promise;
      if (result.spawnError && !result.spawnError.includes("ENOENT")) {
        throw new Error(result.spawnError);
      }
      return result;
    },
    {
      retries: 2,
      shouldRetry: ({ error }) => !error.message.includes("ENOENT"),
    },
  );
}
