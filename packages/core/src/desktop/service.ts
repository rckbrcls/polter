import packageJson from "../../package.json" with { type: "json" };
import {
  allCommands,
  getCommandById,
  getCommandValue,
} from "../data/commands/index.js";
import { features, getFeatureById } from "../data/features.js";
import { getFlagsForTool } from "../data/flags.js";
import {
  getPinnedCommands,
  getPinnedRuns,
  togglePinnedCommand,
  togglePinnedRun,
} from "../data/pins.js";
import { getSuggestedArgOptions } from "../data/suggestedArgs.js";
import type {
  CliToolId,
  CommandDef,
  Feature,
  Pipeline,
  ProjectConfig,
} from "../data/types.js";
import { readProjectConfig, writeProjectConfig, getOrCreateProjectConfig } from "../config/projectConfig.js";
import { getCurrentStatus } from "../declarative/status.js";
import { parsePolterYaml } from "../declarative/parser.js";
import { planChanges } from "../declarative/planner.js";
import { applyActions, type ApplyResult } from "../declarative/applier.js";
import { discoverChildRepos, readScripts } from "../lib/childRepos.js";
import type { McpScope } from "../lib/cliArgs.js";
import { findNearestPackageRoot } from "../lib/packageRoot.js";
import { resolvePkgArgs, detectPkgManager } from "../lib/pkgManager.js";
import {
  findProcessesByCwd,
  generateProcessId,
  startProcess,
} from "../lib/processManager.js";
import { runCommand } from "../lib/runner.js";
import {
  getMcpStatusInfo,
  installMcpServerSilent,
  removeMcpServerSilent,
} from "../lib/mcpInstaller.js";
import { getSkillContent, getSkillPath, setupSkill } from "../lib/skillSetup.js";
import { getToolLinkInfo, resolveToolCommand } from "../lib/toolResolver.js";
import {
  deletePipeline,
  findPipelineByName,
  getAllPipelines,
  savePipeline,
  type PipelineSource,
} from "../pipeline/storage.js";
import { executePipeline } from "../pipeline/engine.js";

const TOOL_IDS: CliToolId[] = ["supabase", "gh", "vercel", "git", "pkg"];

function normalizeCwd(cwd?: string): string {
  return cwd ?? process.cwd();
}

function resolveCommandExecution(commandId: string, cwd: string, args: string[], flags: string[]) {
  const command = getCommandById(commandId);
  if (!command) {
    throw new Error(`Command not found: ${commandId}`);
  }

  let baseArgs = command.base;
  if (command.tool === "pkg") {
    const translated = resolvePkgArgs(command.base, cwd);
    baseArgs = translated.args;
  }

  const resolved = resolveToolCommand(command.tool, cwd);
  const allArgs = [...baseArgs, ...args, ...flags];

  return {
    command,
    resolved,
    allArgs,
    executed: [resolved.command, ...allArgs].join(" "),
  };
}

function toPipelineId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
  flags: ReturnType<typeof getFlagsForTool>;
  suggestedArgs: ReturnType<typeof getSuggestedArgOptions>;
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

export interface DesktopWorkspaceSnapshot {
  cwd: string;
  root: string;
  packageManager: ReturnType<typeof detectPkgManager>;
  rootScripts: ReturnType<typeof readScripts>;
  childRepos: ReturnType<typeof discoverChildRepos>;
  projectConfig: ProjectConfig;
}

export interface DesktopToolStatusSnapshot {
  cwd: string;
  tools: ReturnType<typeof getToolLinkInfo>[];
  project: ReturnType<typeof getCurrentStatus>;
}

export interface DesktopDeclarativePlan {
  cwd: string;
  yamlFound: boolean;
  parsedYaml: ReturnType<typeof parsePolterYaml> | null;
  plan: ReturnType<typeof planChanges> | null;
  error?: string;
}

export interface DesktopDeclarativeApplyResult {
  cwd: string;
  plan: DesktopDeclarativePlan;
  results: ApplyResult[];
}

export interface DesktopSkillPreview {
  path: string;
  content: string;
}

export function getDesktopAppInfo(cwd?: string): DesktopAppInfo {
  return {
    name: "Polter Desktop",
    version: packageJson.version,
    cwd: normalizeCwd(cwd),
  };
}

export function listDesktopFeatures(): Feature[] {
  return features;
}

export function listDesktopCommands(featureId?: string): CommandDef[] {
  if (!featureId) {
    return allCommands;
  }
  return getFeatureById(featureId)?.commands ?? [];
}

export function getDesktopPins(): DesktopPins {
  return {
    commandPins: getPinnedCommands(),
    runPins: getPinnedRuns(),
  };
}

export function getDesktopCommandForm(commandId: string): DesktopCommandForm {
  const command = getCommandById(commandId);
  if (!command) {
    throw new Error(`Command not found: ${commandId}`);
  }

  return {
    command,
    commandValue: getCommandValue(command),
    flags: getFlagsForTool(command.tool),
    suggestedArgs: getSuggestedArgOptions(getCommandValue(command)),
    pins: getDesktopPins(),
  };
}

export function toggleDesktopCommandPin(commandValue: string): DesktopPins {
  togglePinnedCommand(commandValue);
  return getDesktopPins();
}

export function toggleDesktopRunPin(runCommand: string): DesktopPins {
  togglePinnedRun(runCommand);
  return getDesktopPins();
}

export async function runDesktopCommand(input: DesktopCommandRunInput): Promise<DesktopCommandRunResult> {
  const cwd = normalizeCwd(input.cwd);
  const args = input.args ?? [];
  const flags = input.flags ?? [];
  const { command, resolved, allArgs, executed } = resolveCommandExecution(
    input.commandId,
    cwd,
    args,
    flags,
  );

  const result = await runCommand(
    { command: resolved.command, env: resolved.env },
    allArgs,
    cwd,
    { quiet: true },
  ).promise;

  return {
    commandId: command.id,
    commandValue: getCommandValue(command),
    executed,
    success: !result.spawnError && result.exitCode === 0,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    spawnError: result.spawnError,
  };
}

export function listDesktopPipelines(cwd?: string) {
  return getAllPipelines(normalizeCwd(cwd));
}

export function saveDesktopPipeline(
  pipeline: Pipeline,
  source: PipelineSource,
  cwd?: string,
): Pipeline {
  const timestamp = new Date().toISOString();
  const hydratedPipeline: Pipeline = {
    ...pipeline,
    id: pipeline.id || toPipelineId(pipeline.name),
    createdAt: pipeline.createdAt || timestamp,
    updatedAt: timestamp,
  };

  const saved = savePipeline(hydratedPipeline, source, normalizeCwd(cwd));
  if (!saved) {
    throw new Error("Unable to save pipeline in the current workspace.");
  }

  return hydratedPipeline;
}

export function deleteDesktopPipeline(pipelineId: string, source: PipelineSource, cwd?: string): void {
  deletePipeline(pipelineId, source, normalizeCwd(cwd));
}

export async function runDesktopPipeline(name: string, cwd?: string) {
  const workDir = normalizeCwd(cwd);
  const pipeline = findPipelineByName(name, workDir);
  if (!pipeline) {
    throw new Error(`Pipeline not found: ${name}`);
  }

  const steps = await executePipeline(pipeline, () => {}, workDir);
  return {
    pipeline,
    steps,
    success: steps.every((step) => step.status === "success" || step.status === "skipped"),
  };
}

export function getDesktopWorkspaceSnapshot(cwd?: string): DesktopWorkspaceSnapshot {
  const activeCwd = normalizeCwd(cwd);
  const root = findNearestPackageRoot(activeCwd) ?? activeCwd;
  const projectConfig = getOrCreateProjectConfig(root);

  return {
    cwd: activeCwd,
    root,
    packageManager: detectPkgManager(root),
    rootScripts: readScripts(root),
    childRepos: discoverChildRepos(root, projectConfig.childRepos),
    projectConfig,
  };
}

export function runDesktopWorkspaceScript(
  repoPath: string,
  script: string,
  args: string[] = [],
  id?: string,
) {
  const pkgManager = detectPkgManager(repoPath);
  const command = pkgManager.command;
  const commandArgs = ["run", script, ...args];
  const processId = id ?? generateProcessId(command, commandArgs);
  return startProcess(processId, command, commandArgs, repoPath);
}

export function getDesktopToolStatus(cwd?: string): DesktopToolStatusSnapshot {
  const activeCwd = normalizeCwd(cwd);
  return {
    cwd: activeCwd,
    tools: TOOL_IDS.map((toolId) => getToolLinkInfo(toolId, activeCwd)),
    project: getCurrentStatus(activeCwd),
  };
}

export function getDesktopProjectConfig(cwd?: string): ProjectConfig | undefined {
  return readProjectConfig(normalizeCwd(cwd)) ?? getOrCreateProjectConfig(normalizeCwd(cwd));
}

export function saveDesktopProjectConfig(config: ProjectConfig, cwd?: string): boolean {
  return writeProjectConfig(config, normalizeCwd(cwd));
}

export function getDesktopDeclarativeStatus(cwd?: string) {
  return getCurrentStatus(normalizeCwd(cwd));
}

export function getDesktopDeclarativePlan(cwd?: string): DesktopDeclarativePlan {
  const activeCwd = normalizeCwd(cwd);
  const parsedYaml = parsePolterYaml(activeCwd);
  if (!parsedYaml) {
    return {
      cwd: activeCwd,
      yamlFound: false,
      parsedYaml: null,
      plan: null,
      error: "No valid polter.yaml found in the selected workspace.",
    };
  }

  return {
    cwd: activeCwd,
    yamlFound: true,
    parsedYaml,
    plan: planChanges(parsedYaml),
  };
}

export async function applyDesktopDeclarativePlan(cwd?: string): Promise<DesktopDeclarativeApplyResult> {
  const plan = getDesktopDeclarativePlan(cwd);
  if (!plan.plan) {
    throw new Error(plan.error ?? "No declarative plan is available.");
  }

  const results = await applyActions(plan.plan.actions, plan.cwd);
  return {
    cwd: plan.cwd,
    plan,
    results,
  };
}

export function getDesktopMcpStatus() {
  return getMcpStatusInfo();
}

export async function installDesktopMcp(scope: McpScope) {
  return installMcpServerSilent(scope);
}

export async function removeDesktopMcp(scope: McpScope) {
  return removeMcpServerSilent(scope);
}

export function getDesktopSkillPreview(): DesktopSkillPreview {
  return {
    path: getSkillPath(),
    content: getSkillContent(),
  };
}

export function setupDesktopSkill() {
  return setupSkill();
}

export function listDesktopProcesses(cwd?: string) {
  const activeCwd = normalizeCwd(cwd);
  return findProcessesByCwd(activeCwd);
}

export function readDesktopProcessLogs(id: string, tail?: number) {
  return getProcessOutput(id, tail, "both");
}

export async function stopDesktopProcess(id: string) {
  return stopProcess(id);
}

export function removeDesktopProcess(id: string) {
  return removeProcess(id);
}
