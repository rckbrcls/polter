import { useState, type FormEvent, type JSX } from "react";
import {
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ToolIcon } from "../shared/tool-icons.js";
import type { CommandDef } from "../workbench/types.js";

export function ProcessCommandBoard({
  knownCommandResults,
  onCommandInputRun,
  onKnownCommandSelect,
  onPinnedCommandRun,
  onSearchQueryChange,
  pinnedCommands,
  searchQuery,
  selectedKnownCommand,
  selectedKnownCommandId,
}: {
  knownCommandResults: CommandDef[];
  onCommandInputRun: () => void;
  onKnownCommandSelect: (command: CommandDef) => void;
  onPinnedCommandRun: (commandLine: string) => void;
  onSearchQueryChange: (value: string) => void;
  pinnedCommands: string[];
  searchQuery: string;
  selectedKnownCommand: CommandDef | null;
  selectedKnownCommandId: string;
}): JSX.Element {
  const [searchOpen, setSearchOpen] = useState(false);
  const canStart = Boolean(searchQuery.trim() || selectedKnownCommand);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!canStart) {
      return;
    }

    setSearchOpen(false);
    onCommandInputRun();
  }

  return (
    <div className="relative grid gap-6" aria-label="Processes workspace">
      <form className="relative flex flex-col gap-2 md:flex-row md:items-center" onSubmit={handleSubmit}>
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="process-command-input"
            aria-label="Command"
            className="pl-9"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
            placeholder="Search or type a command"
          />
          {searchOpen ? (
            <CommandInputSuggestions
              commands={knownCommandResults}
              query={searchQuery}
              selectedCommandId={selectedKnownCommandId}
              onRunCustom={() => {
                setSearchOpen(false);
                onCommandInputRun();
              }}
              onSelect={(command) => {
                onKnownCommandSelect(command);
                setSearchOpen(false);
              }}
            />
          ) : null}
        </div>

        <Button type="submit" size="icon" aria-label="Start command" disabled={!canStart}>
          <PlusIcon className="size-4" />
        </Button>
      </form>

      <CommandShelf
        title="Pinned"
        emptyText="No pinned commands or staged scripts yet."
        items={pinnedCommands}
        renderItem={(commandLine) => (
          <CommandShelfButton
            key={commandLine}
            label={commandLine}
            meta="Pinned command"
            onClick={() => onPinnedCommandRun(commandLine)}
          />
        )}
      />
    </div>
  );
}

function CommandInputSuggestions({
  commands,
  onRunCustom,
  onSelect,
  query,
  selectedCommandId,
}: {
  commands: CommandDef[];
  onRunCustom: () => void;
  onSelect: (command: CommandDef) => void;
  query: string;
  selectedCommandId: string;
}): JSX.Element | null {
  const customCommand = query.trim();

  if (!commands.length && !customCommand) {
    return null;
  }

  return (
    <div className="absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-3xl border border-border/60 bg-popover p-1">
      {commands.map((command) => {
        const selected = command.id === selectedCommandId;

        return (
          <Button
            key={command.id}
            type="button"
            variant="ghost"
            className={cn(
              "h-auto w-full justify-start rounded-2xl px-3 py-2 text-left whitespace-normal",
              selected ? "bg-accent text-accent-foreground" : "hover:bg-muted/60",
            )}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(command)}
          >
            <span className="grid gap-1">
              <span className="flex items-center gap-2 text-sm font-medium">
                <ToolIcon tool={command.tool} className="text-muted-foreground" />
                {command.label}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {command.tool}:{command.base.join(" ")}
              </span>
            </span>
          </Button>
        );
      })}

      {customCommand && !selectedCommandId ? (
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-start rounded-2xl px-3 py-2 text-left whitespace-normal hover:bg-muted/60"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onRunCustom}
        >
          <span className="grid gap-1">
            <span className="flex items-center gap-2 text-sm font-medium">
              <PlusIcon className="size-4 text-muted-foreground" />
              {customCommand}
            </span>
            <span className="text-xs text-muted-foreground">Custom command</span>
          </span>
        </Button>
      ) : null}
    </div>
  );
}

function CommandShelf<T>({
  action,
  emptyText,
  items,
  renderItem,
  title,
}: {
  action?: JSX.Element;
  emptyText: string;
  items: T[];
  renderItem: (item: T) => JSX.Element;
  title: string;
}): JSX.Element {
  return (
    <section className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{title}</Label>
        {action}
      </div>
      {items.length ? (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{items.map(renderItem)}</div>
      ) : (
        <p className="rounded-2xl border border-border/60 bg-muted/10 px-3 py-3 text-sm text-muted-foreground">
          {emptyText}
        </p>
      )}
    </section>
  );
}

function CommandShelfButton({
  command,
  label,
  meta,
  onClick,
}: {
  command?: string;
  label: string;
  meta: string;
  onClick: () => void;
}): JSX.Element {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto justify-start rounded-2xl border border-border/60 bg-background/50 px-3 py-3 text-left whitespace-normal hover:bg-muted/40"
      onClick={onClick}
    >
      <span className="grid gap-1">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{meta}</span>
        {command ? <span className="font-mono text-xs text-muted-foreground">{command}</span> : null}
      </span>
    </Button>
  );
}
