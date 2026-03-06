import type { AppAction, MigrationAction, ParsedCliOptions } from "../apps/types.js";

export interface ParsedCliCommand {
  mode: "interactive" | "app" | "help";
  options: ParsedCliOptions;
}

function takeValue(
  args: string[],
  index: number,
): { value?: string; nextIndex: number } {
  const token = args[index];
  if (!token) {
    return { nextIndex: index };
  }

  const eqIndex = token.indexOf("=");
  if (eqIndex >= 0) {
    return {
      value: token.slice(eqIndex + 1),
      nextIndex: index,
    };
  }

  return { value: args[index + 1], nextIndex: index + 1 };
}

export function parseCliArgs(argv: string[]): ParsedCliCommand {
  if (argv.length === 0) {
    return { mode: "interactive", options: {} };
  }

  if (argv[0] === "--help" || argv[0] === "help") {
    return { mode: "help", options: {} };
  }

  if (argv[0] !== "app") {
    return { mode: "interactive", options: {} };
  }

  const options: ParsedCliOptions = {};
  options.action = argv[1] as AppAction | undefined;
  options.app = argv[2];

  for (let index = 3; index < argv.length; index += 1) {
    const token = argv[index]!;

    if (token === "push" || token === "lint" || token === "reset" || token === "local-reset") {
      options.migrationAction = token as MigrationAction;
      continue;
    }

    if (token === "--yes") {
      options.yes = true;
      continue;
    }

    if (token === "--relink") {
      options.relink = true;
      continue;
    }

    if (token === "--create-project") {
      options.createProject = true;
      continue;
    }

    if (token === "--use-existing-project") {
      options.useExistingProject = true;
      continue;
    }

    if (token.startsWith("--path")) {
      const parsed = takeValue(argv, index);
      options.path = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    if (token.startsWith("--version")) {
      const parsed = takeValue(argv, index);
      options.version = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    if (token.startsWith("--artifact-url")) {
      const parsed = takeValue(argv, index);
      options.artifactUrl = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    if (token.startsWith("--install-dir")) {
      const parsed = takeValue(argv, index);
      options.installDir = parsed.value;
      index = parsed.nextIndex;
      continue;
    }
  }

  return {
    mode: "app",
    options,
  };
}

export function printCliHelp(): void {
  process.stdout.write(
    [
      "Polterbase",
      "",
      "Usage:",
      "  polterbase",
      "  polterbase app setup uru [--path <dir>] [--create-project|--use-existing-project] [--yes]",
      "  polterbase app link uru [--path <dir>] [--relink]",
      "  polterbase app migrate uru [push|lint|reset|local-reset] [--path <dir>] [--relink]",
      "  polterbase app configure uru [--path <dir>] [--yes]",
      "  polterbase app install uru [--version <version>] [--artifact-url <url>] [--install-dir <dir>] [--yes]",
      "",
      "Notes:",
      "  - App workflows stay separate from the generic Supabase interactive menu.",
      "  - `install uru` is macOS-only and resolves the latest GitHub release from polterware/uru by default.",
      "  - Use --artifact-url or POLTERBASE_URU_MACOS_ARTIFACT_URL to override the downloaded asset.",
      "  - Use POLTERBASE_URU_GITHUB_REPO=owner/repo to resolve releases from a different repository.",
      "",
    ].join("\n"),
  );
}
