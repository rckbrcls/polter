import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdtemp, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import pc from "picocolors";
import { getUruBootstrapPayloadPath } from "./bootstrapPaths.js";
import { resolveUruMacosArtifact } from "./uruRelease.js";
import type {
  AppAction,
  AppExecutionContext,
  AppProfile,
  MigrationAction,
} from "./types.js";
import { promptConfirm, promptSelect, promptText } from "../lib/prompts.js";
import { runCommand, runSupabaseCommand } from "../lib/runner.js";
import { commandExists } from "../lib/system.js";

interface UruSupabaseConfigInput {
  url: string;
  publishableKey: string;
  projectRef: string;
}

const LINK_REF_FILE = join("supabase", ".temp", "project-ref");

function isUruProjectRoot(candidate: string): boolean {
  return (
    existsSync(join(candidate, "src-tauri", "tauri.conf.json")) &&
    existsSync(join(candidate, "supabase", "migrations")) &&
    existsSync(join(candidate, "package.json"))
  );
}

function findNearestUruRoot(startDir: string): string | undefined {
  let currentDir = resolve(startDir);

  while (true) {
    if (isUruProjectRoot(currentDir)) {
      return currentDir;
    }

    const siblingCandidate = join(currentDir, "uru");
    if (isUruProjectRoot(siblingCandidate)) {
      return siblingCandidate;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

function readEnvFile(envPath: string): Record<string, string> {
  if (!existsSync(envPath)) {
    return {};
  }

  const content = readFileSync(envPath, "utf-8");
  const entries: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    entries[key] = value;
  }

  return entries;
}

function writeEnvFile(envPath: string, nextEnv: Record<string, string>): void {
  const content = Object.entries(nextEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  writeFileSync(envPath, `${content}\n`);
}

function assertProjectRoot(projectRoot: string | undefined): string {
  if (!projectRoot) {
    throw new Error(
      "Could not resolve the Uru project root. Run from the Uru repository or pass --path.",
    );
  }

  return projectRoot;
}

function getLinkedProjectRef(projectRoot: string): string | null {
  const refPath = join(projectRoot, LINK_REF_FILE);
  if (!existsSync(refPath)) {
    return null;
  }

  const value = readFileSync(refPath, "utf-8").trim();
  return value || null;
}

function getDbPasswordArgs(): string[] {
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  return password ? ["--password", password] : [];
}

async function ensurePrerequisites(): Promise<void> {
  const checks = [
    { command: "node", label: "Node.js" },
    { command: "pnpm", label: "pnpm" },
    { command: "supabase", label: "Supabase CLI" },
  ];

  const missing = checks.filter((check) => !commandExists(check.command));
  if (missing.length > 0) {
    throw new Error(
      `Missing required tools: ${missing.map((item) => item.label).join(", ")}`,
    );
  }
}

async function runOrThrow(
  execution: string,
  args: string[],
  cwd: string,
  failureMessage: string,
): Promise<void> {
  const result = await runCommand(execution, args, cwd);
  if (result.spawnError || result.exitCode !== 0) {
    throw new Error(
      result.stderr.trim() || result.spawnError || failureMessage,
    );
  }
}

async function runSupabaseOrThrow(
  args: string[],
  cwd: string,
  failureMessage: string,
): Promise<void> {
  const result = await runSupabaseCommand(args, cwd);
  if (result.spawnError || result.exitCode !== 0) {
    throw new Error(
      result.stderr.trim() || result.spawnError || failureMessage,
    );
  }
}

async function ensureSupabaseLink(
  projectRoot: string,
  forceRelink = false,
): Promise<void> {
  const linkedRef = getLinkedProjectRef(projectRoot);
  if (linkedRef && !forceRelink) {
    process.stdout.write(`${pc.dim(`Linked project: ${linkedRef}`)}\n`);
    return;
  }

  process.stdout.write(
    `${pc.dim(forceRelink ? "Relinking Supabase project..." : "Linking Supabase project...")}\n`,
  );
  await runSupabaseOrThrow(
    ["link", ...getDbPasswordArgs()],
    projectRoot,
    "Supabase link failed.",
  );
}

async function collectSupabaseConfig(
  projectRoot?: string,
): Promise<UruSupabaseConfigInput> {
  const envPath = projectRoot ? join(projectRoot, ".env.local") : undefined;
  const currentEnv = envPath ? readEnvFile(envPath) : {};
  const currentRef = projectRoot ? getLinkedProjectRef(projectRoot) : null;

  const url = await promptText("Supabase URL", {
    defaultValue: currentEnv.VITE_SUPABASE_URL,
    required: true,
  });
  const publishableKey = await promptText("Supabase publishable key", {
    defaultValue: currentEnv.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    required: true,
  });
  const projectRef = await promptText("Supabase project ref", {
    defaultValue: currentRef ?? "",
    required: true,
  });

  return {
    url: url.trim().replace(/\/$/, ""),
    publishableKey: publishableKey.trim(),
    projectRef: projectRef.trim(),
  };
}

function writeUruEnv(projectRoot: string, config: UruSupabaseConfigInput): void {
  const envPath = join(projectRoot, ".env.local");
  const currentEnv = readEnvFile(envPath);
  const nextEnv = {
    ...currentEnv,
    VITE_SUPABASE_URL: config.url,
    VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: config.publishableKey,
  };

  writeEnvFile(envPath, nextEnv);
}

function writeBootstrapPayload(config: UruSupabaseConfigInput): string {
  const payloadPath = getUruBootstrapPayloadPath();
  mkdirSync(dirname(payloadPath), { recursive: true });
  writeFileSync(
    payloadPath,
    JSON.stringify(
      {
        url: config.url,
        publishableKey: config.publishableKey,
        projectRef: config.projectRef,
        updatedAt: new Date().toISOString(),
        source: "polterbase",
      },
      null,
      2,
    ),
  );
  return payloadPath;
}

async function promptProjectMode(
  options: AppExecutionContext["options"],
): Promise<"existing" | "create"> {
  if (options.useExistingProject) {
    return "existing";
  }

  if (options.createProject) {
    return "create";
  }

  const selected = await promptSelect(
    "How should Polterbase prepare Supabase for Uru?",
    [
      { value: "existing", label: "Use an existing Supabase project" },
      { value: "create", label: "Create a new Supabase project first" },
    ],
    "existing",
  );

  return selected as "existing" | "create";
}

async function runSetup(context: AppExecutionContext): Promise<number> {
  const projectRoot = assertProjectRoot(context.projectRoot);
  await ensurePrerequisites();

  const mode = await promptProjectMode(context.options);
  if (mode === "create") {
    process.stdout.write(
      `${pc.dim("Launching interactive Supabase project creation...")}\n`,
    );
    await runSupabaseOrThrow(
      ["projects", "create"],
      projectRoot,
      "Supabase project creation failed.",
    );
  }

  const config = await collectSupabaseConfig(projectRoot);
  writeUruEnv(projectRoot, config);
  process.stdout.write(`${pc.green("Saved .env.local")}\n`);

  process.stdout.write(`${pc.dim("Installing project dependencies...")}\n`);
  await runOrThrow(
    "pnpm",
    ["install", "--frozen-lockfile"],
    projectRoot,
    "Dependency installation failed.",
  );

  await ensureSupabaseLink(projectRoot, context.options.relink);
  process.stdout.write(`${pc.dim("Pushing migrations to linked project...")}\n`);
  await runSupabaseOrThrow(
    ["db", "push", "--linked", ...getDbPasswordArgs()],
    projectRoot,
    "Migration push failed.",
  );

  const payloadPath = writeBootstrapPayload(config);
  process.stdout.write(`${pc.green("Prepared runtime bootstrap payload")}\n`);
  process.stdout.write(`${pc.dim(`Payload path: ${payloadPath}`)}\n`);
  return 0;
}

async function runLink(context: AppExecutionContext): Promise<number> {
  const projectRoot = assertProjectRoot(context.projectRoot);
  await ensurePrerequisites();
  await ensureSupabaseLink(projectRoot, true);
  process.stdout.write(`${pc.green("Supabase link completed")}\n`);
  return 0;
}

async function runMigration(
  context: AppExecutionContext,
  action: MigrationAction,
): Promise<number> {
  const projectRoot = assertProjectRoot(context.projectRoot);
  await ensurePrerequisites();

  switch (action) {
    case "local-reset":
      await runSupabaseOrThrow(
        ["db", "reset", "--local"],
        projectRoot,
        "Local reset failed.",
      );
      process.stdout.write(`${pc.green("Local Supabase reset completed")}\n`);
      return 0;
    case "push":
      await ensureSupabaseLink(projectRoot, context.options.relink);
      await runSupabaseOrThrow(
        ["db", "push", "--linked", ...getDbPasswordArgs()],
        projectRoot,
        "Migration push failed.",
      );
      process.stdout.write(`${pc.green("Migrations pushed")}\n`);
      return 0;
    case "lint":
      await ensureSupabaseLink(projectRoot, context.options.relink);
      await runSupabaseOrThrow(
        ["db", "lint", "--linked"],
        projectRoot,
        "Migration lint failed.",
      );
      process.stdout.write(`${pc.green("Migration lint completed")}\n`);
      return 0;
    case "reset":
      await ensureSupabaseLink(projectRoot, context.options.relink);
      if (!context.options.yes) {
        const confirmed = await promptConfirm(
          "This will reset the linked remote database. Continue?",
          false,
        );
        if (!confirmed) {
          process.stdout.write(`${pc.yellow("Cancelled.")}\n`);
          return 0;
        }
      }
      await runSupabaseOrThrow(
        ["db", "reset", "--linked", ...getDbPasswordArgs()],
        projectRoot,
        "Remote reset failed.",
      );
      process.stdout.write(`${pc.green("Remote reset completed")}\n`);
      return 0;
  }
}

async function runConfigure(context: AppExecutionContext): Promise<number> {
  const projectRoot = context.projectRoot;
  const config = await collectSupabaseConfig(projectRoot);

  if (projectRoot) {
    writeUruEnv(projectRoot, config);
    process.stdout.write(`${pc.green("Updated .env.local")}\n`);
  }

  const payloadPath = writeBootstrapPayload(config);
  process.stdout.write(`${pc.green("Updated runtime bootstrap payload")}\n`);
  process.stdout.write(`${pc.dim(`Payload path: ${payloadPath}`)}\n`);
  return 0;
}

async function downloadFile(url: string, destinationPath: string): Promise<number> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to download artifact: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  writeFileSync(destinationPath, buffer);
  return buffer.byteLength;
}

async function extractArchive(archivePath: string, outputDir: string): Promise<void> {
  if (archivePath.endsWith(".zip")) {
    await runOrThrow(
      "ditto",
      ["-xk", archivePath, outputDir],
      process.cwd(),
      "Archive extraction failed.",
    );
    return;
  }

  if (archivePath.endsWith(".tar.gz") || archivePath.endsWith(".tgz")) {
    await runOrThrow(
      "tar",
      ["-xzf", archivePath, "-C", outputDir],
      process.cwd(),
      "Archive extraction failed.",
    );
    return;
  }

  throw new Error("Unsupported artifact format. Use a .zip or .tar.gz macOS artifact.");
}

async function findFirstAppBundle(dir: string): Promise<string | undefined> {
  const entries = await readdir(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const entryStat = await stat(fullPath);

    if (entryStat.isDirectory() && entry.endsWith(".app")) {
      return fullPath;
    }

    if (entryStat.isDirectory()) {
      const nested = await findFirstAppBundle(fullPath);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

async function installMacosApp(context: AppExecutionContext): Promise<number> {
  const artifact = await resolveUruMacosArtifact(context.options);

  const tempRoot = await mkdtemp(join(tmpdir(), "polterbase-uru-"));
  const archivePath = join(tempRoot, artifact.fileName);
  const extractDir = join(tempRoot, "extract");
  mkdirSync(extractDir, { recursive: true });

  if (artifact.source === "github-release") {
    const releaseLabel = artifact.tagName ?? "latest";
    process.stdout.write(
      `${pc.dim(`Resolved ${artifact.fileName} from ${artifact.repo} (${releaseLabel})`)}\n`,
    );
  } else {
    process.stdout.write(`${pc.dim(`Using explicit artifact URL: ${artifact.url}`)}\n`);
  }

  process.stdout.write(`${pc.dim("Downloading Uru macOS artifact...")}\n`);
  const downloadedSize = await downloadFile(artifact.url, archivePath);
  if (artifact.size && downloadedSize !== artifact.size) {
    throw new Error(
      `Downloaded file size mismatch for ${artifact.fileName}. Expected ${artifact.size} bytes but received ${downloadedSize}.`,
    );
  }

  process.stdout.write(`${pc.dim("Extracting artifact...")}\n`);
  await extractArchive(archivePath, extractDir);

  const appBundle = await findFirstAppBundle(extractDir);
  if (!appBundle) {
    throw new Error("No .app bundle was found inside the downloaded artifact.");
  }

  const installDir = context.options.installDir ?? "/Applications";
  mkdirSync(installDir, { recursive: true });
  const destination = join(installDir, "uru.app");

  if (existsSync(destination)) {
    const confirmed =
      context.options.yes ||
      (await promptConfirm(`Replace existing installation at ${destination}?`, false));

    if (!confirmed) {
      process.stdout.write(`${pc.yellow("Cancelled.")}\n`);
      return 0;
    }

    rmSync(destination, { recursive: true, force: true });
  }

  await runOrThrow(
    "cp",
    ["-R", appBundle, destination],
    process.cwd(),
    "App copy failed.",
  );
  process.stdout.write(`${pc.green(`Installed Uru to ${destination}`)}\n`);

  await runConfigure(context);

  const shouldOpen =
    context.options.yes || (await promptConfirm("Open Uru now?", true));
  if (shouldOpen) {
    await runOrThrow("open", ["-a", destination], process.cwd(), "Unable to open Uru.");
  }

  return 0;
}

export const uruProfile: AppProfile = {
  id: "uru",
  displayName: "Uru",
  detect(startDir = process.cwd()) {
    return findNearestUruRoot(startDir);
  },
  resolveProjectRoot(startDir = process.cwd(), explicitPath?: string) {
    if (explicitPath) {
      const resolved = resolve(explicitPath);
      if (isUruProjectRoot(resolved)) {
        return resolved;
      }

      return findNearestUruRoot(resolved);
    }

    return findNearestUruRoot(startDir);
  },
  async run(action: AppAction, context: AppExecutionContext) {
    switch (action) {
      case "setup":
        return runSetup(context);
      case "link":
        return runLink(context);
      case "configure":
        return runConfigure(context);
      case "install":
        return installMacosApp(context);
      case "migrate":
        return runMigration(
          context,
          context.options.migrationAction ?? "push",
        );
    }
  },
};
