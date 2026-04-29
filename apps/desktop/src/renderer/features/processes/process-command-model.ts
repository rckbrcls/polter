import type {
  CommandDef,
  DesktopWorkspaceSnapshot,
  Pipeline,
  PipelineSource,
  PipelineStep,
} from "../workbench/types.js";
import {
  domSafeId,
  getCommandValue,
  splitArgs,
} from "../shared/utils.js";

export type ProcessCommandInputMode = "known" | "manual";

export type ProcessCommandStatus = "idle" | "running" | "skipped" | "completed";

export type ProcessCommandSource = ProcessCommandInputMode | "package" | "pinned";

export interface ProcessPackageScriptCommand {
  id: string;
  scriptName: string;
  command: string;
  repoName: string;
  repoPath: string;
  packageManager: string;
  runCommand: string;
}

export interface ProcessCommandCard {
  id: string;
  source: ProcessCommandSource;
  commandId: string;
  label: string;
  commandValue: string;
  args: string[];
  flags: string[];
  status: ProcessCommandStatus;
  continueOnError: boolean;
}

export interface ProcessPipelineDraftInput {
  description: string;
  name: string;
  source: PipelineSource;
  steps: ProcessCommandCard[];
}

export interface ResolvedProcessCommand {
  command: string;
  args: string[];
}

export function filterKnownCommands(
  commands: CommandDef[],
  query: string,
  limit = 8,
): CommandDef[] {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = normalizedQuery
    ? commands.filter((command) => {
        const haystack = [
          command.label,
          command.tool,
          command.hint,
          getCommandValue(command),
          ...command.base,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
    : commands;

  return filtered.slice(0, limit);
}

export function findKnownCommandByInput(
  commands: CommandDef[],
  input: string,
): CommandDef | null {
  const normalizedInput = input.trim().toLowerCase();

  if (!normalizedInput) {
    return null;
  }

  return (
    commands.find((command) =>
      [command.id, command.label, getCommandValue(command)]
        .some((value) => value.toLowerCase() === normalizedInput),
    ) ?? null
  );
}

export function resolveKnownProcessCommand(
  command: CommandDef,
  packageManagerCommand: string,
): ResolvedProcessCommand {
  return {
    command: command.tool === "pkg" ? packageManagerCommand : command.tool,
    args: command.base,
  };
}

export function resolveManualProcessCommand(commandLine: string): ResolvedProcessCommand | null {
  const [command, ...args] = splitArgs(commandLine);

  if (!command) {
    return null;
  }

  return { command, args };
}

export function createKnownCommandCard(
  command: CommandDef,
  sequence: number,
): ProcessCommandCard {
  return {
    id: `known:${command.id}:${sequence}`,
    source: "known",
    commandId: command.id,
    label: command.label,
    commandValue: getCommandValue(command),
    args: [],
    flags: [],
    status: "idle",
    continueOnError: false,
  };
}

export function collectPackageScriptCommands(
  workspace: DesktopWorkspaceSnapshot | null | undefined,
): ProcessPackageScriptCommand[] {
  if (!workspace) {
    return [];
  }

  const rootScripts = workspace.rootScripts.map((script) => ({
    id: `root:${script.name}`,
    scriptName: script.name,
    command: script.command,
    repoName: "root",
    repoPath: workspace.root,
    packageManager: workspace.packageManager.command,
    runCommand: `${workspace.packageManager.command} run ${script.name}`,
  }));

  const childScripts = workspace.childRepos.flatMap((repo) =>
    repo.scripts.map((script) => ({
      id: `${domSafeId(repo.path)}:${script.name}`,
      scriptName: script.name,
      command: script.command,
      repoName: repo.name,
      repoPath: repo.path,
      packageManager: repo.pkgManager.command,
      runCommand: `${repo.pkgManager.command} --dir ${repo.path} run ${script.name}`,
    })),
  );

  return [...rootScripts, ...childScripts];
}

export function createPackageScriptCommandCard(
  script: ProcessPackageScriptCommand,
  sequence: number,
): ProcessCommandCard {
  const tokens = splitArgs(script.runCommand);
  const [, ...args] = tokens;

  return {
    id: `package:${script.id}:${sequence}`,
    source: "package",
    commandId: `package:${script.id}`,
    label: script.scriptName,
    commandValue: script.runCommand,
    args,
    flags: [],
    status: "idle",
    continueOnError: false,
  };
}

export function createManualCommandCard(
  commandLine: string,
  sequence: number,
): ProcessCommandCard | null {
  const tokens = splitArgs(commandLine);
  const [command, ...args] = tokens;

  if (!command) {
    return null;
  }

  const commandValue = tokens.join(" ");
  const slug = domSafeId(commandValue) || `command-${sequence}`;

  return {
    id: `manual:${slug}:${sequence}`,
    source: "manual",
    commandId: `manual:${slug}`,
    label: command,
    commandValue,
    args,
    flags: [],
    status: "idle",
    continueOnError: false,
  };
}

export function createPinnedCommandCard(
  commandLine: string,
  sequence: number,
): ProcessCommandCard | null {
  const tokens = splitArgs(commandLine);
  const [command, ...args] = tokens;

  if (!command) {
    return null;
  }

  const commandValue = tokens.join(" ");
  const slug = domSafeId(commandValue) || `pinned-${sequence}`;

  return {
    id: `pinned:${slug}:${sequence}`,
    source: "pinned",
    commandId: `pinned:${slug}`,
    label: command,
    commandValue,
    args,
    flags: [],
    status: "idle",
    continueOnError: false,
  };
}

export function reorderProcessCards(
  cards: ProcessCommandCard[],
  activeId: string,
  overId: string,
): ProcessCommandCard[] {
  const activeIndex = cards.findIndex((card) => card.id === activeId);
  const overIndex = cards.findIndex((card) => card.id === overId);

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
    return cards;
  }

  const nextCards = [...cards];
  const [activeCard] = nextCards.splice(activeIndex, 1);
  nextCards.splice(overIndex, 0, activeCard);
  return nextCards;
}

export function createPipelineStep(
  card: ProcessCommandCard,
  index: number,
): PipelineStep {
  return {
    id: `step-${index + 1}`,
    commandId: card.commandId,
    args: card.args,
    flags: card.flags,
    continueOnError: card.continueOnError,
    label: card.label,
  };
}

export function createPipelineFromProcessCards({
  description,
  name,
  steps,
}: ProcessPipelineDraftInput): Pipeline {
  return {
    id: "",
    name: name.trim(),
    description: description.trim() || undefined,
    steps: steps.map(createPipelineStep),
    createdAt: "",
    updatedAt: "",
  };
}
