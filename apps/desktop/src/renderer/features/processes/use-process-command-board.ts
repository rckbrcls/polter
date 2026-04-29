import { useMemo, useState } from "react";
import type { CommandDef } from "../workbench/types.js";
import { filterKnownCommands } from "./process-command-model.js";

export function useProcessCommandBoard(commands: CommandDef[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKnownCommandId, setSelectedKnownCommandId] = useState("");

  const knownCommandResults = useMemo(
    () => filterKnownCommands(commands, searchQuery),
    [commands, searchQuery],
  );

  const selectedKnownCommand =
    commands.find((command) => command.id === selectedKnownCommandId) ?? null;

  function setCommandInput(value: string): void {
    setSearchQuery(value);
    setSelectedKnownCommandId("");
  }

  function selectKnownCommand(command: CommandDef): void {
    setSearchQuery(command.label);
    setSelectedKnownCommandId(command.id);
  }

  function clearCommandInput(): void {
    setSearchQuery("");
    setSelectedKnownCommandId("");
  }

  return {
    clearCommandInput,
    knownCommandResults,
    searchQuery,
    selectKnownCommand,
    selectedKnownCommand,
    selectedKnownCommandId,
    setCommandInput,
  };
}
