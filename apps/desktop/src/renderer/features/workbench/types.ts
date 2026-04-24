export type CliToolId = "supabase" | "gh" | "vercel" | "git" | "pkg";

export interface SuggestedArg {
  value: string;
  label: string;
  hint?: string;
  args: string[];
}

export interface CommandFlag {
  value: string;
  label: string;
  hint?: string;
}

export interface CommandDef {
  id: string;
  tool: CliToolId;
  base: string[];
  label: string;
  hint?: string;
  suggestedArgs?: SuggestedArg[];
  editorTarget?: "config" | "code";
  interactive?: boolean;
  isReadOnly?: boolean;
  isDestructive?: boolean;
  timeoutMs?: number;
  retryable?: boolean;
}

export interface Feature {
  id: string;
  icon: string;
  label: string;
  commands: CommandDef[];
}

export interface PipelineStep {
  id: string;
  commandId: string;
  args: string[];
  flags: string[];
  continueOnError: boolean;
  label?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  steps: PipelineStep[];
  createdAt: string;
  updatedAt: string;
}

export type PipelineSource = "project" | "global";

export interface PipelineWithSource extends Pipeline {
  source: PipelineSource;
}

export interface ProjectConfig {
  version: 1;
  tools: {
    supabase?: { projectRef?: string };
    vercel?: { projectId?: string; orgId?: string };
    gh?: { repo?: string };
    git?: Record<string, never>;
    pkg?: { manager?: "npm" | "pnpm" | "yarn" | "bun" };
  };
  env?: Record<string, string>;
  childRepos?: string[];
  pipelines: Pipeline[];
}

export interface DesktopAppInfo {
  name: string;
  version: string;
  cwd: string;
}

export interface DesktopPins {
  commandPins: string[];
  runPins: string[];
}

export interface DesktopCommandForm {
  command: CommandDef;
  commandValue: string;
  flags: CommandFlag[];
  suggestedArgs: SuggestedArg[];
  pins: DesktopPins;
}

export interface DesktopCommandRunInput {
  commandId: string;
  cwd?: string;
  args?: string[];
  flags?: string[];
}

export interface DesktopCommandRunResult {
  commandId: string;
  commandValue: string;
  executed: string;
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  spawnError?: string;
}

export interface DesktopRepository {
  id: string;
  name: string;
  path: string;
  lastOpenedAt: string;
  exists: boolean;
}

export interface PackageManagerInfo {
  id: "npm" | "pnpm" | "yarn" | "bun";
  lockFile: string;
  command: string;
}

export interface WorkspaceScript {
  name: string;
  command: string;
}

export interface ChildRepoSnapshot {
  name: string;
  path: string;
  scripts: WorkspaceScript[];
  pkgManager: PackageManagerInfo;
}

export interface DesktopWorkspaceSnapshot {
  cwd: string;
  root: string;
  packageManager: PackageManagerInfo;
  rootScripts: WorkspaceScript[];
  childRepos: ChildRepoSnapshot[];
  projectConfig: ProjectConfig;
}

export interface DesktopToolStatusSnapshot {
  cwd: string;
  tools: Array<{
    id: CliToolId;
    label: string;
    installed: boolean;
    version?: string;
    linked: boolean;
    project?: string;
  }>;
  project: StatusResult;
}

export interface StatusResult {
  github: { authenticated: boolean; repo?: string };
  vercel: { linked: boolean; projectId?: string; orgId?: string };
  supabase: { linked: boolean; projectRef?: string };
}

export interface DesktopDeclarativePlan {
  cwd: string;
  yamlFound: boolean;
  parsedYaml: Record<string, unknown> | null;
  plan: {
    noChanges: boolean;
    actions: Array<{
      tool: CliToolId;
      action: string;
      resource: string;
      description: string;
      args?: string[];
    }>;
  } | null;
  error?: string;
}

export interface DesktopDeclarativeApplyResult {
  cwd: string;
  plan: DesktopDeclarativePlan;
  results: Array<{
    action: NonNullable<DesktopDeclarativePlan["plan"]>["actions"][number];
    success: boolean;
    result: {
      exitCode: number | null;
      signal: string | null;
      stdout: string;
      stderr: string;
    };
  }>;
}

export type McpScope = "local" | "project" | "user";

export interface McpStatusInfo {
  installedVersion: string;
  latestVersion: string | null;
  scopes: Array<{
    label: string;
    scope: McpScope;
    registered: boolean;
    error?: string;
  }>;
}

export interface McpActionResult {
  success: boolean;
  message: string;
}

export interface DesktopSkillPreview {
  path: string;
  content: string;
}

export interface SkillSetupResult {
  status: "created" | "updated" | "already-up-to-date";
  path: string;
}

export interface ProcessInfo {
  id: string;
  command: string;
  args: string[];
  cwd: string;
  pid: number | undefined;
  status: "running" | "exited" | "errored";
  exitCode: number | null;
  signal: string | null;
  startedAt: string;
  exitedAt: string | null;
  uptime: number;
}

export interface ProcessOutput {
  stdout: string[];
  stderr: string[];
  stdoutLineCount: number;
  stderrLineCount: number;
}

export interface WorkbenchSnapshot {
  appInfo: DesktopAppInfo;
  repositories: DesktopRepository[];
  features: Feature[];
  allCommands: CommandDef[];
  pins: DesktopPins;
  pipelines: PipelineWithSource[];
  workspace: DesktopWorkspaceSnapshot;
  toolStatus: DesktopToolStatusSnapshot;
  projectConfig: ProjectConfig;
  declarativeStatus: StatusResult;
  declarativePlan: DesktopDeclarativePlan;
  mcpStatus: McpStatusInfo;
  skillPreview: DesktopSkillPreview;
  processes: ProcessInfo[];
}

export interface WorkbenchAdapter {
  getSnapshot(cwd?: string): Promise<WorkbenchSnapshot>;
  getCommandForm(commandId: string): Promise<DesktopCommandForm>;
  runCommand(input: DesktopCommandRunInput): Promise<DesktopCommandRunResult>;
  toggleCommandPin(commandValue: string): Promise<DesktopPins>;
  toggleRunPin(runCommand: string): Promise<DesktopPins>;
  savePipeline(
    pipeline: Pipeline,
    source: PipelineSource,
    cwd?: string,
  ): Promise<Pipeline>;
  removePipeline(pipelineId: string, source: PipelineSource, cwd?: string): Promise<void>;
  runPipeline(name: string, cwd?: string): Promise<unknown>;
  saveProjectConfig(config: ProjectConfig, cwd?: string): Promise<boolean>;
  refreshInfrastructure(cwd?: string): Promise<{
    status: StatusResult;
    plan: DesktopDeclarativePlan;
  }>;
  applyInfrastructure(cwd?: string): Promise<DesktopDeclarativeApplyResult>;
  runWorkspaceScript(
    repoPath: string,
    script: string,
    args?: string[],
    id?: string,
  ): Promise<ProcessInfo>;
  listProcesses(cwd?: string): Promise<ProcessInfo[]>;
  startProcess(command: string, args?: string[], cwd?: string, id?: string): Promise<ProcessInfo>;
  stopProcess(id: string): Promise<ProcessInfo>;
  removeProcess(id: string): Promise<void>;
  getProcessLogs(id: string, tail?: number): Promise<ProcessOutput>;
  installMcp(scope: McpScope): Promise<McpActionResult>;
  removeMcp(scope: McpScope): Promise<McpActionResult>;
  setupSkill(): Promise<SkillSetupResult>;
  addRepository(path: string): Promise<DesktopRepository>;
  removeRepository(id: string): Promise<void>;
  pickDirectory(): Promise<string | null>;
}
