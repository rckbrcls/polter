// Command discovery
export {
  allCommands,
  getCommandById,
  getCommandsByTool,
  getCommandValue,
  findCommandByValue,
} from "./data/commands/index.js";
export { features, getFeatureById } from "./data/features.js";
export { categories, getCategoryOptions, getCommandOptions } from "./data/commands.js";
export { getSuggestedArgOptions } from "./data/suggestedArgs.js";
export { getFlagsForTool, globalFlags, toolFlags, type FlagDef } from "./data/flags.js";
export {
  getPinnedCommands,
  getPinnedRuns,
  togglePinnedCommand,
  togglePinnedRun,
  isPinnedCommand,
  isPinnedRun,
} from "./data/pins.js";

// Execution
export {
  runCommand,
  runCommandWithRetry,
  runInteractiveCommand,
  runSupabaseCommand,
  resolveSupabaseCommand,
  findLocalSupabaseBinDir,
  type RunHandle,
  type RunResult,
  type CommandExecution,
  type SupabaseCommandResolution,
} from "./lib/runner.js";
export {
  resolveToolCommand,
  getToolInfo,
  getToolLinkInfo,
  getToolVersion,
  getToolDisplayName,
  type ToolInfo,
  type ToolLinkInfo,
  type ToolResolution,
} from "./lib/toolResolver.js";

// Package Manager
export {
  detectPkgManager,
  translateCommand,
  resolvePkgArgs,
  type PkgManagerId,
  type PkgManagerInfo,
} from "./lib/pkgManager.js";

// Filesystem and workspace helpers
export { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, unlinkSync, copyFileSync, statSync } from "./lib/fs.js";
export { findNearestPackageRoot } from "./lib/packageRoot.js";
export {
  discoverChildRepos,
  readScripts,
  type ChildRepo,
  type ScriptEntry,
} from "./lib/childRepos.js";
export { resolveEditor, isTerminalEditor, openInEditor } from "./lib/editor.js";

// Process Manager and IPC
export {
  startProcess,
  stopProcess,
  listProcesses,
  getProcessOutput,
  isProcessRunning,
  removeProcess,
  generateProcessId,
  findProcessesByCwd,
  findRunningByCommand,
  registerForegroundProcess,
  getSocketPath,
  type ProcessInfo,
  type ProcessOutput,
} from "./lib/processManager.js";
export { processEvents } from "./lib/processEvents.js";
export { createIpcServer, type IpcServer } from "./lib/ipcServer.js";
export { createIpcClient, type IpcClient } from "./lib/ipcClient.js";
export { serializeMessage, parseMessages, type RpcRequest, type RpcResponse } from "./lib/ipcProtocol.js";

// Pipelines
export {
  executePipeline,
  type StepResult,
  type PipelineProgress,
  type PipelineExecutionOptions,
} from "./pipeline/engine.js";
export { pipelineEvents } from "./pipeline/pipelineEvents.js";
export {
  getAllPipelines,
  findPipelineByName,
  savePipeline,
  deletePipeline,
  type PipelineSource,
  type PipelineWithSource,
} from "./pipeline/storage.js";

// Config
export {
  readProjectConfig,
  writeProjectConfig,
  getOrCreateProjectConfig,
  getProjectConfigPath,
  getProjectPipelines,
  saveProjectPipeline,
  deleteProjectPipeline,
} from "./config/projectConfig.js";
export {
  getGlobalPipelines,
  saveGlobalPipeline,
  deleteGlobalPipeline,
  __clearGlobalPipelinesForTests,
} from "./config/store.js";
export { getConf } from "./config/globalConf.js";

// Declarative
export { parsePolterYaml, findPolterYaml } from "./declarative/parser.js";
export { planChanges } from "./declarative/planner.js";
export { applyActions, type ApplyResult } from "./declarative/applier.js";
export { getCurrentStatus } from "./declarative/status.js";

// MCP and Skill setup
export {
  getMcpStatusInfo,
  installMcpServer,
  removeMcpServer,
  installMcpServerSilent,
  removeMcpServerSilent,
  mcpStatus,
  type McpStatusInfo,
  type McpActionResult,
} from "./lib/mcpInstaller.js";
export {
  setupSkill,
  setupSkillCli,
  getSkillContent,
  getSkillPath,
  type SkillSetupResult,
  type SkillSetupStatus,
} from "./lib/skillSetup.js";

// CLI helpers
export {
  parseCliArgs,
  printCliHelp,
  type CliMode,
  type McpScope,
  type McpAction,
  type ParsedCliCommand,
} from "./lib/cliArgs.js";
export { commandExists, execCapture } from "./lib/system.js";
export { parseErrorSuggestions, type ErrorSuggestion } from "./lib/errorSuggestions.js";
export { generatePolterYaml } from "./lib/yamlWriter.js";

// Desktop services
export {
  getDesktopAppInfo,
  listDesktopFeatures,
  listDesktopCommands,
  getDesktopCommandForm,
  getDesktopPins,
  listDesktopRepositories,
  addDesktopRepository,
  removeDesktopRepository,
  toggleDesktopCommandPin,
  toggleDesktopRunPin,
  runDesktopCommand,
  listDesktopPipelines,
  saveDesktopPipeline,
  deleteDesktopPipeline,
  runDesktopPipeline,
  getDesktopWorkspaceSnapshot,
  runDesktopWorkspaceScript,
  getDesktopToolStatus,
  getDesktopProjectConfig,
  saveDesktopProjectConfig,
  getDesktopDeclarativeStatus,
  getDesktopDeclarativePlan,
  applyDesktopDeclarativePlan,
  getDesktopMcpStatus,
  installDesktopMcp,
  removeDesktopMcp,
  getDesktopSkillPreview,
  setupDesktopSkill,
  type DesktopAppInfo,
  type DesktopCommandForm,
  type DesktopCommandRunInput,
  type DesktopCommandRunResult,
  type DesktopPins,
  type DesktopToolStatusSnapshot,
  type DesktopWorkspaceSnapshot,
  type DesktopDeclarativePlan,
  type DesktopDeclarativeApplyResult,
  type DesktopSkillPreview,
} from "./desktop/service.js";
export type { DesktopRepository } from "./config/store.js";

// Types
export type {
  CommandDef,
  Pipeline,
  PipelineStep,
  CliToolId,
  Feature,
  ProjectConfig,
  SuggestedArg,
} from "./data/types.js";
export type { PolterYaml, PlanAction, PlanResult, StatusResult } from "./declarative/schema.js";
