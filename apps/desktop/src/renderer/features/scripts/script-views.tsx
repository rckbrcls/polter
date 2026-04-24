import { useMemo, useState, type JSX } from "react";
import {
  ArrowLeftIcon,
  FileCode2Icon,
  FolderCodeIcon,
  PackageIcon,
  PlusIcon,
  SaveIcon,
  SendIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EmptyState, OutputPanel } from "../shared/components.js";
import type { Workbench } from "../workbench/use-workbench.js";
import {
  buildScriptLibrary,
  createCustomScript,
  createStageTarget,
  filterScriptLibraryItems,
  scriptLanguageLabels,
  scriptSourceLabels,
  type ScriptLanguage,
  type ScriptLibraryItem,
  type ScriptSource,
} from "./script-library-model.js";

type ScriptsMode = "list" | "editor";

const scriptSources: ScriptSource[] = ["custom", "package", "template"];

function ScriptSourceIcon({ source }: { source: ScriptSource }): JSX.Element {
  switch (source) {
    case "custom":
      return <FolderCodeIcon className="size-4 shrink-0" />;
    case "package":
      return <PackageIcon className="size-4 shrink-0" />;
    case "template":
      return <FileCode2Icon className="size-4 shrink-0" />;
    default:
      return <FileCode2Icon className="size-4 shrink-0" />;
  }
}

function getRowAction(script: ScriptLibraryItem): string {
  switch (script.source) {
    case "custom":
      return "Edit";
    case "package":
      return "Stage in Processes";
    case "template":
      return "Duplicate";
    default:
      return "Open";
  }
}

export function ScriptRow({
  script,
  onSelect,
}: {
  script: ScriptLibraryItem;
  onSelect: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      className="grid gap-1 rounded-2xl border border-border/60 bg-background/50 px-3 py-3 text-left outline-hidden transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onSelect}
    >
      <span className="flex min-w-0 items-center gap-2">
        <ScriptSourceIcon source={script.source} />
        <span className="truncate text-sm font-medium">{script.name}</span>
        <Badge variant="outline" className="ml-auto shrink-0">
          {scriptLanguageLabels[script.language]}
        </Badge>
      </span>
      <span className="truncate text-xs text-muted-foreground">{script.description}</span>
      <span className="flex min-w-0 items-center gap-2">
        <code className="truncate font-mono text-xs text-muted-foreground">{script.path}</code>
        <span className="ml-auto shrink-0 text-xs font-medium text-muted-foreground">
          {getRowAction(script)}
        </span>
      </span>
    </button>
  );
}

function createNewCustomScript(
  workspaceRoot: string,
  language: ScriptLanguage,
): ScriptLibraryItem {
  const name = language === "python" ? "New Python Script" : "New Shell Script";

  return createCustomScript({
    id: `custom:${Date.now()}`,
    name,
    description: "Draft workspace script.",
    language,
    repoName: "Root workspace",
    repoPath: workspaceRoot,
    body: language === "python" ? "print('Hello from Polter')" : "echo \"Hello from Polter\"",
  });
}

export function ScriptEditor({
  onBack,
  onSave,
  onStage,
  script,
}: {
  onBack: () => void;
  onSave: (script: ScriptLibraryItem) => void;
  onStage: (script: ScriptLibraryItem) => void;
  script: ScriptLibraryItem;
}): JSX.Element {
  const [draftName, setDraftName] = useState(script.name);
  const [draftDescription, setDraftDescription] = useState(script.description);
  const [draftLanguage, setDraftLanguage] = useState<ScriptLanguage>(script.language);
  const [draftBody, setDraftBody] = useState(script.body);
  const editableScript = createCustomScript({
    id: script.id,
    name: draftName,
    description: draftDescription,
    language: draftLanguage,
    repoName: script.repoName,
    repoPath: script.repoPath,
    body: draftBody,
    templateId: script.templateId,
  });
  const stageTarget = createStageTarget(editableScript);

  return (
    <div className="grid max-w-5xl gap-6" aria-label="Script editor">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          <ArrowLeftIcon className="size-4" />
          Back
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => onStage(editableScript)}>
            <SendIcon className="size-4" />
            Stage in Processes
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => onSave(editableScript)}>
            <SaveIcon className="size-4" />
            Save mock script
          </Button>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(14rem,0.8fr)_minmax(18rem,1fr)_12rem]">
          <div className="grid gap-2">
            <Label htmlFor="script-name">Name</Label>
            <Input
              id="script-name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="script-description">Description</Label>
            <Input
              id="script-description"
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="script-language">Language</Label>
            <Select
              value={draftLanguage}
              onValueChange={(value) => setDraftLanguage(value as ScriptLanguage)}
            >
              <SelectTrigger id="script-language" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shell">Shell</SelectItem>
                <SelectItem value="python">Python</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 border-t border-border/60 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
          <div className="grid gap-2">
            <Label htmlFor="script-body">Body</Label>
            <Textarea
              id="script-body"
              className="min-h-80 font-mono text-xs leading-5"
              value={draftBody}
              onChange={(event) => setDraftBody(event.target.value)}
            />
          </div>

          <div className="grid content-start gap-4">
            <OutputPanel
              label="Command"
              value={stageTarget.commandLine}
              placeholder="No command selected."
              className="h-24"
            />
            <div className="grid gap-1">
              <Label>Path</Label>
              <code className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 font-mono text-xs text-muted-foreground">
                {editableScript.path}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScriptsView({ workbench }: { workbench: Workbench }): JSX.Element {
  const [selectedSource, setSelectedSource] = useState<ScriptSource>("custom");
  const [mode, setMode] = useState<ScriptsMode>("list");
  const [editingScript, setEditingScript] = useState<ScriptLibraryItem | null>(null);
  const scripts = useMemo(
    () =>
      buildScriptLibrary({
        customScripts: workbench.customScripts,
        templates: workbench.scriptTemplates,
        workspace: workbench.workspace,
      }),
    [workbench.customScripts, workbench.scriptTemplates, workbench.workspace],
  );
  const visibleScripts = useMemo(
    () => filterScriptLibraryItems(scripts, selectedSource),
    [scripts, selectedSource],
  );
  const sourceCounts = useMemo(
    () =>
      Object.fromEntries(
        scriptSources.map((source) => [
          source,
          filterScriptLibraryItems(scripts, source).length,
        ]),
      ) as Record<ScriptSource, number>,
    [scripts],
  );

  if (!workbench.workspace) {
    return (
      <EmptyState
        title="No workspace loaded"
        description="Load a workspace before preparing scripts."
      />
    );
  }

  async function createScript(language: ScriptLanguage): Promise<void> {
    const script = await workbench.saveCustomScript(
      createNewCustomScript(workbench.workspace!.root, language),
    );

    if (!script) {
      return;
    }

    setSelectedSource("custom");
    setEditingScript(script);
    setMode("editor");
  }

  async function duplicateTemplate(script: ScriptLibraryItem): Promise<void> {
    if (!script.templateId) {
      return;
    }

    const duplicated = await workbench.duplicateScriptTemplate(script.templateId);
    if (!duplicated) {
      return;
    }

    setSelectedSource("custom");
    setEditingScript(duplicated);
    setMode("editor");
  }

  async function saveScript(script: ScriptLibraryItem): Promise<void> {
    const saved = await workbench.saveCustomScript(script);
    if (saved) {
      setEditingScript(saved);
    }
  }

  function stageScript(script: ScriptLibraryItem): void {
    workbench.stageProcessCommand(createStageTarget(script).commandLine);
  }

  function handleScriptSelect(script: ScriptLibraryItem): void {
    if (script.source === "custom") {
      setEditingScript(script);
      setMode("editor");
      return;
    }

    if (script.source === "template") {
      void duplicateTemplate(script);
      return;
    }

    stageScript(script);
  }

  if (mode === "editor" && editingScript) {
    return (
      <ScriptEditor
        key={editingScript.id}
        script={editingScript}
        onBack={() => setMode("list")}
        onSave={(script) => void saveScript(script)}
        onStage={stageScript}
      />
    );
  }

  return (
    <div className="grid gap-4" aria-label="Script library">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-3 gap-1 rounded-3xl border border-border/60 bg-muted/20 p-1 lg:min-w-[28rem]">
          {scriptSources.map((source) => (
            <button
              key={source}
              type="button"
              className={cn(
                "flex h-9 min-w-0 items-center justify-center gap-1 rounded-2xl px-2 text-sm transition-colors",
                selectedSource === source
                  ? "bg-background font-medium text-foreground"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
              )}
              onClick={() => setSelectedSource(source)}
            >
              <span className="truncate">{scriptSourceLabels[source]}</span>
              <Badge variant="outline" className="h-5 min-w-5 px-1 text-xs">
                {sourceCounts[source]}
              </Badge>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void createScript("shell")}>
            <PlusIcon className="size-4" />
            New Shell
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => void createScript("python")}>
            <PlusIcon className="size-4" />
            New Python
          </Button>
        </div>
      </div>

      {visibleScripts.length ? (
        <div className="grid gap-2">
          {visibleScripts.map((script) => (
            <ScriptRow
              key={script.id}
              script={script}
              onSelect={() => handleScriptSelect(script)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No scripts"
          description="Create a custom script or duplicate a template to start the library."
        />
      )}
    </div>
  );
}
