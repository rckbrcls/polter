import { ipcMain, type IpcMain, type IpcMainInvokeEvent } from "electron";
import {
  applyDesktopDeclarativePlan,
  getDesktopAppInfo,
  getDesktopCommandForm,
  getDesktopDeclarativePlan,
  getDesktopDeclarativeStatus,
  getDesktopMcpStatus,
  getDesktopPins,
  getDesktopProjectConfig,
  getDesktopSkillPreview,
  getDesktopToolStatus,
  getDesktopWorkspaceSnapshot,
  installDesktopMcp,
  listDesktopCommands,
  listDesktopFeatures,
  listDesktopPipelines,
  removeDesktopMcp,
  runDesktopCommand,
  runDesktopPipeline,
  runDesktopWorkspaceScript,
  saveDesktopPipeline,
  saveDesktopProjectConfig,
  setupDesktopSkill,
  toggleDesktopCommandPin,
  toggleDesktopRunPin,
  deleteDesktopPipeline,
  findProcessesByCwd,
  generateProcessId,
  getProcessOutput,
  removeProcess,
  startProcess,
  stopProcess,
  type McpScope,
  type Pipeline,
  type PipelineSource,
  type ProjectConfig,
} from "@polterware/core";
import { IPC_CHANNELS } from "../shared/ipc.js";

type Handler = (event: IpcMainInvokeEvent, payload?: any) => unknown | Promise<unknown>;

export function createPolterIpcHandlers(): Record<string, Handler> {
  return {
    [IPC_CHANNELS.app.getInfo]: (_event, payload?: { cwd?: string }) =>
      getDesktopAppInfo(payload?.cwd),

    [IPC_CHANNELS.commands.listFeatures]: () => listDesktopFeatures(),
    [IPC_CHANNELS.commands.listAll]: (_event, payload?: { featureId?: string }) =>
      listDesktopCommands(payload?.featureId),
    [IPC_CHANNELS.commands.getForm]: (_event, payload: { commandId: string }) =>
      getDesktopCommandForm(payload.commandId),
    [IPC_CHANNELS.commands.getPins]: () => getDesktopPins(),
    [IPC_CHANNELS.commands.toggleCommandPin]: (_event, payload: { commandValue: string }) =>
      toggleDesktopCommandPin(payload.commandValue),
    [IPC_CHANNELS.commands.toggleRunPin]: (_event, payload: { runCommand: string }) =>
      toggleDesktopRunPin(payload.runCommand),
    [IPC_CHANNELS.commands.run]: (_event, payload) => runDesktopCommand(payload),

    [IPC_CHANNELS.pipelines.list]: (_event, payload?: { cwd?: string }) =>
      listDesktopPipelines(payload?.cwd),
    [IPC_CHANNELS.pipelines.save]: (
      _event,
      payload: { pipeline: Pipeline; source: PipelineSource; cwd?: string },
    ) => saveDesktopPipeline(payload.pipeline, payload.source, payload.cwd),
    [IPC_CHANNELS.pipelines.delete]: (
      _event,
      payload: { pipelineId: string; source: PipelineSource; cwd?: string },
    ) => deleteDesktopPipeline(payload.pipelineId, payload.source, payload.cwd),
    [IPC_CHANNELS.pipelines.run]: (_event, payload: { name: string; cwd?: string }) =>
      runDesktopPipeline(payload.name, payload.cwd),

    [IPC_CHANNELS.processes.list]: (_event, payload?: { cwd?: string }) =>
      findProcessesByCwd(payload?.cwd ?? process.cwd()),
    [IPC_CHANNELS.processes.start]: (
      _event,
      payload: { command: string; args?: string[]; cwd?: string; id?: string },
    ) => {
      const args = payload.args ?? [];
      const cwd = payload.cwd ?? process.cwd();
      const processId = payload.id ?? generateProcessId(payload.command, args);
      return startProcess(processId, payload.command, args, cwd);
    },
    [IPC_CHANNELS.processes.stop]: (_event, payload: { id: string }) => stopProcess(payload.id),
    [IPC_CHANNELS.processes.logs]: (
      _event,
      payload: { id: string; tail?: number },
    ) => getProcessOutput(payload.id, payload.tail, "both"),
    [IPC_CHANNELS.processes.remove]: (_event, payload: { id: string }) => removeProcess(payload.id),

    [IPC_CHANNELS.status.tools]: (_event, payload?: { cwd?: string }) =>
      getDesktopToolStatus(payload?.cwd),

    [IPC_CHANNELS.config.read]: (_event, payload?: { cwd?: string }) =>
      getDesktopProjectConfig(payload?.cwd),
    [IPC_CHANNELS.config.write]: (
      _event,
      payload: { cwd?: string; config: ProjectConfig },
    ) => saveDesktopProjectConfig(payload.config, payload.cwd),

    [IPC_CHANNELS.declarative.status]: (_event, payload?: { cwd?: string }) =>
      getDesktopDeclarativeStatus(payload?.cwd),
    [IPC_CHANNELS.declarative.plan]: (_event, payload?: { cwd?: string }) =>
      getDesktopDeclarativePlan(payload?.cwd),
    [IPC_CHANNELS.declarative.apply]: (_event, payload?: { cwd?: string }) =>
      applyDesktopDeclarativePlan(payload?.cwd),

    [IPC_CHANNELS.workspace.snapshot]: (_event, payload?: { cwd?: string }) =>
      getDesktopWorkspaceSnapshot(payload?.cwd),
    [IPC_CHANNELS.workspace.runScript]: (
      _event,
      payload: { repoPath: string; script: string; args?: string[]; id?: string },
    ) => runDesktopWorkspaceScript(payload.repoPath, payload.script, payload.args, payload.id),

    [IPC_CHANNELS.mcp.status]: () => getDesktopMcpStatus(),
    [IPC_CHANNELS.mcp.install]: (_event, payload: { scope: McpScope }) =>
      installDesktopMcp(payload.scope),
    [IPC_CHANNELS.mcp.remove]: (_event, payload: { scope: McpScope }) =>
      removeDesktopMcp(payload.scope),

    [IPC_CHANNELS.skills.preview]: () => getDesktopSkillPreview(),
    [IPC_CHANNELS.skills.setup]: () => setupDesktopSkill(),
  };
}

export function registerPolterIpcHandlers(target: Pick<IpcMain, "handle"> = ipcMain) {
  const handlers = createPolterIpcHandlers();
  for (const [channel, handler] of Object.entries(handlers)) {
    target.handle(channel, handler);
  }
  return handlers;
}
