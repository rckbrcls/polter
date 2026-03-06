import pc from "picocolors";
import { getAppProfile } from "./registry.js";
import type { ParsedCliOptions } from "./types.js";

function assertAppCommand(options: ParsedCliOptions): asserts options is ParsedCliOptions & {
  action: NonNullable<ParsedCliOptions["action"]>;
  app: string;
} {
  if (!options.action || !options.app) {
    throw new Error("Usage: polterbase app <setup|link|migrate|configure|install|update> <app>");
  }
}

export async function runAppCli(options: ParsedCliOptions): Promise<number> {
  assertAppCommand(options);

  const profile = getAppProfile(options.app);
  if (!profile) {
    throw new Error(`Unknown app profile: ${options.app}`);
  }

  const projectRoot = profile.resolveProjectRoot(process.cwd(), options.path);

  process.stdout.write(
    `${pc.bold("Polterbase")} ${pc.dim("app workflow")} ${pc.bold(profile.displayName)} ${pc.dim(`(${options.action})`)}\n\n`,
  );

  return profile.run(options.action, {
    cwd: process.cwd(),
    projectRoot,
    options,
  });
}
