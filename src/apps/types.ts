export type AppAction =
  | "setup"
  | "link"
  | "migrate"
  | "configure"
  | "install";

export type MigrationAction = "push" | "lint" | "reset" | "local-reset";

export interface ParsedCliOptions {
  action?: AppAction;
  app?: string;
  path?: string;
  version?: string;
  artifactUrl?: string;
  installDir?: string;
  yes?: boolean;
  relink?: boolean;
  createProject?: boolean;
  useExistingProject?: boolean;
  migrationAction?: MigrationAction;
}

export interface AppExecutionContext {
  cwd: string;
  projectRoot?: string;
  options: ParsedCliOptions;
}

export interface AppProfile {
  id: string;
  displayName: string;
  detect(startDir?: string): string | undefined;
  resolveProjectRoot(startDir?: string, explicitPath?: string): string | undefined;
  run(action: AppAction, context: AppExecutionContext): Promise<number>;
}
