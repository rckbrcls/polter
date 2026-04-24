import { useEffect, useMemo, useState, type JSX } from "react";
import type { DesktopCommandForm } from "../workbench/types.js";
import {
  FolderIcon,
  PlayIcon,
  PlusIcon,
  SquareTerminalIcon,
  WorkflowIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandDialog as CommandDialogPrimitive,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { EmptyState, OutputPanel } from "../shared/components.js";
import { ToolIcon } from "../shared/tool-icons.js";
import { domSafeId, splitArgs, stringify } from "../shared/utils.js";
import type { Workbench } from "../workbench/use-workbench.js";
import {
  buildSearchDocuments,
  searchDocuments,
  type SearchDocument,
  type SearchDocumentKind,
} from "./command-search.js";

function getKindLabel(kind: SearchDocumentKind): string {
  switch (kind) {
    case "command":
      return "Command";
    case "pipeline":
      return "Pipeline";
    case "script":
      return "Script";
    case "project":
      return "Project";
    case "process":
      return "Process";
    default:
      return "Item";
  }
}

function SearchDocumentIcon({ document }: { document: SearchDocument }): JSX.Element {
  if (document.kind === "command" || document.kind === "script") {
    return <ToolIcon tool={document.tool} />;
  }

  if (document.kind === "pipeline") {
    return <WorkflowIcon className="size-4 shrink-0" />;
  }

  if (document.kind === "project") {
    return <FolderIcon className="size-4 shrink-0" />;
  }

  return <SquareTerminalIcon className="size-4 shrink-0" />;
}

function CommandInspector({
  commandArgsText,
  commandFlags,
  commandForm,
  executionOutput,
  onAddToPipeline,
  onRun,
  setCommandArgsText,
  setCommandFlags,
}: {
  commandArgsText: string;
  commandFlags: string[];
  commandForm: DesktopCommandForm | null;
  executionOutput: string;
  onAddToPipeline: () => void;
  onRun: () => void;
  setCommandArgsText: (value: string) => void;
  setCommandFlags: (value: string[]) => void;
}): JSX.Element {
  if (!commandForm) {
    return (
      <EmptyState
        title="Loading command"
        description="Preparing arguments, flags, and run metadata."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            <ToolIcon tool={commandForm.command.tool} className="text-muted-foreground" />
            <h3 className="text-base font-semibold">{commandForm.command.label}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {commandForm.command.hint ?? "Inspect this command before running it."}
          </p>
        </div>
        <Badge variant="outline" className="max-w-48 truncate">
          {commandForm.commandValue}
        </Badge>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="commander-command-args">Arguments</Label>
        <Input
          id="commander-command-args"
          value={commandArgsText}
          onChange={(event) => setCommandArgsText(event.target.value)}
        />
      </div>

      {commandForm.suggestedArgs.length ? (
        <div className="grid gap-2">
          <Label>Suggested args</Label>
          <div className="flex flex-wrap gap-2">
            {commandForm.suggestedArgs.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant="outline"
                onClick={() => setCommandArgsText(option.args.join(" "))}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {commandForm.flags.length ? (
        <div className="grid gap-2">
          <Label>Flags</Label>
          <div className="grid gap-2">
            {commandForm.flags.map((flag) => {
              const flagId = `commander-flag-${domSafeId(flag.value)}`;
              const checked = commandFlags.includes(flag.value);

              return (
                <div
                  key={flag.value}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <Checkbox
                    id={flagId}
                    checked={checked}
                    onCheckedChange={(nextChecked) => {
                      setCommandFlags(
                        nextChecked
                          ? [...commandFlags, flag.value]
                          : commandFlags.filter((item) => item !== flag.value),
                      );
                    }}
                  />
                  <div className="grid gap-0.5">
                    <Label htmlFor={flagId} className="cursor-pointer text-sm font-medium">
                      {flag.label}
                    </Label>
                    <span className="text-xs text-muted-foreground">{flag.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onRun}>
          <PlayIcon className="size-4" />
          Run
        </Button>
        <Button variant="outline" onClick={onAddToPipeline}>
          <PlusIcon className="size-4" />
          Add to pipeline
        </Button>
      </div>

      {executionOutput ? (
        <OutputPanel
          label="Result"
          value={executionOutput}
          placeholder="No command has been executed yet."
          className="h-56"
        />
      ) : null}
    </div>
  );
}

function GenericInspector({
  document,
  executionOutput,
  onPrimaryAction,
}: {
  document: SearchDocument;
  executionOutput: string;
  onPrimaryAction: () => void;
}): JSX.Element {
  const actionLabel =
    document.kind === "pipeline"
      ? "Run pipeline"
      : document.kind === "script"
        ? "Run in background"
        : document.kind === "project"
          ? "Switch project"
          : "Open process";

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            <SearchDocumentIcon document={document} />
            <h3 className="text-base font-semibold">{document.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{document.subtitle}</p>
        </div>
        <Badge variant="outline">{getKindLabel(document.kind)}</Badge>
      </div>

      {document.description ? (
        <p className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
          {document.description}
        </p>
      ) : null}

      {document.path ? (
        <div className="grid gap-1">
          <Label>Path</Label>
          <code className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 font-mono text-xs">
            {document.path}
          </code>
        </div>
      ) : null}

      {document.commandValue ? (
        <div className="grid gap-1">
          <Label>Command</Label>
          <code className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 font-mono text-xs">
            {document.commandValue}
          </code>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onPrimaryAction}>
          <PlayIcon className="size-4" />
          {actionLabel}
        </Button>
      </div>

      {executionOutput ? (
        <OutputPanel
          label="Result"
          value={executionOutput}
          placeholder="No action has been executed yet."
          className="h-56"
        />
      ) : null}
    </div>
  );
}

export function CommanderDialog({
  onOpenChange,
  open,
  workbench,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  workbench: Workbench;
}): JSX.Element {
  const documents = useMemo(
    () =>
      buildSearchDocuments({
        commands: workbench.allCommands,
        features: workbench.features,
        pipelines: workbench.pipelines,
        processes: workbench.processes,
        repositories: workbench.repositories,
        workspace: workbench.workspace,
      }),
    [
      workbench.allCommands,
      workbench.features,
      workbench.pipelines,
      workbench.processes,
      workbench.repositories,
      workbench.workspace,
    ],
  );
  const [commandArgsText, setCommandArgsText] = useState("");
  const [commandFlags, setCommandFlags] = useState<string[]>([]);
  const [commandForm, setCommandForm] = useState<DesktopCommandForm | null>(null);
  const [executionOutput, setExecutionOutput] = useState("");
  const [results, setResults] = useState<SearchDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const selectedDocument =
    results.find((document) => document.id === selectedDocumentId) ?? results[0] ?? null;

  useEffect(() => {
    if (!open) {
      return;
    }

    setSearchTerm("");
    setExecutionOutput("");
    setSelectedDocumentId(documents[0]?.id ?? "");
  }, [documents, open]);

  useEffect(() => {
    let disposed = false;

    void searchDocuments(documents, searchTerm).then((nextResults) => {
      if (disposed) {
        return;
      }

      setResults(nextResults);
      setSelectedDocumentId((current) =>
        nextResults.some((document) => document.id === current)
          ? current
          : (nextResults[0]?.id ?? ""),
      );
    });

    return () => {
      disposed = true;
    };
  }, [documents, searchTerm]);

  useEffect(() => {
    if (selectedDocument?.kind !== "command" || !selectedDocument.commandId) {
      setCommandForm(null);
      setCommandArgsText("");
      setCommandFlags([]);
      return;
    }

    let disposed = false;
    setExecutionOutput("");

    void workbench.inspectCommand(selectedDocument.commandId).then((form) => {
      if (disposed) {
        return;
      }

      setCommandForm(form);
      setCommandArgsText("");
      setCommandFlags([]);
    });

    return () => {
      disposed = true;
    };
  }, [selectedDocument?.commandId, selectedDocument?.kind]);

  async function runSelectedCommand() {
    if (!selectedDocument?.commandId || !commandForm) {
      return;
    }

    const result = await workbench.runCommandById(
      selectedDocument.commandId,
      splitArgs(commandArgsText),
      commandFlags,
    );

    if (result) {
      setExecutionOutput(
        [result.executed, result.stdout, result.stderr].filter(Boolean).join("\n\n"),
      );
    }
  }

  function addSelectedCommandToPipeline() {
    if (!selectedDocument?.commandId || !commandForm) {
      return;
    }

    workbench.addCommandToPipelineDraft(
      selectedDocument.commandId,
      splitArgs(commandArgsText),
      commandFlags,
      commandForm.command.label,
    );
    onOpenChange(false);
  }

  async function runGenericAction(document: SearchDocument) {
    setExecutionOutput("");

    if (document.kind === "pipeline" && document.pipelineName) {
      const result = await workbench.runPipelineByName(document.pipelineName);
      setExecutionOutput(result ? stringify(result) : "Pipeline run failed.");
      return;
    }

    if (document.kind === "script" && document.repoPath && document.scriptName) {
      await workbench.runWorkspaceScript(document.repoPath, document.scriptName);
      onOpenChange(false);
      return;
    }

    if (document.kind === "project") {
      const repository = workbench.repositories.find(
        (entry) => entry.id === document.projectId || entry.path === document.path,
      );
      if (repository) {
        await workbench.selectRepository(repository);
        onOpenChange(false);
      }
      return;
    }

    if (document.kind === "process" && document.processId) {
      workbench.setSelectedProcessId(document.processId);
      workbench.setSelectedView("processes");
      onOpenChange(false);
    }
  }

  return (
    <CommandDialogPrimitive
      open={open}
      onOpenChange={onOpenChange}
      title="Commander"
      description="Search commands, pipelines, scripts, projects, and processes."
      className="top-[12vh] w-[min(calc(100vw-2rem),72rem)] max-w-none border border-border bg-popover sm:max-w-none [&_[data-slot=dialog-close]]:!right-2.5 [&_[data-slot=dialog-close]]:!top-2.5"
      showCloseButton
    >
      <Command shouldFilter={false} className="h-[min(72vh,34rem)] max-h-none min-h-0">
        <CommandInput
          value={searchTerm}
          onValueChange={setSearchTerm}
          placeholder="Search commands, pipelines, scripts, projects..."
        />
        <div className="mt-3 grid min-h-0 flex-1 md:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] md:gap-4">
          <CommandList className="h-full max-h-none">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Results">
              {results.map((document) => (
                <CommandItem
                  key={document.id}
                  value={document.id}
                  className={cn(
                    "items-start rounded-2xl px-2.5 py-2",
                    selectedDocument?.id === document.id && "bg-muted text-foreground",
                  )}
                  onSelect={() => {
                    setSelectedDocumentId(document.id);
                    setExecutionOutput("");
                  }}
                >
                  <SearchDocumentIcon document={document} />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate">{document.title}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {document.subtitle || document.description || document.path}
                    </span>
                  </span>
                  <CommandShortcut>{getKindLabel(document.kind)}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>

          <ScrollArea className="h-full min-h-0 rounded-3xl border border-border/60 bg-background/70">
            <div className="grid gap-4 p-4">
              {selectedDocument ? (
                <>
                  {selectedDocument.kind === "command" ? (
                    <CommandInspector
                      commandArgsText={commandArgsText}
                      commandFlags={commandFlags}
                      commandForm={commandForm}
                      executionOutput={executionOutput}
                      onAddToPipeline={addSelectedCommandToPipeline}
                      onRun={() => void runSelectedCommand()}
                      setCommandArgsText={setCommandArgsText}
                      setCommandFlags={setCommandFlags}
                    />
                  ) : (
                    <GenericInspector
                      document={selectedDocument}
                      executionOutput={executionOutput}
                      onPrimaryAction={() => void runGenericAction(selectedDocument)}
                    />
                  )}
                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    Results are indexed locally with Orama full-text search. Vector embeddings can
                    be plugged into the search document layer later.
                  </p>
                </>
              ) : (
                <EmptyState
                  title="No command selected"
                  description="Search and select an item to inspect it before running."
                />
              )}
            </div>
          </ScrollArea>
        </div>
      </Command>
    </CommandDialogPrimitive>
  );
}
