import type {
  CommandDef,
  DesktopCommandRunInput,
  DesktopCommandRunResult,
  DesktopDeclarativeApplyResult,
  DesktopDeclarativePlan,
  DesktopPins,
  DesktopRepository,
  DesktopToolStatusSnapshot,
  DesktopWorkspaceSnapshot,
  Feature,
  McpScope,
  McpStatusInfo,
  Pipeline,
  PipelineSource,
  PipelineWithSource,
  ProcessInfo,
  ProcessOutput,
  ProjectConfig,
  StatusResult,
  WorkbenchAdapter,
  WorkbenchSnapshot,
} from "./types.js";

const MOCK_CWD = "/mock/polter";
const MOCK_NOW = "2026-04-24T00:00:00.000Z";
const MOCK_PACKAGE_MANAGER = {
  id: "pnpm",
  lockFile: "pnpm-lock.yaml",
  command: "pnpm",
} as const;

const mockCommands: CommandDef[] = [
  {
    id: "git:status",
    tool: "git",
    base: ["status"],
    label: "Status",
    hint: "Inspect the current repository state.",
    isReadOnly: true,
  },
  {
    id: "git:branch",
    tool: "git",
    base: ["branch"],
    label: "Branches",
    hint: "List local branches in the active workspace.",
    isReadOnly: true,
  },
  {
    id: "pkg:typecheck",
    tool: "pkg",
    base: ["typecheck"],
    label: "Typecheck",
    hint: "Preview the workspace typecheck command.",
    suggestedArgs: [
      { value: "desktop", label: "Desktop", args: ["--filter", "@polterware/desktop"] },
    ],
  },
  {
    id: "pkg:test",
    tool: "pkg",
    base: ["test"],
    label: "Test",
    hint: "Preview a targeted test run.",
    suggestedArgs: [
      { value: "watch", label: "Watch mode", args: ["--watch"] },
      { value: "ui", label: "UI package", args: ["apps/desktop/src/renderer"] },
    ],
  },
  {
    id: "gh:pr-list",
    tool: "gh",
    base: ["pr", "list"],
    label: "Pull Requests",
    hint: "Preview pull request metadata for the linked repository.",
    isReadOnly: true,
  },
  {
    id: "vercel:deploy",
    tool: "vercel",
    base: ["deploy"],
    label: "Deploy Preview",
    hint: "Preview a deploy command without contacting Vercel.",
  },
  {
    id: "supabase:db-status",
    tool: "supabase",
    base: ["db", "status"],
    label: "Database Status",
    hint: "Preview Supabase linkage without calling the CLI.",
    isReadOnly: true,
  },
];

const mockFeatures: Feature[] = [
  {
    id: "repo",
    icon: "git",
    label: "Repository",
    commands: mockCommands.filter((command) => command.tool === "git"),
  },
  {
    id: "package",
    icon: "pkg",
    label: "Package",
    commands: mockCommands.filter((command) => command.tool === "pkg"),
  },
  {
    id: "release",
    icon: "gh",
    label: "Release",
    commands: mockCommands.filter((command) => command.tool === "gh" || command.tool === "vercel"),
  },
  {
    id: "data",
    icon: "supabase",
    label: "Data",
    commands: mockCommands.filter((command) => command.tool === "supabase"),
  },
];

function clone<T>(value: T): T {
  return structuredClone(value);
}

function toId(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "item"
  );
}

function commandValue(command: CommandDef): string {
  if (command.tool === "supabase") {
    return command.base.join(" ");
  }

  return `${command.tool}:${command.base.join(" ")}`;
}

function getCommand(commandId: string): CommandDef {
  const command = mockCommands.find((item) => item.id === commandId);
  if (!command) {
    throw new Error(`Mock command not found: ${commandId}`);
  }

  return command;
}

function createProjectConfig(): ProjectConfig {
  return {
    version: 1,
    tools: {
      git: {},
      pkg: { manager: "pnpm" },
      gh: { repo: "polterware/polter" },
      vercel: { projectId: "polter-desktop-preview", orgId: "polterware" },
      supabase: { projectRef: "mock-preview-ref" },
    },
    env: {
      NODE_ENV: "development",
      POLTER_MODE: "ui-only",
    },
    childRepos: ["apps/desktop", "packages/core"],
    pipelines: [],
  };
}

function createWorkspace(cwd: string, projectConfig: ProjectConfig): DesktopWorkspaceSnapshot {
  return {
    cwd,
    root: cwd,
    packageManager: MOCK_PACKAGE_MANAGER,
    rootScripts: [
      { name: "typecheck", command: "tsc --noEmit" },
      { name: "test", command: "vitest run" },
      { name: "lint", command: "eslint ." },
    ],
    childRepos: [
      {
        name: "desktop",
        path: `${cwd}/apps/desktop`,
        pkgManager: MOCK_PACKAGE_MANAGER,
        scripts: [
          { name: "typecheck", command: "tsc --noEmit --pretty false" },
          { name: "test", command: "vitest run src/renderer" },
        ],
      },
      {
        name: "core",
        path: `${cwd}/packages/core`,
        pkgManager: MOCK_PACKAGE_MANAGER,
        scripts: [
          { name: "test", command: "vitest run" },
          { name: "check", command: "tsc --noEmit" },
        ],
      },
    ],
    projectConfig,
  };
}

function createStatus(projectConfig: ProjectConfig): StatusResult {
  return {
    github: {
      authenticated: true,
      repo: projectConfig.tools.gh?.repo,
    },
    vercel: {
      linked: Boolean(projectConfig.tools.vercel?.projectId),
      projectId: projectConfig.tools.vercel?.projectId,
      orgId: projectConfig.tools.vercel?.orgId,
    },
    supabase: {
      linked: Boolean(projectConfig.tools.supabase?.projectRef),
      projectRef: projectConfig.tools.supabase?.projectRef,
    },
  };
}

function createToolStatus(cwd: string, projectConfig: ProjectConfig): DesktopToolStatusSnapshot {
  return {
    cwd,
    tools: [
      {
        id: "git",
        label: "Git",
        installed: true,
        version: "mock 2.46.0",
        linked: true,
        project: "main",
      },
      {
        id: "pkg",
        label: "Package Manager",
        installed: true,
        version: "pnpm mock",
        linked: true,
        project: "pnpm workspace",
      },
      {
        id: "gh",
        label: "GitHub CLI",
        installed: true,
        version: "mock 2.70.0",
        linked: true,
        project: projectConfig.tools.gh?.repo,
      },
      {
        id: "vercel",
        label: "Vercel CLI",
        installed: true,
        version: "mock",
        linked: Boolean(projectConfig.tools.vercel?.projectId),
        project: projectConfig.tools.vercel?.projectId,
      },
      {
        id: "supabase",
        label: "Supabase CLI",
        installed: true,
        version: "mock",
        linked: Boolean(projectConfig.tools.supabase?.projectRef),
        project: projectConfig.tools.supabase?.projectRef,
      },
    ],
    project: createStatus(projectConfig),
  };
}

function createDeclarativePlan(cwd: string): DesktopDeclarativePlan {
  return {
    cwd,
    yamlFound: true,
    parsedYaml: {
      version: 1,
      project: { name: "Polter UI Preview" },
      desktop: { mode: "ui-only" },
    },
    plan: {
      noChanges: false,
      actions: [
        {
          tool: "pkg",
          action: "preview",
          resource: "scripts",
          description: "Mock action: inspect workspace scripts without running them.",
          args: ["test", "typecheck"],
        },
        {
          tool: "gh",
          action: "preview",
          resource: "repository",
          description: "Mock action: display linked repository metadata.",
        },
      ],
    },
  };
}

function createMcpStatus(): McpStatusInfo {
  return {
    installedVersion: "0.1.0-ui-preview",
    latestVersion: null,
    scopes: [
      { label: "Local project", scope: "local", registered: true },
      { label: "Project (.mcp.json)", scope: "project", registered: true },
      { label: "User (~/.claude/settings.json)", scope: "user", registered: false },
    ],
  };
}

function createProcessLogs(processInfo: ProcessInfo): ProcessOutput {
  const commandLine = [processInfo.command, ...processInfo.args].join(" ");
  const stdout = [
    `$ ${commandLine}`,
    "Polter UI preview simulated this background activity.",
    "No process was started on your machine.",
  ];
  const stderr =
    processInfo.status === "errored" ? ["Mock stderr: simulated failure state."] : [];

  return {
    stdout,
    stderr,
    stdoutLineCount: stdout.length,
    stderrLineCount: stderr.length,
  };
}

export function createMockWorkbenchAdapter(): WorkbenchAdapter {
  let cwd = MOCK_CWD;
  let projectConfig = createProjectConfig();
  let pins: DesktopPins = {
    commandPins: ["git:status"],
    runPins: ["pkg:typecheck --filter @polterware/desktop"],
  };
  let pipelines: PipelineWithSource[] = [
    {
      id: "desktop-ui-review",
      name: "Desktop UI review",
      description: "Mock pipeline for reviewing the desktop interface surfaces.",
      source: "project",
      createdAt: MOCK_NOW,
      updatedAt: MOCK_NOW,
      steps: [
        {
          id: "inspect-repo",
          commandId: "git:status",
          args: [],
          flags: [],
          continueOnError: false,
          label: "Inspect repository",
        },
        {
          id: "preview-tests",
          commandId: "pkg:test",
          args: ["apps/desktop/src/renderer"],
          flags: [],
          continueOnError: false,
          label: "Preview UI tests",
        },
      ],
    },
  ];
  let repositories: DesktopRepository[] = [
    {
      id: "polter",
      name: "polter",
      path: MOCK_CWD,
      lastOpenedAt: MOCK_NOW,
      exists: true,
    },
    {
      id: "polterware-web",
      name: "polterware-web",
      path: "/mock/polterware-web",
      lastOpenedAt: "2026-04-23T22:00:00.000Z",
      exists: true,
    },
    {
      id: "dost-ops",
      name: "dost-ops",
      path: "/mock/dost-ops",
      lastOpenedAt: "2026-04-23T21:00:00.000Z",
      exists: true,
    },
  ];
  let processes: ProcessInfo[] = [
    {
      id: "ui-preview-session",
      command: "pnpm",
      args: ["run", "dev"],
      cwd,
      pid: undefined,
      status: "running",
      exitCode: null,
      signal: null,
      startedAt: MOCK_NOW,
      exitedAt: null,
      uptime: 42_000,
    },
    {
      id: "mock-typecheck",
      command: "pnpm",
      args: ["exec", "tsc", "--noEmit"],
      cwd: `${cwd}/apps/desktop`,
      pid: undefined,
      status: "exited",
      exitCode: 0,
      signal: null,
      startedAt: "2026-04-24T00:02:00.000Z",
      exitedAt: "2026-04-24T00:02:06.000Z",
      uptime: 6_000,
    },
  ];
  const processLogs = new Map(processes.map((processInfo) => [processInfo.id, createProcessLogs(processInfo)]));

  function syncProjectPipelines(): void {
    projectConfig = {
      ...projectConfig,
      pipelines: pipelines
        .filter((pipeline) => pipeline.source === "project")
        .map(({ source: _source, ...pipeline }) => pipeline),
    };
  }

  function addOrUpdateRepository(path: string): DesktopRepository {
    const normalizedPath = path.replace(/\/+$/, "") || MOCK_CWD;
    const name = normalizedPath.split("/").filter(Boolean).at(-1) ?? normalizedPath;
    const repository: DesktopRepository = {
      id: toId(name),
      name,
      path: normalizedPath,
      lastOpenedAt: new Date().toISOString(),
      exists: true,
    };
    const index = repositories.findIndex((item) => item.path === normalizedPath);
    if (index >= 0) {
      repositories[index] = repository;
    } else {
      repositories = [repository, ...repositories];
    }
    return repository;
  }

  function createSnapshot(nextCwd?: string): WorkbenchSnapshot {
    if (nextCwd) {
      cwd = nextCwd;
      addOrUpdateRepository(nextCwd);
    }

    const workspace = createWorkspace(cwd, projectConfig);
    const toolStatus = createToolStatus(cwd, projectConfig);
    return {
      appInfo: { name: "Polter Desktop", version: "0.1.0-ui-preview", cwd },
      repositories: clone(repositories),
      features: clone(mockFeatures),
      allCommands: clone(mockCommands),
      pins: clone(pins),
      pipelines: clone(pipelines),
      workspace: clone(workspace),
      toolStatus: clone(toolStatus),
      projectConfig: clone(projectConfig),
      declarativeStatus: clone(createStatus(projectConfig)),
      declarativePlan: clone(createDeclarativePlan(cwd)),
      mcpStatus: clone(createMcpStatus()),
      skillPreview: {
        path: `${cwd}/.claude/skills/polter/SKILL.md`,
        content: "# Polter\n\nThis is a mocked desktop skill preview for the UI-only build.",
      },
      processes: clone(processes),
    };
  }

  function saveProcess(processInfo: ProcessInfo): ProcessInfo {
    processes = [processInfo, ...processes.filter((item) => item.id !== processInfo.id)];
    processLogs.set(processInfo.id, createProcessLogs(processInfo));
    return clone(processInfo);
  }

  return {
    async getSnapshot(nextCwd) {
      return createSnapshot(nextCwd);
    },
    async getCommandForm(commandId) {
      const command = getCommand(commandId);
      return {
        command: clone(command),
        commandValue: commandValue(command),
        flags:
          command.tool === "pkg"
            ? [{ value: "--watch", label: "--watch", hint: "Keep the preview command active." }]
            : [{ value: "--dry-run", label: "--dry-run", hint: "Preview the action." }],
        suggestedArgs: clone(command.suggestedArgs ?? []),
        pins: clone(pins),
      };
    },
    async runCommand(input: DesktopCommandRunInput): Promise<DesktopCommandRunResult> {
      const command = getCommand(input.commandId);
      const args = input.args ?? [];
      const flags = input.flags ?? [];
      const executed = [commandValue(command), ...args, ...flags].filter(Boolean).join(" ");
      return {
        commandId: command.id,
        commandValue: commandValue(command),
        executed,
        success: true,
        exitCode: 0,
        stdout: `Mock run completed.\nNo external command was executed.\n\n${executed}`,
        stderr: "",
      };
    },
    async toggleCommandPin(commandValueToToggle) {
      pins = {
        ...pins,
        commandPins: pins.commandPins.includes(commandValueToToggle)
          ? pins.commandPins.filter((pin) => pin !== commandValueToToggle)
          : [...pins.commandPins, commandValueToToggle],
      };
      return clone(pins);
    },
    async toggleRunPin(runCommand) {
      pins = {
        ...pins,
        runPins: pins.runPins.includes(runCommand)
          ? pins.runPins.filter((pin) => pin !== runCommand)
          : [...pins.runPins, runCommand],
      };
      return clone(pins);
    },
    async savePipeline(pipeline: Pipeline, source: PipelineSource) {
      const timestamp = new Date().toISOString();
      const saved: Pipeline = {
        ...pipeline,
        id: pipeline.id || toId(pipeline.name),
        createdAt: pipeline.createdAt || timestamp,
        updatedAt: timestamp,
      };
      pipelines = [
        { ...saved, source },
        ...pipelines.filter((item) => item.id !== saved.id || item.source !== source),
      ];
      syncProjectPipelines();
      return clone(saved);
    },
    async removePipeline(pipelineId, source) {
      pipelines = pipelines.filter((pipeline) => pipeline.id !== pipelineId || pipeline.source !== source);
      syncProjectPipelines();
    },
    async runPipeline(name) {
      const pipeline = pipelines.find((item) => item.name === name);
      return {
        success: Boolean(pipeline),
        pipeline: pipeline ? clone(pipeline) : null,
        steps:
          pipeline?.steps.map((step) => ({
            id: step.id,
            label: step.label ?? step.commandId,
            status: "success",
            output: "Mock step completed without executing a command.",
          })) ?? [],
      };
    },
    async saveProjectConfig(config) {
      projectConfig = clone(config);
      syncProjectPipelines();
      return true;
    },
    async refreshInfrastructure(nextCwd = cwd) {
      cwd = nextCwd;
      return {
        status: clone(createStatus(projectConfig)),
        plan: clone(createDeclarativePlan(cwd)),
      };
    },
    async applyInfrastructure(nextCwd = cwd): Promise<DesktopDeclarativeApplyResult> {
      cwd = nextCwd;
      const plan = createDeclarativePlan(cwd);
      return {
        cwd,
        plan: clone(plan),
        results:
          plan.plan?.actions.map((action) => ({
            action,
            success: true,
            result: {
              exitCode: 0,
              signal: null,
              stdout: "Mock apply completed. No infrastructure was changed.",
              stderr: "",
            },
          })) ?? [],
      };
    },
    async runWorkspaceScript(repoPath, script, args = [], id) {
      return saveProcess({
        id: id ?? toId(`${script}-${Date.now()}`),
        command: MOCK_PACKAGE_MANAGER.command,
        args: ["run", script, ...args],
        cwd: repoPath,
        pid: undefined,
        status: "running",
        exitCode: null,
        signal: null,
        startedAt: new Date().toISOString(),
        exitedAt: null,
        uptime: 0,
      });
    },
    async listProcesses() {
      return clone(processes);
    },
    async startProcess(command, args = [], processCwd = cwd, id) {
      return saveProcess({
        id: id ?? toId(`${command}-${args.join("-")}-${Date.now()}`),
        command,
        args,
        cwd: processCwd,
        pid: undefined,
        status: "running",
        exitCode: null,
        signal: null,
        startedAt: new Date().toISOString(),
        exitedAt: null,
        uptime: 0,
      });
    },
    async stopProcess(id) {
      const processInfo = processes.find((item) => item.id === id);
      if (!processInfo) {
        throw new Error(`Mock process not found: ${id}`);
      }
      const stopped = {
        ...processInfo,
        status: "exited" as const,
        exitCode: 0,
        exitedAt: new Date().toISOString(),
      };
      processes = processes.map((item) => (item.id === id ? stopped : item));
      processLogs.set(id, createProcessLogs(stopped));
      return clone(stopped);
    },
    async removeProcess(id) {
      processes = processes.filter((processInfo) => processInfo.id !== id);
      processLogs.delete(id);
    },
    async getProcessLogs(id, tail) {
      const logs = processLogs.get(id) ?? {
        stdout: ["No mock output captured for this activity."],
        stderr: [],
        stdoutLineCount: 1,
        stderrLineCount: 0,
      };
      if (!tail) {
        return clone(logs);
      }
      return {
        stdout: logs.stdout.slice(-tail),
        stderr: logs.stderr.slice(-tail),
        stdoutLineCount: logs.stdoutLineCount,
        stderrLineCount: logs.stderrLineCount,
      };
    },
    async installMcp(scope: McpScope) {
      return {
        success: true,
        message: `Mock MCP registration updated for ${scope}.`,
      };
    },
    async removeMcp(scope: McpScope) {
      return {
        success: true,
        message: `Mock MCP registration removed for ${scope}.`,
      };
    },
    async setupSkill() {
      return {
        status: "already-up-to-date",
        path: `${cwd}/.claude/skills/polter/SKILL.md`,
      };
    },
    async addRepository(path) {
      return clone(addOrUpdateRepository(path));
    },
    async removeRepository(id) {
      repositories = repositories.filter((repository) => repository.id !== id);
    },
    async pickDirectory() {
      return "/mock/new-project";
    },
  };
}

export const mockWorkbenchAdapter = createMockWorkbenchAdapter();
