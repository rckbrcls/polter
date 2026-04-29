import { useEffect, useMemo, useState, type JSX } from "react";
import {
  ArrowLeftIcon,
  CommandIcon,
  CornerDownLeftIcon,
  FolderIcon,
  PlayIcon,
  PlusIcon,
  SquareTerminalIcon,
  WorkflowIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
import { cn } from "@/lib/utils";
import { OutputPanel } from "../shared/components.js";
import { ToolIcon } from "../shared/tool-icons.js";
import { domSafeId, splitArgs } from "../shared/utils.js";
import type { DesktopCommandForm } from "../workbench/types.js";
import type { Workbench } from "../workbench/use-workbench.js";
import {
  buildSearchDocuments,
  searchDocuments,
  type SearchDocument,
  type SearchDocumentKind,
} from "./command-search.js";

interface CommanderGroup {
  id: string;
  label: string;
  documents: SearchDocument[];
}

type CommanderPlane = "list" | "command-detail";

const KIND_GROUPS: Array<{ kind: SearchDocumentKind; label: string }> = [
  { kind: "command", label: "Commands" },
  { kind: "pipeline", label: "Pipelines" },
  { kind: "script", label: "Scripts" },
  { kind: "project", label: "Projects" },
  { kind: "process", label: "Processes" },
];

const commanderEase = [0.22, 1, 0.36, 1] as const;

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

function getPrimaryActionLabel(document: SearchDocument | null): string {
  switch (document?.kind) {
    case "command":
      return "Open Details";
    case "pipeline":
      return "Run Pipeline";
    case "script":
      return "Stage in Processes";
    case "project":
      return "Switch Project";
    case "process":
      return "Open Process";
    default:
      return "Open";
  }
}

function getPrimaryActionHint(document: SearchDocument | null): string {
  if (!document) {
    return "Select an item";
  }

  return document.commandValue || document.path || document.subtitle || document.description;
}

function SearchDocumentIcon({ document }: { document: SearchDocument }): JSX.Element {
  if (document.kind === "command" || document.kind === "script") {
    return <ToolIcon tool={document.tool} className="size-4 text-foreground" />;
  }

  if (document.kind === "pipeline") {
    return <WorkflowIcon className="size-4 shrink-0 text-foreground" />;
  }

  if (document.kind === "project") {
    return <FolderIcon className="size-4 shrink-0 text-foreground" />;
  }

  return <SquareTerminalIcon className="size-4 shrink-0 text-foreground" />;
}

function buildCommanderGroups(
  results: SearchDocument[],
  hasSearchTerm: boolean,
): CommanderGroup[] {
  const suggestionCount = Math.min(hasSearchTerm ? 3 : 5, results.length);
  const suggestions = results.slice(0, suggestionCount);
  const suggestionIds = new Set(suggestions.map((document) => document.id));
  const groups: CommanderGroup[] = suggestions.length
    ? [{ id: "suggestions", label: "Suggestions", documents: suggestions }]
    : [];

  for (const group of KIND_GROUPS) {
    const documents = results.filter(
      (document) => document.kind === group.kind && !suggestionIds.has(document.id),
    );

    if (documents.length) {
      groups.push({
        id: group.kind,
        label: group.label,
        documents,
      });
    }
  }

  return groups;
}

function CommanderSearchInput({
  onSearchTermChange,
  searchTerm,
}: {
  onSearchTermChange: (value: string) => void;
  searchTerm: string;
}): JSX.Element {
  return (
    <CommandInput
      id="commander-search-input"
      autoFocus
      value={searchTerm}
      onValueChange={onSearchTermChange}
      placeholder="Search for apps and commands..."
      wrapperClassName="border-b border-glass-border p-0"
      inputGroupClassName="h-14 rounded-none border-0 bg-transparent px-4 shadow-none ring-0 focus-within:ring-0 dark:ring-0"
      className="text-sm font-medium placeholder:text-muted-foreground/70"
    />
  );
}

function CommanderRow({
  document,
  onRun,
  onSelect,
  reducedMotion,
  selected,
}: {
  document: SearchDocument;
  onRun: () => void;
  onSelect: () => void;
  reducedMotion: boolean;
  selected: boolean;
}): JSX.Element {
  return (
    <CommandItem
      value={document.id}
      onMouseMove={onSelect}
      onSelect={onRun}
      className={cn(
        "relative h-11 overflow-hidden rounded-2xl bg-transparent px-3 py-2 text-sm font-medium text-foreground data-selected:bg-transparent data-selected:text-foreground",
        "hover:bg-glass-row",
      )}
    >
      {selected ? (
        <motion.div
          layoutId={reducedMotion ? undefined : "commander-active-row"}
          className="absolute inset-0 rounded-2xl bg-glass-row-active"
          transition={{ duration: reducedMotion ? 0 : 0.16, ease: commanderEase }}
        />
      ) : null}
      <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-lg bg-glass-row">
        <SearchDocumentIcon document={document} />
      </span>
      <span className="relative z-10 flex min-w-0 flex-1 items-baseline gap-2">
        <span className="truncate">{document.title}</span>
        <span className="truncate text-xs font-medium text-muted-foreground">
          {document.subtitle || document.description || document.path}
        </span>
      </span>
      <CommandShortcut className="relative z-10 shrink-0 pl-3 text-xs font-medium tracking-normal text-muted-foreground">
        {getKindLabel(document.kind)}
      </CommandShortcut>
    </CommandItem>
  );
}

function CommanderFooter({
  document,
  onPrimaryAction,
  reducedMotion,
}: {
  document: SearchDocument | null;
  onPrimaryAction: () => void;
  reducedMotion: boolean;
}): JSX.Element {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-4 border-t border-glass-border bg-glass-row px-4">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={document?.id ?? "none"}
          initial={reducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
          transition={{ duration: reducedMotion ? 0 : 0.14, ease: commanderEase }}
          className="min-w-0 truncate text-xs font-medium text-muted-foreground"
        >
          {getPrimaryActionHint(document)}
        </motion.div>
      </AnimatePresence>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          disabled={!document}
          onClick={onPrimaryAction}
          className="inline-flex h-8 items-center gap-2 rounded-xl px-2 text-xs font-semibold text-foreground transition-colors hover:bg-glass-row-active disabled:pointer-events-none disabled:opacity-40"
        >
          {getPrimaryActionLabel(document)}
          <span className="inline-flex size-6 items-center justify-center rounded-lg bg-glass-row-active text-muted-foreground">
            <CornerDownLeftIcon className="size-3.5" />
          </span>
        </button>
        <span className="h-6 w-px bg-glass-border" />
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          Actions
          <span className="inline-flex h-7 items-center gap-1 rounded-lg bg-glass-row-active px-2">
            <CommandIcon className="size-3.5" />
            K
          </span>
        </span>
      </div>
    </div>
  );
}

function CommanderCommandDetail({
  commandArgsText,
  commandFlags,
  commandForm,
  executionOutput,
  onAddToPipeline,
  onBack,
  onRun,
  reducedMotion,
  setCommandArgsText,
  setCommandFlags,
}: {
  commandArgsText: string;
  commandFlags: string[];
  commandForm: DesktopCommandForm | null;
  executionOutput: string;
  onAddToPipeline: () => void;
  onBack: () => void;
  onRun: () => void;
  reducedMotion: boolean;
  setCommandArgsText: (value: string) => void;
  setCommandFlags: (value: string[]) => void;
}): JSX.Element {
  return (
    <motion.div
      key="command-detail"
      initial={reducedMotion ? false : { opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 32 }}
      transition={{ duration: reducedMotion ? 0 : 0.18, ease: commanderEase }}
      className="flex h-[min(62vh,34rem)] min-h-0 flex-col"
    >
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-glass-border px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-xl hover:bg-glass-row-active"
          onClick={onBack}
        >
          <ArrowLeftIcon className="size-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">
            {commandForm?.command.label ?? "Command details"}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {commandForm?.commandValue ?? "Loading command metadata"}
          </div>
        </div>
        {commandForm ? <ToolIcon tool={commandForm.command.tool} className="size-4" /> : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="grid gap-4 p-4">
          {commandForm?.command.hint ? (
            <p className="text-sm text-muted-foreground">{commandForm.command.hint}</p>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="commander-command-args" className="text-xs">
              Arguments
            </Label>
            <Input
              id="commander-command-args"
              value={commandArgsText}
              onChange={(event) => setCommandArgsText(event.target.value)}
              placeholder="Optional args"
              className="text-sm"
            />
          </div>

          {commandForm?.suggestedArgs.length ? (
            <div className="grid gap-2">
              <Label className="text-xs">Suggested args</Label>
              <div className="flex flex-wrap gap-2">
                {commandForm.suggestedArgs.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setCommandArgsText(option.args.join(" "))}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {commandForm?.flags.length ? (
            <div className="grid gap-2">
              <Label className="text-xs">Flags</Label>
              <div className="grid gap-2">
                {commandForm.flags.map((flag) => {
                  const flagId = `commander-flag-${domSafeId(flag.value)}`;
                  const checked = commandFlags.includes(flag.value);

                  return (
                    <div
                      key={flag.value}
                      className="flex items-start gap-3 rounded-2xl border border-glass-border bg-glass-row px-3 py-2"
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

          {executionOutput ? (
            <OutputPanel
              label="Result"
              value={executionOutput}
              placeholder="No command has been executed yet."
              className="h-40"
            />
          ) : null}
        </div>
      </ScrollArea>

      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-t border-glass-border bg-glass-row px-4">
        <span className="truncate text-xs text-muted-foreground">
          {commandForm?.commandValue ?? "Loading"}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={!commandForm}
            onClick={onAddToPipeline}
          >
            <PlusIcon className="size-4" />
            Add to pipeline
          </Button>
          <Button type="button" size="sm" className="rounded-xl" disabled={!commandForm} onClick={onRun}>
            <PlayIcon className="size-4" />
            Run
          </Button>
        </div>
      </div>
    </motion.div>
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
  return (
    <CommandDialogPrimitive
      open={open}
      onOpenChange={onOpenChange}
      title="Commander"
      description="Search commands, pipelines, scripts, projects, and processes."
      className="top-[10vh] w-[min(calc(100vw-2rem),44rem)] max-w-none sm:max-w-none"
    >
      <CommanderPanel open={open} onOpenChange={onOpenChange} workbench={workbench} />
    </CommandDialogPrimitive>
  );
}

export function CommanderPanel({
  onOpenChange,
  onRequestMainWindow,
  open,
  workbench,
}: {
  onOpenChange: (open: boolean) => void;
  onRequestMainWindow?: () => void;
  open: boolean;
  workbench: Workbench;
}): JSX.Element {
  const reducedMotion = Boolean(useReducedMotion());
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
  const [results, setResults] = useState<SearchDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [plane, setPlane] = useState<CommanderPlane>("list");
  const [commandArgsText, setCommandArgsText] = useState("");
  const [commandFlags, setCommandFlags] = useState<string[]>([]);
  const [commandForm, setCommandForm] = useState<DesktopCommandForm | null>(null);
  const [executionOutput, setExecutionOutput] = useState("");
  const hasSearchTerm = searchTerm.trim().length > 0;
  const selectedDocument =
    results.find((document) => document.id === selectedDocumentId) ?? results[0] ?? null;
  const groups = useMemo(
    () => buildCommanderGroups(results, hasSearchTerm),
    [hasSearchTerm, results],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setSearchTerm("");
    setSelectedDocumentId(documents[0]?.id ?? "");
    setPlane("list");
    setCommandArgsText("");
    setCommandFlags([]);
    setCommandForm(null);
    setExecutionOutput("");
  }, [documents, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById("commander-search-input")?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

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

  async function openCommandDetail(document: SearchDocument | null): Promise<void> {
    if (document?.kind !== "command" || !document.commandId) {
      return;
    }

    setPlane("command-detail");
    setCommandForm(null);
    setCommandArgsText("");
    setCommandFlags([]);
    setExecutionOutput("");
    const form = await workbench.inspectCommand(document.commandId);
    setCommandForm(form);
  }

  function backToList(): void {
    setPlane("list");
    setExecutionOutput("");
    window.requestAnimationFrame(() => {
      document.getElementById("commander-search-input")?.focus();
    });
  }

  async function runDetailCommand(): Promise<void> {
    if (!commandForm) {
      return;
    }

    const result = await workbench.runCommandById(
      commandForm.command.id,
      splitArgs(commandArgsText),
      commandFlags,
    );

    if (result) {
      setExecutionOutput(
        [result.executed, result.stdout, result.stderr].filter(Boolean).join("\n\n"),
      );
    }
  }

  function addDetailCommandToPipeline(): void {
    if (!commandForm) {
      return;
    }

    workbench.addCommandToPipelineDraft(
      commandForm.command.id,
      splitArgs(commandArgsText),
      commandFlags,
      commandForm.command.label,
    );
    onRequestMainWindow?.();
    onOpenChange(false);
  }

  async function runPrimaryAction(document: SearchDocument | null): Promise<void> {
    if (!document) {
      return;
    }

    if (document.kind === "command") {
      await openCommandDetail(document);
      return;
    }

    if (document.kind === "pipeline" && document.pipelineName) {
      workbench.setSelectedView("pipelines");
      await workbench.runPipelineByName(document.pipelineName);
      onRequestMainWindow?.();
      onOpenChange(false);
      return;
    }

    if (document.kind === "script" && document.commandValue) {
      workbench.stageProcessCommand(document.commandValue);
      onRequestMainWindow?.();
      onOpenChange(false);
      return;
    }

    if (document.kind === "project") {
      const repository = workbench.repositories.find(
        (entry) => entry.id === document.projectId || entry.path === document.path,
      );

      if (repository) {
        await workbench.selectRepository(repository);
        onRequestMainWindow?.();
        onOpenChange(false);
      }
      return;
    }

    if (document.kind === "process" && document.processId) {
      workbench.setSelectedProcessId(document.processId);
      workbench.setSelectedView("processes");
      onRequestMainWindow?.();
      onOpenChange(false);
    }
  }

  return (
    <Command
      shouldFilter={false}
      loop
      value={selectedDocument?.id ?? ""}
      onValueChange={(value) => {
        setSelectedDocumentId(value);
      }}
      className="h-auto! max-h-none min-h-0 overflow-hidden rounded-[inherit] border-0 bg-transparent p-0 text-popover-foreground shadow-none ring-0"
    >
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: -10, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.18, ease: commanderEase }}
        className="flex min-h-0 flex-col"
      >
        <AnimatePresence initial={false} mode="wait">
          {plane === "list" ? (
            <motion.div
              key="commander-list"
              initial={reducedMotion ? false : { opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
              transition={{ duration: reducedMotion ? 0 : 0.18, ease: commanderEase }}
              className="flex min-h-0 flex-col"
            >
              <CommanderSearchInput searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
              <CommandList className="h-[min(62vh,34rem)] max-h-none px-3 py-2">
                <CommandEmpty>No results found.</CommandEmpty>
                <AnimatePresence initial={false}>
                  {groups.map((group) => (
                    <motion.div
                      key={group.id}
                      layout={reducedMotion ? false : "position"}
                      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                      transition={{ duration: reducedMotion ? 0 : 0.14, ease: commanderEase }}
                    >
                      <CommandGroup
                        heading={group.label}
                        className="p-0 pb-2 **:[[cmdk-group-heading]]:px-1 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:tracking-normal **:[[cmdk-group-heading]]:text-muted-foreground"
                      >
                        {group.documents.map((document) => (
                          <CommanderRow
                            key={document.id}
                            document={document}
                            reducedMotion={reducedMotion}
                            selected={selectedDocument?.id === document.id}
                            onSelect={() => setSelectedDocumentId(document.id)}
                            onRun={() => void runPrimaryAction(document)}
                          />
                        ))}
                      </CommandGroup>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CommandList>
              <CommanderFooter
                document={selectedDocument}
                reducedMotion={reducedMotion}
                onPrimaryAction={() => void runPrimaryAction(selectedDocument)}
              />
            </motion.div>
          ) : (
            <CommanderCommandDetail
              commandArgsText={commandArgsText}
              commandFlags={commandFlags}
              commandForm={commandForm}
              executionOutput={executionOutput}
              reducedMotion={reducedMotion}
              onAddToPipeline={addDetailCommandToPipeline}
              onBack={backToList}
              onRun={() => void runDetailCommand()}
              setCommandArgsText={setCommandArgsText}
              setCommandFlags={setCommandFlags}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </Command>
  );
}
