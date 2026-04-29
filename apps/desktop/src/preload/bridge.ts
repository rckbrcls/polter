import type {
  CommandDef,
  DesktopAppInfo,
  DesktopCommandForm,
  DesktopCommandRunInput,
  DesktopCommandRunResult,
  DesktopDeclarativeApplyResult,
  DesktopDeclarativePlan,
  DesktopPins,
  DesktopRepository,
  DesktopSkillPreview,
  DesktopToolStatusSnapshot,
  DesktopWorkspaceSnapshot,
  Feature,
  McpActionResult,
  McpScope,
  McpStatusInfo,
  Pipeline,
  PipelineSource,
  PipelineWithSource,
  ProcessInfo,
  ProcessOutput,
  ProjectConfig,
  SkillSetupResult,
  StatusResult,
} from "@polterware/core";
import { IPC_CHANNELS, IPC_EVENTS } from "../shared/ipc.js";

export interface IpcInvokeLike {
  invoke(channel: string, payload?: unknown): Promise<unknown>;
}

export interface IpcEventLike extends IpcInvokeLike {
  on?(channel: string, listener: (...args: unknown[]) => void): unknown;
  removeListener?(channel: string, listener: (...args: unknown[]) => void): unknown;
}

function createInvoker(ipc: IpcInvokeLike) {
  return function invoke<T>(channel: string, payload?: unknown) {
    return ipc.invoke(channel, payload) as Promise<T>;
  };
}

function createEventSubscriber(ipc: IpcEventLike) {
  return function subscribe(channel: string, callback: () => void): () => void {
    if (!ipc.on || !ipc.removeListener) {
      return () => {};
    }

    const listener = () => callback();
    ipc.on(channel, listener);

    return () => {
      ipc.removeListener?.(channel, listener);
    };
  };
}

export interface PolterBridge {
  app: {
    getInfo(cwd?: string): Promise<DesktopAppInfo>;
  };
  commands: {
    listFeatures(): Promise<Feature[]>;
    listAll(featureId?: string): Promise<CommandDef[]>;
    getForm(commandId: string): Promise<DesktopCommandForm>;
    getPins(): Promise<DesktopPins>;
    toggleCommandPin(commandValue: string): Promise<DesktopPins>;
    toggleRunPin(runCommand: string): Promise<DesktopPins>;
    run(input: DesktopCommandRunInput): Promise<DesktopCommandRunResult>;
  };
  repositories: {
    list(): Promise<DesktopRepository[]>;
    add(path: string): Promise<DesktopRepository>;
    remove(id: string): Promise<void>;
    pickDirectory(): Promise<string | null>;
  };
  pipelines: {
    list(cwd?: string): Promise<PipelineWithSource[]>;
    save(pipeline: Pipeline, source: PipelineSource, cwd?: string): Promise<Pipeline>;
    remove(pipelineId: string, source: PipelineSource, cwd?: string): Promise<void>;
    run(name: string, cwd?: string): Promise<unknown>;
  };
  processes: {
    list(cwd?: string): Promise<ProcessInfo[]>;
    start(command: string, args?: string[], cwd?: string, id?: string): Promise<ProcessInfo>;
    stop(id: string): Promise<ProcessInfo>;
    logs(id: string, tail?: number): Promise<ProcessOutput>;
    remove(id: string): Promise<void>;
  };
  status: {
    getTools(cwd?: string): Promise<DesktopToolStatusSnapshot>;
  };
  config: {
    read(cwd?: string): Promise<ProjectConfig | undefined>;
    write(config: ProjectConfig, cwd?: string): Promise<boolean>;
  };
  declarative: {
    status(cwd?: string): Promise<StatusResult>;
    plan(cwd?: string): Promise<DesktopDeclarativePlan>;
    apply(cwd?: string): Promise<DesktopDeclarativeApplyResult>;
  };
  workspace: {
    snapshot(cwd?: string): Promise<DesktopWorkspaceSnapshot>;
    runScript(repoPath: string, script: string, args?: string[], id?: string): Promise<ProcessInfo>;
  };
  mcp: {
    status(): Promise<McpStatusInfo>;
    install(scope: McpScope): Promise<McpActionResult>;
    remove(scope: McpScope): Promise<McpActionResult>;
  };
  skills: {
    preview(): Promise<DesktopSkillPreview>;
    setup(): Promise<SkillSetupResult>;
  };
  commander: {
    hideOverlay(): Promise<void>;
    showMainWindow(): Promise<void>;
    onFocusSearch(callback: () => void): () => void;
  };
}

export function createPolterBridge(ipc: IpcEventLike): PolterBridge {
  const invoke = createInvoker(ipc);
  const subscribe = createEventSubscriber(ipc);

  return {
    app: {
      getInfo: (cwd) => invoke(IPC_CHANNELS.app.getInfo, { cwd }),
    },
    commands: {
      listFeatures: () => invoke(IPC_CHANNELS.commands.listFeatures),
      listAll: (featureId) => invoke(IPC_CHANNELS.commands.listAll, { featureId }),
      getForm: (commandId) => invoke(IPC_CHANNELS.commands.getForm, { commandId }),
      getPins: () => invoke(IPC_CHANNELS.commands.getPins),
      toggleCommandPin: (commandValue) =>
        invoke(IPC_CHANNELS.commands.toggleCommandPin, { commandValue }),
      toggleRunPin: (runCommand) => invoke(IPC_CHANNELS.commands.toggleRunPin, { runCommand }),
      run: (input) => invoke(IPC_CHANNELS.commands.run, input),
    },
    repositories: {
      list: () => invoke(IPC_CHANNELS.repositories.list),
      add: (path) => invoke(IPC_CHANNELS.repositories.add, { path }),
      remove: (id) => invoke(IPC_CHANNELS.repositories.remove, { id }),
      pickDirectory: () => invoke(IPC_CHANNELS.repositories.pickDirectory),
    },
    pipelines: {
      list: (cwd) => invoke(IPC_CHANNELS.pipelines.list, { cwd }),
      save: (pipeline, source, cwd) =>
        invoke(IPC_CHANNELS.pipelines.save, { pipeline, source, cwd }),
      remove: (pipelineId, source, cwd) =>
        invoke(IPC_CHANNELS.pipelines.delete, { pipelineId, source, cwd }),
      run: (name, cwd) => invoke(IPC_CHANNELS.pipelines.run, { name, cwd }),
    },
    processes: {
      list: (cwd) => invoke(IPC_CHANNELS.processes.list, { cwd }),
      start: (command, args, cwd, id) =>
        invoke(IPC_CHANNELS.processes.start, { command, args, cwd, id }),
      stop: (id) => invoke(IPC_CHANNELS.processes.stop, { id }),
      logs: (id, tail) => invoke(IPC_CHANNELS.processes.logs, { id, tail }),
      remove: (id) => invoke(IPC_CHANNELS.processes.remove, { id }),
    },
    status: {
      getTools: (cwd) => invoke(IPC_CHANNELS.status.tools, { cwd }),
    },
    config: {
      read: (cwd) => invoke(IPC_CHANNELS.config.read, { cwd }),
      write: (config, cwd) => invoke(IPC_CHANNELS.config.write, { config, cwd }),
    },
    declarative: {
      status: (cwd) => invoke(IPC_CHANNELS.declarative.status, { cwd }),
      plan: (cwd) => invoke(IPC_CHANNELS.declarative.plan, { cwd }),
      apply: (cwd) => invoke(IPC_CHANNELS.declarative.apply, { cwd }),
    },
    workspace: {
      snapshot: (cwd) => invoke(IPC_CHANNELS.workspace.snapshot, { cwd }),
      runScript: (repoPath, script, args, id) =>
        invoke(IPC_CHANNELS.workspace.runScript, { repoPath, script, args, id }),
    },
    mcp: {
      status: () => invoke(IPC_CHANNELS.mcp.status),
      install: (scope) => invoke(IPC_CHANNELS.mcp.install, { scope }),
      remove: (scope) => invoke(IPC_CHANNELS.mcp.remove, { scope }),
    },
    skills: {
      preview: () => invoke(IPC_CHANNELS.skills.preview),
      setup: () => invoke(IPC_CHANNELS.skills.setup),
    },
    commander: {
      hideOverlay: () => invoke(IPC_CHANNELS.commander.hideOverlay),
      showMainWindow: () => invoke(IPC_CHANNELS.commander.showMainWindow),
      onFocusSearch: (callback) => subscribe(IPC_EVENTS.commander.focusSearch, callback),
    },
  };
}
