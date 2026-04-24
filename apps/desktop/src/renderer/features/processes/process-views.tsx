import { useEffect, useMemo, type JSX } from "react";
import type { CommandDef } from "../workbench/types.js";
import type { Workbench } from "../workbench/use-workbench.js";
import { ProcessCommandBoard } from "./process-command-board.js";
import { findKnownCommandByInput, resolveKnownProcessCommand } from "./process-command-model.js";
import { useProcessCommandBoard } from "./use-process-command-board.js";

export function ProcessesView({ workbench }: { workbench: Workbench }): JSX.Element {
  const board = useProcessCommandBoard(workbench.allCommands);
  const packageManagerCommand = workbench.workspace?.packageManager.command ?? "pnpm";
  const pinnedCommands = useMemo(() => {
    const pins = workbench.pins ?? { commandPins: [], runPins: [] };
    return [...new Set([...pins.runPins, ...pins.commandPins])];
  }, [workbench.pins]);

  useEffect(() => {
    if (!workbench.processCommandDraft) {
      return;
    }

    board.setCommandInput(workbench.processCommandDraft);
    workbench.clearProcessCommandDraft();
  }, [workbench.processCommandDraft]);

  async function startKnownCommand(command: CommandDef): Promise<boolean> {
    const resolved = resolveKnownProcessCommand(command, packageManagerCommand);
    return workbench.startProcessFromCommandLine([resolved.command, ...resolved.args].join(" "));
  }

  async function startCommandInput(): Promise<void> {
    const knownCommand =
      board.selectedKnownCommand ??
      findKnownCommandByInput(workbench.allCommands, board.searchQuery);
    const started = knownCommand
      ? await startKnownCommand(knownCommand)
      : await workbench.startProcessFromCommandLine(board.searchQuery);

    if (started) {
      board.clearCommandInput();
    }
  }

  async function startPinnedCommand(commandLine: string): Promise<void> {
    const knownCommand = findKnownCommandByInput(workbench.allCommands, commandLine);

    if (knownCommand) {
      await startKnownCommand(knownCommand);
      return;
    }

    await workbench.startProcessFromCommandLine(commandLine);
  }

  return (
    <ProcessCommandBoard
      knownCommandResults={board.knownCommandResults}
      onCommandInputRun={() => void startCommandInput()}
      onKnownCommandSelect={board.selectKnownCommand}
      onPinnedCommandRun={(commandLine) => void startPinnedCommand(commandLine)}
      onSearchQueryChange={board.setCommandInput}
      pinnedCommands={pinnedCommands}
      searchQuery={board.searchQuery}
      selectedKnownCommand={board.selectedKnownCommand}
      selectedKnownCommandId={board.selectedKnownCommandId}
    />
  );
}
