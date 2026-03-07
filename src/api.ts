// Command discovery
export { allCommands, getCommandById, getCommandsByTool, getCommandValue } from "./data/commands/index.js";
export { features, getFeatureById } from "./data/features.js";
export { getFlagsForTool, toolFlags } from "./data/flags.js";

// Execution
export { runCommand, type RunResult, type CommandExecution } from "./lib/runner.js";
export { resolveToolCommand, getToolInfo, getToolDisplayName, type ToolInfo } from "./lib/toolResolver.js";

// Package Manager
export { detectPkgManager, translateCommand, resolvePkgArgs, type PkgManagerId, type PkgManagerInfo } from "./lib/pkgManager.js";

// Process Manager
export { startProcess, stopProcess, listProcesses, getProcessOutput, isProcessRunning, removeProcess, generateProcessId, findProcessesByCwd, findRunningByCommand, type ProcessInfo, type ProcessOutput } from "./lib/processManager.js";

// Pipelines
export { executePipeline, type StepResult, type PipelineProgress } from "./pipeline/engine.js";
export { getAllPipelines, findPipelineByName, savePipeline, deletePipeline } from "./pipeline/storage.js";

// Declarative
export { parsePolterYaml } from "./declarative/parser.js";
export { planChanges } from "./declarative/planner.js";
export { applyActions, type ApplyResult } from "./declarative/applier.js";
export { getCurrentStatus } from "./declarative/status.js";

// MCP
export { getMcpStatusInfo, installMcpServerSilent, removeMcpServerSilent, type McpStatusInfo, type McpActionResult } from "./lib/mcpInstaller.js";

// Types
export type { CommandDef, Pipeline, PipelineStep, CliToolId, Feature, ProjectConfig, SuggestedArg } from "./data/types.js";
export type { PolterYaml, PlanAction, PlanResult, StatusResult } from "./declarative/schema.js";
