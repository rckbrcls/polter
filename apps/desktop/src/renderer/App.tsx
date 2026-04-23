import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import type { JSX } from "react";
import type {
  CommandDef,
  DesktopAppInfo,
  DesktopCommandForm,
  DesktopCommandRunResult,
  DesktopDeclarativeApplyResult,
  DesktopDeclarativePlan,
  DesktopPins,
  DesktopSkillPreview,
  DesktopToolStatusSnapshot,
  DesktopWorkspaceSnapshot,
  Feature,
  McpStatusInfo,
  Pipeline,
  PipelineSource,
  PipelineWithSource,
  ProcessInfo,
  ProcessOutput,
  ProjectConfig,
  StatusResult,
} from "@polterware/core";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircleIcon,
  AppWindowIcon,
  BlocksIcon,
  BracesIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  CommandIcon,
  HammerIcon,
  PinIcon,
  PlayIcon,
  RefreshCcwIcon,
  Settings2Icon,
  SparklesIcon,
  WrenchIcon,
  WorkflowIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { buildSidebarSections, type SidebarViewId } from "./navigation.js";

const FEATURE_LIST_HEIGHT = "h-[32rem]";
const OUTPUT_HEIGHT = "h-[24rem]";

function splitArgs(raw: string): string[] {
  return raw.trim().split(/\s+/).filter(Boolean);
}

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function domSafeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function getCommandValue(command: CommandDef): string {
  if (command.tool === "supabase") {
    return command.base.join(" ");
  }
  return `${command.tool}:${command.base.join(" ")}`;
}

function isFlagToken(token: string): boolean {
  return token.startsWith("-");
}

function resolvePinnedRun(
  runCommand: string,
  commands: CommandDef[],
): { commandId: string; args: string[]; flags: string[] } | undefined {
  const ordered = [...commands].sort(
    (left, right) => getCommandValue(right).length - getCommandValue(left).length,
  );

  for (const command of ordered) {
    const base = getCommandValue(command);
    if (!runCommand.startsWith(base)) {
      continue;
    }
    const remainder = runCommand.slice(base.length).trim();
    const tokens = splitArgs(remainder);
    return {
      commandId: command.id,
      args: tokens.filter((token) => !isFlagToken(token)),
      flags: tokens.filter(isFlagToken),
    };
  }

  return undefined;
}

function createEmptyPipeline(): Pipeline {
  return {
    id: "",
    name: "",
    description: "",
    steps: [],
    createdAt: "",
    updatedAt: "",
  };
}

function getViewIcon(viewId: SidebarViewId): LucideIcon {
  if (viewId.startsWith("feature:")) {
    return CommandIcon;
  }

  switch (viewId) {
    case "pipelines":
      return WorkflowIcon;
    case "pinned":
      return PinIcon;
    case "processes":
      return PlayIcon;
    case "scripts":
      return BracesIcon;
    case "infrastructure":
      return HammerIcon;
    case "tool-status":
      return WrenchIcon;
    case "project-config":
      return BracesIcon;
    case "mcp":
      return BlocksIcon;
    case "skills":
      return SparklesIcon;
    case "settings":
      return Settings2Icon;
    default:
      return AppWindowIcon;
  }
}

function SurfaceCard({
  className,
  ...props
}: React.ComponentProps<typeof Card>): JSX.Element {
  return (
    <Card
      className={cn("border border-border/60 bg-card/90 shadow-none backdrop-blur-sm", className)}
      {...props}
    />
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}): JSX.Element {
  return (
    <Empty className="min-h-[14rem] rounded-[1.75rem] border-border/60 bg-muted/10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleDotIcon className="size-4" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function OutputPanel({
  label,
  value,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  placeholder: string;
  className?: string;
}): JSX.Element {
  return (
    <div className="grid gap-2">
      <Label className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </Label>
      <ScrollArea
        className={cn(
          "rounded-[1.5rem] border border-border/60 bg-muted/20",
          OUTPUT_HEIGHT,
          className,
        )}
      >
        <pre className="p-4 font-mono text-xs leading-6 whitespace-pre-wrap text-foreground/90">
          {value || placeholder}
        </pre>
      </ScrollArea>
    </div>
  );
}

function AppField({
  id,
  label,
  description,
  children,
  className,
}: {
  id: string;
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {children}
    </Field>
  );
}

export function App(): JSX.Element {
  const [appInfo, setAppInfo] = useState<DesktopAppInfo | null>(null);
  const [cwd, setCwd] = useState("");
  const [cwdDraft, setCwdDraft] = useState("");
  const [features, setFeatures] = useState<Feature[]>([]);
  const [allCommands, setAllCommands] = useState<CommandDef[]>([]);
  const [pins, setPins] = useState<DesktopPins>({ commandPins: [], runPins: [] });
  const [pipelines, setPipelines] = useState<PipelineWithSource[]>([]);
  const [workspace, setWorkspace] = useState<DesktopWorkspaceSnapshot | null>(null);
  const [toolStatus, setToolStatus] = useState<DesktopToolStatusSnapshot | null>(null);
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | undefined>();
  const [projectConfigText, setProjectConfigText] = useState("{}");
  const [declarativeStatus, setDeclarativeStatus] = useState<StatusResult | null>(null);
  const [declarativePlan, setDeclarativePlan] = useState<DesktopDeclarativePlan | null>(null);
  const [declarativeApplyResult, setDeclarativeApplyResult] =
    useState<DesktopDeclarativeApplyResult | null>(null);
  const [mcpStatus, setMcpStatus] = useState<McpStatusInfo | null>(null);
  const [skillPreview, setSkillPreview] = useState<DesktopSkillPreview | null>(null);
  const [selectedView, setSelectedView] = useState<SidebarViewId>("pipelines");
  const [selectedCommandId, setSelectedCommandId] = useState("");
  const [commandForm, setCommandForm] = useState<DesktopCommandForm | null>(null);
  const [commandArgsText, setCommandArgsText] = useState("");
  const [commandFlags, setCommandFlags] = useState<string[]>([]);
  const [commandResult, setCommandResult] = useState<DesktopCommandRunResult | null>(null);
  const [pipelineDraft, setPipelineDraft] = useState<Pipeline>(createEmptyPipeline());
  const [pipelineSource, setPipelineSource] = useState<PipelineSource>("project");
  const [stepCommandId, setStepCommandId] = useState("");
  const [stepArgsText, setStepArgsText] = useState("");
  const [stepFlagsText, setStepFlagsText] = useState("");
  const [stepLabel, setStepLabel] = useState("");
  const [stepContinueOnError, setStepContinueOnError] = useState(false);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState("");
  const [processLogs, setProcessLogs] = useState<ProcessOutput | null>(null);
  const [processCommand, setProcessCommand] = useState("");
  const [processArgsText, setProcessArgsText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const deferredProcessOutput = useDeferredValue(
    processLogs ? [...processLogs.stdout, ...processLogs.stderr].join("\n") : "",
  );
  const deferredCommandOutput = useDeferredValue(
    commandResult ? [commandResult.stdout, commandResult.stderr].filter(Boolean).join("\n") : "",
  );

  const featureMap = useMemo(
    () => new Map(features.map((feature) => [feature.id, feature])),
    [features],
  );
  const selectedFeature = selectedView.startsWith("feature:")
    ? featureMap.get(selectedView.replace("feature:", ""))
    : undefined;
  const selectedFeatureCommands = selectedFeature?.commands ?? [];
  const sidebarSections = buildSidebarSections(features);
  const allSidebarItems = useMemo(
    () => sidebarSections.flatMap((section) => section.items),
    [sidebarSections],
  );
  const currentSidebarItem = allSidebarItems.find((item) => item.id === selectedView);
  const currentViewLabel = selectedView.startsWith("feature:")
    ? selectedFeature?.label ?? "Commands"
    : currentSidebarItem?.label ?? "Desktop";

  const currentViewSummary = useMemo(() => {
    if (selectedView.startsWith("feature:")) {
      return selectedFeature
        ? `${selectedFeature.commands.length} commands available for this feature.`
        : "Command feature loading.";
    }

    switch (selectedView) {
      case "pipelines":
        return "Project and global pipelines backed by the shared Polter stores.";
      case "pinned":
        return "Reusable pinned command bases and exact run signatures.";
      case "processes":
        return "Tracked background processes and live log capture.";
      case "scripts":
        return "Scripts discovered across the current workspace and child repos.";
      case "tool-status":
        return "Installed toolchain and linkage status for the active workspace.";
      case "project-config":
        return "Direct editor for the shared project config structure.";
      case "infrastructure":
        return "Declarative status, planning, and apply outputs from the real core services.";
      case "mcp":
        return "Project, local, and user registrations for the Polter MCP server.";
      case "skills":
        return "Shared skill preview and install surface for Claude Code.";
      case "settings":
        return "Workspace switching and desktop shell metadata.";
      default:
        return "Desktop surface powered by the shared Polter core.";
    }
  }, [selectedFeature, selectedView]);

  const currentViewCount = useMemo(() => {
    switch (selectedView) {
      case "pipelines":
        return pipelines.length || undefined;
      case "pinned": {
        const total = pins.commandPins.length + pins.runPins.length;
        return total || undefined;
      }
      case "processes":
        return processes.length || undefined;
      case "scripts": {
        const total =
          (workspace?.rootScripts.length ?? 0) +
          (workspace?.childRepos.reduce((count, repo) => count + repo.scripts.length, 0) ?? 0);
        return total || undefined;
      }
      case "tool-status":
        return toolStatus?.tools.length || undefined;
      case "mcp":
        return mcpStatus?.scopes.filter((scope) => scope.registered).length || undefined;
      case "skills":
        return skillPreview ? 1 : undefined;
      case "settings":
        return appInfo ? 1 : undefined;
      default:
        if (selectedView.startsWith("feature:")) {
          return selectedFeature?.commands.length || undefined;
        }
        return undefined;
    }
  }, [
    appInfo,
    mcpStatus,
    pins.commandPins.length,
    pins.runPins.length,
    pipelines.length,
    processes.length,
    selectedFeature,
    selectedView,
    skillPreview,
    toolStatus,
    workspace,
  ]);

  const loadProcessState = useEffectEvent(async () => {
    if (!cwd) {
      return;
    }

    const nextProcesses = await window.polter.processes.list(cwd);
    setProcesses(nextProcesses);

    const nextSelectedId = selectedProcessId || nextProcesses[0]?.id || "";
    if (!selectedProcessId && nextSelectedId) {
      setSelectedProcessId(nextSelectedId);
    }

    if (nextSelectedId) {
      const logs = await window.polter.processes.logs(nextSelectedId, 200);
      setProcessLogs(logs);
    } else {
      setProcessLogs(null);
    }
  });

  async function loadShellState(nextCwd?: string) {
    const targetCwd = (nextCwd ?? cwd) || undefined;
    setError("");

    try {
      const [
        nextAppInfo,
        nextFeatures,
        nextCommands,
        nextPins,
        nextPipelines,
        nextWorkspace,
        nextToolStatus,
        nextConfig,
        nextDeclarativeStatus,
        nextDeclarativePlan,
        nextMcpStatus,
        nextSkillPreview,
      ] = await Promise.all([
        window.polter.app.getInfo(targetCwd),
        window.polter.commands.listFeatures(),
        window.polter.commands.listAll(),
        window.polter.commands.getPins(),
        window.polter.pipelines.list(targetCwd),
        window.polter.workspace.snapshot(targetCwd),
        window.polter.status.getTools(targetCwd),
        window.polter.config.read(targetCwd),
        window.polter.declarative.status(targetCwd),
        window.polter.declarative.plan(targetCwd),
        window.polter.mcp.status(),
        window.polter.skills.preview(),
      ]);

      setAppInfo(nextAppInfo);
      setCwd(nextAppInfo.cwd);
      setCwdDraft(nextAppInfo.cwd);
      setFeatures(nextFeatures);
      setAllCommands(nextCommands);
      setPins(nextPins);
      setPipelines(nextPipelines);
      setWorkspace(nextWorkspace);
      setToolStatus(nextToolStatus);
      setProjectConfig(nextConfig);
      setProjectConfigText(nextConfig ? stringify(nextConfig) : "{}");
      setDeclarativeStatus(nextDeclarativeStatus);
      setDeclarativePlan(nextDeclarativePlan);
      setMcpStatus(nextMcpStatus);
      setSkillPreview(nextSkillPreview);

      const firstFeature = nextFeatures[0];
      if (!selectedView && firstFeature) {
        setSelectedView(`feature:${firstFeature.id}`);
      }
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }

  useEffect(() => {
    void loadShellState();
  }, []);

  useEffect(() => {
    if (!selectedFeatureCommands.length) {
      return;
    }

    if (
      !selectedCommandId ||
      !selectedFeatureCommands.some((command) => command.id === selectedCommandId)
    ) {
      setSelectedCommandId(selectedFeatureCommands[0]!.id);
    }
  }, [selectedFeatureCommands, selectedCommandId]);

  useEffect(() => {
    if (!selectedCommandId) {
      setCommandForm(null);
      return;
    }

    void window.polter.commands.getForm(selectedCommandId).then((form) => {
      setCommandForm(form);
      setCommandFlags([]);
    });
  }, [selectedCommandId]);

  useEffect(() => {
    if (selectedView !== "processes") {
      return;
    }

    void loadProcessState();
    const timer = window.setInterval(() => {
      void loadProcessState();
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [selectedView, selectedProcessId, cwd, loadProcessState]);

  async function runSelectedCommand() {
    if (!commandForm) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const result = await window.polter.commands.run({
        commandId: commandForm.command.id,
        cwd,
        args: splitArgs(commandArgsText),
        flags: commandFlags,
      });

      setCommandResult(result);
      setMessage(result.success ? "Command completed." : "Command finished with errors.");
    } catch (commandError) {
      setError((commandError as Error).message);
    }
  }

  async function toggleCommandPin() {
    if (!commandForm) {
      return;
    }
    setPins(await window.polter.commands.toggleCommandPin(commandForm.commandValue));
  }

  async function toggleRunPin() {
    if (!commandForm) {
      return;
    }
    const runCommand = [commandForm.commandValue, ...splitArgs(commandArgsText), ...commandFlags]
      .filter(Boolean)
      .join(" ");
    setPins(await window.polter.commands.toggleRunPin(runCommand));
  }

  async function savePipelineDraft() {
    setError("");
    try {
      const savedPipeline = await window.polter.pipelines.save(pipelineDraft, pipelineSource, cwd);
      setPipelineDraft(savedPipeline);
      setPipelines(await window.polter.pipelines.list(cwd));
      setMessage(`Saved pipeline "${savedPipeline.name}".`);
    } catch (pipelineError) {
      setError((pipelineError as Error).message);
    }
  }

  async function runPipelineByName(name: string) {
    try {
      const result = await window.polter.pipelines.run(name, cwd);
      setMessage(`Ran pipeline "${name}".`);
      setCommandResult({
        commandId: `pipeline:${name}`,
        commandValue: name,
        executed: `pipeline run ${name}`,
        success: Boolean((result as { success?: boolean }).success),
        exitCode: (result as { success?: boolean }).success ? 0 : 1,
        stdout: stringify(result),
        stderr: "",
      });
    } catch (pipelineError) {
      setError((pipelineError as Error).message);
    }
  }

  async function removePipeline(pipeline: PipelineWithSource) {
    await window.polter.pipelines.remove(pipeline.id, pipeline.source, cwd);
    setPipelines(await window.polter.pipelines.list(cwd));
    setMessage(`Removed pipeline "${pipeline.name}".`);
  }

  function addPipelineStep() {
    if (!stepCommandId) {
      return;
    }

    const nextStep = {
      id: `step-${pipelineDraft.steps.length + 1}`,
      commandId: stepCommandId,
      args: splitArgs(stepArgsText),
      flags: splitArgs(stepFlagsText),
      continueOnError: stepContinueOnError,
      label: stepLabel || undefined,
    };

    setPipelineDraft((current) => ({
      ...current,
      steps: [...current.steps, nextStep],
    }));
    setStepArgsText("");
    setStepFlagsText("");
    setStepLabel("");
    setStepContinueOnError(false);
  }

  async function saveProjectConfigDraft() {
    try {
      const parsed = JSON.parse(projectConfigText) as ProjectConfig;
      const saved = await window.polter.config.write(parsed, cwd);
      if (!saved) {
        setError("Project config could not be saved for the current workspace.");
        return;
      }
      setProjectConfig(parsed);
      setMessage("Project config saved.");
    } catch (configError) {
      setError(`Invalid project config JSON: ${(configError as Error).message}`);
    }
  }

  async function refreshInfrastructure() {
    setDeclarativeStatus(await window.polter.declarative.status(cwd));
    setDeclarativePlan(await window.polter.declarative.plan(cwd));
    setMessage("Infrastructure snapshot refreshed.");
  }

  async function applyInfrastructure() {
    try {
      const result = await window.polter.declarative.apply(cwd);
      setDeclarativeApplyResult(result);
      setMessage("Declarative apply finished.");
      await refreshInfrastructure();
    } catch (applyError) {
      setError((applyError as Error).message);
    }
  }

  async function runWorkspaceScript(repoPath: string, script: string) {
    try {
      await window.polter.workspace.runScript(repoPath, script, []);
      setSelectedView("processes");
      await loadProcessState();
      setMessage(`Started ${script} in ${repoPath}.`);
    } catch (scriptError) {
      setError((scriptError as Error).message);
    }
  }

  async function startManualProcess() {
    try {
      await window.polter.processes.start(processCommand, splitArgs(processArgsText), cwd);
      setProcessCommand("");
      setProcessArgsText("");
      await loadProcessState();
      setMessage("Background process started.");
    } catch (processError) {
      setError((processError as Error).message);
    }
  }

  async function stopSelectedProcess(id: string) {
    await window.polter.processes.stop(id);
    await loadProcessState();
  }

  async function removeSelectedProcess(id: string) {
    await window.polter.processes.remove(id);
    await loadProcessState();
  }

  async function runPinnedCommand(commandValue: string) {
    const command = allCommands.find((entry) => getCommandValue(entry) === commandValue);
    if (!command) {
      setError(`Pinned command not found in catalog: ${commandValue}`);
      return;
    }

    setSelectedView(
      `feature:${
        features.find((feature) => feature.commands.some((item) => item.id === command.id))?.id ??
        "database"
      }`,
    );
    setSelectedCommandId(command.id);
    setCommandArgsText("");
    setCommandFlags([]);
    const result = await window.polter.commands.run({
      commandId: command.id,
      cwd,
      args: [],
      flags: [],
    });
    setCommandResult(result);
  }

  async function runPinnedRun(runCommand: string) {
    const match = resolvePinnedRun(runCommand, allCommands);
    if (!match) {
      setError(`Pinned run could not be resolved: ${runCommand}`);
      return;
    }

    const command = allCommands.find((entry) => entry.id === match.commandId);
    if (!command) {
      setError(`Pinned run command is no longer available: ${runCommand}`);
      return;
    }

    setSelectedView(
      `feature:${
        features.find((feature) => feature.commands.some((item) => item.id === command.id))?.id ??
        "database"
      }`,
    );
    setSelectedCommandId(command.id);
    setCommandArgsText(match.args.join(" "));
    setCommandFlags(match.flags);

    const result = await window.polter.commands.run({
      commandId: match.commandId,
      cwd,
      args: match.args,
      flags: match.flags,
    });
    setCommandResult(result);
  }

  async function installMcp(scope: "local" | "project" | "user") {
    const result = await window.polter.mcp.install(scope);
    setMessage(result.message);
    setMcpStatus(await window.polter.mcp.status());
  }

  async function removeMcp(scope: "local" | "project" | "user") {
    const result = await window.polter.mcp.remove(scope);
    setMessage(result.message);
    setMcpStatus(await window.polter.mcp.status());
  }

  async function setupSkill() {
    const result = await window.polter.skills.setup();
    setMessage(`Skill ${result.status}.`);
    setSkillPreview(await window.polter.skills.preview());
  }

  function getSidebarBadge(viewId: SidebarViewId): string | undefined {
    if (viewId.startsWith("feature:")) {
      const feature = featureMap.get(viewId.replace("feature:", ""));
      return feature?.commands.length ? String(feature.commands.length) : undefined;
    }

    switch (viewId) {
      case "pipelines":
        return pipelines.length ? String(pipelines.length) : undefined;
      case "pinned": {
        const total = pins.commandPins.length + pins.runPins.length;
        return total ? String(total) : undefined;
      }
      case "processes":
        return processes.length ? String(processes.length) : undefined;
      case "scripts": {
        const total =
          (workspace?.rootScripts.length ?? 0) +
          (workspace?.childRepos.reduce((count, repo) => count + repo.scripts.length, 0) ?? 0);
        return total ? String(total) : undefined;
      }
      case "tool-status":
        return toolStatus?.tools.length ? String(toolStatus.tools.length) : undefined;
      case "mcp": {
        const total = mcpStatus?.scopes.filter((scope) => scope.registered).length ?? 0;
        return total ? String(total) : undefined;
      }
      default:
        return undefined;
    }
  }

  function renderFeatureView() {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <SurfaceCard className="overflow-hidden">
          <CardHeader className="border-b border-border/50">
            <CardTitle>{selectedFeature?.label ?? "Commands"}</CardTitle>
            <CardDescription>
              {selectedFeature?.commands.length ?? 0} commands available.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">{selectedFeatureCommands.length}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-6">
            {selectedFeatureCommands.length ? (
              <ScrollArea className={FEATURE_LIST_HEIGHT}>
                <div className="grid gap-3 pr-3">
                  {selectedFeatureCommands.map((command) => {
                    const commandValue = getCommandValue(command);
                    const active = selectedCommandId === command.id;
                    return (
                      <Button
                        key={command.id}
                        variant="ghost"
                        className={cn(
                          "h-auto w-full flex-col items-start gap-1 rounded-[1.5rem] border px-4 py-4 text-left whitespace-normal",
                          active
                            ? "border-primary/35 bg-primary/10 text-foreground hover:bg-primary/10"
                            : "border-border/60 bg-background/40 hover:bg-muted/40",
                        )}
                        onClick={() => {
                          setSelectedCommandId(command.id);
                          setCommandArgsText("");
                          setCommandFlags([]);
                        }}
                      >
                        <span className="font-medium">{command.label}</span>
                        <span className="text-xs text-muted-foreground">{commandValue}</span>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState
                title="No commands available"
                description="This feature has not exposed any command yet."
              />
            )}
          </CardContent>
        </SurfaceCard>

        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>{commandForm?.command.label ?? "Command details"}</CardTitle>
            <CardDescription>
              {commandForm?.command.hint ??
                "Choose a command to inspect arguments, flags, and output."}
            </CardDescription>
            {commandForm ? (
              <CardAction>
                <Badge variant="outline">{commandForm.commandValue}</Badge>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {commandForm ? (
              <>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => void toggleCommandPin()}>
                    <PinIcon className="size-4" />
                    {pins.commandPins.includes(commandForm.commandValue)
                      ? "Unpin command"
                      : "Pin command"}
                  </Button>
                  <Button variant="outline" onClick={() => void toggleRunPin()}>
                    <PinIcon className="size-4" />
                    Pin current run
                  </Button>
                </div>

                <FieldSet>
                  <Field>
                    <FieldLabel>Suggested args</FieldLabel>
                    {commandForm.suggestedArgs.length ? (
                      <div className="flex flex-wrap gap-2">
                        {commandForm.suggestedArgs.map((option) => (
                          <Button
                            key={option.value}
                            variant="outline"
                            size="sm"
                            onClick={() => setCommandArgsText(option.args.join(" "))}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <FieldDescription>
                        This command does not expose suggested argument sets.
                      </FieldDescription>
                    )}
                  </Field>

                  <AppField
                    id="command-args"
                    label="Arguments"
                    description="Arguments are split on whitespace before execution."
                  >
                    <Input
                      id="command-args"
                      value={commandArgsText}
                      onChange={(event) => setCommandArgsText(event.target.value)}
                    />
                  </AppField>

                  <Field>
                    <FieldLabel>Flags</FieldLabel>
                    {commandForm.flags.length ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {commandForm.flags.map((flag) => {
                          const flagId = `command-flag-${domSafeId(flag.value)}`;
                          const checked = commandFlags.includes(flag.value);

                          return (
                            <div
                              key={flag.value}
                              className="flex items-start gap-3 rounded-[1.25rem] border border-border/60 bg-muted/20 px-4 py-3"
                            >
                              <Checkbox
                                id={flagId}
                                checked={checked}
                                onCheckedChange={(nextChecked) => {
                                  setCommandFlags((current) =>
                                    nextChecked
                                      ? [...current, flag.value]
                                      : current.filter((item) => item !== flag.value),
                                  );
                                }}
                              />
                              <div className="grid gap-1">
                                <Label htmlFor={flagId} className="cursor-pointer text-sm font-medium">
                                  {flag.label}
                                </Label>
                                <p className="text-xs text-muted-foreground">{flag.value}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <FieldDescription>No toggleable flags are available.</FieldDescription>
                    )}
                  </Field>
                </FieldSet>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => void runSelectedCommand()}>
                    <PlayIcon className="size-4" />
                    Run command
                  </Button>
                </div>

                <OutputPanel
                  label="Output"
                  value={deferredCommandOutput}
                  placeholder="No command has been executed yet."
                />
              </>
            ) : (
              <EmptyState
                title="Select a command"
                description="Choose a command from the list to preview arguments and run it."
              />
            )}
          </CardContent>
        </SurfaceCard>
      </div>
    );
  }

  function renderPinnedView() {
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>Pinned commands</CardTitle>
            <CardDescription>Reusable command bases stored in the shared Polter config.</CardDescription>
            <CardAction>
              <Badge variant="secondary">{pins.commandPins.length}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-6">
            {pins.commandPins.length ? (
              <ScrollArea className={FEATURE_LIST_HEIGHT}>
                <div className="grid gap-3 pr-3">
                  {pins.commandPins.map((commandValue) => (
                    <div
                      key={commandValue}
                      className="grid gap-3 rounded-[1.5rem] border border-border/60 bg-background/50 p-4"
                    >
                      <div className="grid gap-1">
                        <span className="font-medium">{commandValue}</span>
                        <p className="text-xs text-muted-foreground">
                          Run the saved command base with its default form.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => void runPinnedCommand(commandValue)}>
                          <PlayIcon className="size-4" />
                          Run
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void window.polter.commands.toggleCommandPin(commandValue).then(setPins)
                          }
                        >
                          Unpin
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState
                title="No pinned command bases"
                description="Pin a command from any feature to keep it here."
              />
            )}
          </CardContent>
        </SurfaceCard>

        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>Pinned runs</CardTitle>
            <CardDescription>Exact run signatures with arguments and flags preserved.</CardDescription>
            <CardAction>
              <Badge variant="secondary">{pins.runPins.length}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-6">
            {pins.runPins.length ? (
              <ScrollArea className={FEATURE_LIST_HEIGHT}>
                <div className="grid gap-3 pr-3">
                  {pins.runPins.map((runCommand) => (
                    <div
                      key={runCommand}
                      className="grid gap-3 rounded-[1.5rem] border border-border/60 bg-background/50 p-4"
                    >
                      <div className="grid gap-1">
                        <span className="font-medium">{runCommand}</span>
                        <p className="text-xs text-muted-foreground">
                          Replay the exact saved run signature.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => void runPinnedRun(runCommand)}>
                          <PlayIcon className="size-4" />
                          Run
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void window.polter.commands.toggleRunPin(runCommand).then(setPins)
                          }
                        >
                          Unpin
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState
                title="No pinned runs"
                description="Pin an exact command execution to keep it ready here."
              />
            )}
          </CardContent>
        </SurfaceCard>
      </div>
    );
  }

  function renderPipelinesView() {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <SurfaceCard className="overflow-hidden">
          <CardHeader className="border-b border-border/50">
            <CardTitle>Saved pipelines</CardTitle>
            <CardDescription>
              Project and global pipelines backed by the current Polter stores.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">{pipelines.length}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-6">
            {pipelines.length ? (
              <ScrollArea className={FEATURE_LIST_HEIGHT}>
                <div className="grid gap-3 pr-3">
                  {pipelines.map((pipeline) => (
                    <div
                      key={`${pipeline.source}:${pipeline.id}`}
                      className="grid gap-3 rounded-[1.5rem] border border-border/60 bg-background/50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="grid gap-1">
                          <span className="font-medium">{pipeline.name}</span>
                          <p className="text-xs text-muted-foreground">
                            {pipeline.description || "No description provided."}
                          </p>
                        </div>
                        <Badge variant="outline">{pipeline.source}</Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setPipelineDraft({
                              id: pipeline.id,
                              name: pipeline.name,
                              description: pipeline.description ?? "",
                              steps: pipeline.steps,
                              createdAt: pipeline.createdAt,
                              updatedAt: pipeline.updatedAt,
                            });
                            setPipelineSource(pipeline.source);
                          }}
                        >
                          Edit
                        </Button>
                        <Button size="sm" onClick={() => void runPipelineByName(pipeline.name)}>
                          <PlayIcon className="size-4" />
                          Run
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void removePipeline(pipeline)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState
                title="No saved pipelines"
                description="Create the first pipeline in the builder to persist it."
              />
            )}
          </CardContent>
        </SurfaceCard>

        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>Pipeline builder</CardTitle>
            <CardDescription>
              Create a real pipeline backed by the shared Polter storage format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <FieldGroup>
              <AppField id="pipeline-name" label="Name">
                <Input
                  id="pipeline-name"
                  value={pipelineDraft.name}
                  onChange={(event) =>
                    setPipelineDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </AppField>

              <AppField id="pipeline-description" label="Description">
                <Input
                  id="pipeline-description"
                  value={pipelineDraft.description ?? ""}
                  onChange={(event) =>
                    setPipelineDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </AppField>

              <AppField id="pipeline-source" label="Source">
                <Select
                  value={pipelineSource}
                  onValueChange={(value) => setPipelineSource(value as PipelineSource)}
                >
                  <SelectTrigger id="pipeline-source" className="w-full">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">project</SelectItem>
                    <SelectItem value="global">global</SelectItem>
                  </SelectContent>
                </Select>
              </AppField>
            </FieldGroup>

            <Separator />

            <div className="grid gap-4 rounded-[1.75rem] border border-border/60 bg-muted/15 p-5">
              <div className="grid gap-1">
                <h3 className="font-medium">Add step</h3>
                <p className="text-sm text-muted-foreground">
                  Each step preserves the existing pipeline schema.
                </p>
              </div>

              <FieldGroup className="grid gap-4 md:grid-cols-2">
                <AppField id="step-command" label="Command">
                  <Select value={stepCommandId} onValueChange={setStepCommandId}>
                    <SelectTrigger id="step-command" className="w-full">
                      <SelectValue placeholder="Select command" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCommands.map((command) => (
                        <SelectItem key={command.id} value={command.id}>
                          {command.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </AppField>

                <AppField id="step-label" label="Label">
                  <Input
                    id="step-label"
                    value={stepLabel}
                    onChange={(event) => setStepLabel(event.target.value)}
                  />
                </AppField>

                <AppField id="step-args" label="Args">
                  <Input
                    id="step-args"
                    value={stepArgsText}
                    onChange={(event) => setStepArgsText(event.target.value)}
                  />
                </AppField>

                <AppField id="step-flags" label="Flags">
                  <Input
                    id="step-flags"
                    value={stepFlagsText}
                    onChange={(event) => setStepFlagsText(event.target.value)}
                  />
                </AppField>
              </FieldGroup>

              <div className="flex items-start gap-3 rounded-[1.25rem] border border-border/60 bg-background/60 px-4 py-3">
                <Checkbox
                  id="step-continue-on-error"
                  checked={stepContinueOnError}
                  onCheckedChange={(checked) => setStepContinueOnError(Boolean(checked))}
                />
                <div className="grid gap-1">
                  <Label htmlFor="step-continue-on-error" className="cursor-pointer">
                    Continue on error
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Preserve the original pipeline behavior for this step.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={addPipelineStep}>
                  Add step
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="grid gap-1">
                  <h3 className="font-medium">Steps</h3>
                  <p className="text-sm text-muted-foreground">
                    Review the current draft before saving it.
                  </p>
                </div>
                <Badge variant="outline">{pipelineDraft.steps.length}</Badge>
              </div>

              {pipelineDraft.steps.length ? (
                <div className="grid gap-3">
                  {pipelineDraft.steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex flex-wrap items-start justify-between gap-4 rounded-[1.5rem] border border-border/60 bg-background/50 p-4"
                    >
                      <div className="grid gap-1">
                        <span className="font-medium">{step.label || step.commandId}</span>
                        <p className="text-xs text-muted-foreground">
                          {step.commandId} {step.args.join(" ")} {step.flags.join(" ")}
                        </p>
                        {step.continueOnError ? (
                          <Badge variant="secondary" className="w-fit">
                            continueOnError
                          </Badge>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPipelineDraft((current) => ({
                            ...current,
                            steps: current.steps.filter((entry) => entry.id !== step.id),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No steps in the draft"
                  description="Add at least one step before saving the pipeline."
                />
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void savePipelineDraft()}>Save pipeline</Button>
              <Button variant="outline" onClick={() => setPipelineDraft(createEmptyPipeline())}>
                Reset draft
              </Button>
            </div>
          </CardContent>
        </SurfaceCard>
      </div>
    );
  }

  function renderProcessesView() {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <SurfaceCard className="overflow-hidden">
          <CardHeader className="border-b border-border/50">
            <CardTitle>Tracked processes</CardTitle>
            <CardDescription>Live background processes for the current workspace.</CardDescription>
            <CardAction>
              <Badge variant="secondary">{processes.length}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 rounded-[1.75rem] border border-border/60 bg-muted/15 p-5">
              <div className="grid gap-1">
                <h3 className="font-medium">Start process</h3>
                <p className="text-sm text-muted-foreground">
                  Start a background process tracked by the Electron shell.
                </p>
              </div>

              <FieldGroup>
                <AppField id="manual-process-command" label="Command">
                  <Input
                    id="manual-process-command"
                    value={processCommand}
                    onChange={(event) => setProcessCommand(event.target.value)}
                  />
                </AppField>

                <AppField id="manual-process-args" label="Args">
                  <Input
                    id="manual-process-args"
                    value={processArgsText}
                    onChange={(event) => setProcessArgsText(event.target.value)}
                  />
                </AppField>
              </FieldGroup>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void startManualProcess()}>
                  <PlayIcon className="size-4" />
                  Start
                </Button>
              </div>
            </div>

            <Separator />

            {processes.length ? (
              <ScrollArea className={FEATURE_LIST_HEIGHT}>
                <div className="grid gap-3 pr-3">
                  {processes.map((processInfo) => {
                    const active = selectedProcessId === processInfo.id;
                    return (
                      <Button
                        key={processInfo.id}
                        variant="ghost"
                        className={cn(
                          "h-auto w-full flex-col items-start gap-1 rounded-[1.5rem] border px-4 py-4 text-left whitespace-normal",
                          active
                            ? "border-primary/35 bg-primary/10 text-foreground hover:bg-primary/10"
                            : "border-border/60 bg-background/40 hover:bg-muted/40",
                        )}
                        onClick={() => setSelectedProcessId(processInfo.id)}
                      >
                        <span className="font-medium">{processInfo.id}</span>
                        <span className="text-xs text-muted-foreground">
                          {processInfo.command} {processInfo.args.join(" ")}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState
                title="No tracked processes"
                description="Start one from this panel or from the workspace scripts screen."
              />
            )}
          </CardContent>
        </SurfaceCard>

        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>{selectedProcessId || "Logs"}</CardTitle>
            <CardDescription>Captured stdout and stderr from the selected process.</CardDescription>
            {selectedProcessId ? (
              <CardAction>
                <Badge variant="outline">live</Badge>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {selectedProcessId ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void stopSelectedProcess(selectedProcessId)}
                >
                  Stop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void removeSelectedProcess(selectedProcessId)}
                >
                  Remove
                </Button>
              </div>
            ) : null}

            <OutputPanel
              label="Logs"
              value={deferredProcessOutput}
              placeholder="Select a process to inspect its logs."
              className="h-[36rem]"
            />
          </CardContent>
        </SurfaceCard>
      </div>
    );
  }

  function renderScriptsView() {
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>Root scripts</CardTitle>
            <CardDescription>Package scripts discovered in the current root workspace.</CardDescription>
            <CardAction>
              <Badge variant="secondary">{workspace?.rootScripts.length ?? 0}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-6">
            {workspace?.rootScripts.length ? (
              <div className="grid gap-3">
                {workspace.rootScripts.map((script) => (
                  <div
                    key={`root:${script.name}`}
                    className="grid gap-3 rounded-[1.5rem] border border-border/60 bg-background/50 p-4"
                  >
                    <div className="grid gap-1">
                      <span className="font-medium">{script.name}</span>
                      <p className="text-xs text-muted-foreground">{script.command}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => void runWorkspaceScript(workspace.root, script.name)}
                      >
                        <PlayIcon className="size-4" />
                        Run in background
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No root scripts discovered"
                description="No package scripts were detected at the current workspace root."
              />
            )}
          </CardContent>
        </SurfaceCard>

        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>Child repos</CardTitle>
            <CardDescription>Scripts discovered from nested repos in the current workspace.</CardDescription>
            <CardAction>
              <Badge variant="secondary">{workspace?.childRepos.length ?? 0}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-6">
            {workspace?.childRepos.length ? (
              <div className="grid gap-3">
                {workspace.childRepos.map((repo) => (
                  <div
                    key={repo.path}
                    className="grid gap-4 rounded-[1.5rem] border border-border/60 bg-background/50 p-4"
                  >
                    <div className="grid gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{repo.name}</span>
                        <Badge variant="outline">{repo.scripts.length} scripts</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground break-all">{repo.path}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {repo.scripts.map((script) => (
                        <Button
                          key={`${repo.path}:${script.name}`}
                          size="sm"
                          variant="outline"
                          onClick={() => void runWorkspaceScript(repo.path, script.name)}
                        >
                          {script.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No child repos discovered"
                description="The workspace snapshot did not report nested repositories."
              />
            )}
          </CardContent>
        </SurfaceCard>
      </div>
    );
  }

  function renderToolStatusView() {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>Tool status</CardTitle>
            <CardDescription>
              Installed toolchain and linkage status for the active workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {toolStatus?.tools.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {toolStatus.tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="grid gap-3 rounded-[1.5rem] border border-border/60 bg-background/50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{tool.label}</span>
                      <Badge variant={tool.installed ? "secondary" : "outline"}>
                        {tool.installed ? "installed" : "missing"}
                      </Badge>
                    </div>
                    <div className="grid gap-1 text-xs text-muted-foreground">
                      <span>Version: {tool.version || "unknown"}</span>
                      <span>{tool.linked ? tool.project || "linked" : "not linked"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No tool status available"
                description="Refresh the workspace to request a fresh tool snapshot."
              />
            )}
          </CardContent>
        </SurfaceCard>

        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>Project state</CardTitle>
            <CardDescription>Serialized project state returned by the status service.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <OutputPanel
              label="Project state"
              value={stringify(toolStatus?.project ?? {})}
              placeholder="{}"
              className="h-[30rem]"
            />
          </CardContent>
        </SurfaceCard>
      </div>
    );
  }

  function renderProjectConfigView() {
    return (
      <div className="grid gap-6">
        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>Project config</CardTitle>
            <CardDescription>
              Direct editor for the shared `.polter/config.json` structure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <AppField
              id="project-config-json"
              label="Config JSON"
              description="Edits are written back to the existing shared project config format."
            >
              <Textarea
                id="project-config-json"
                className="min-h-[30rem] font-mono text-xs leading-6"
                value={projectConfigText}
                onChange={(event) => setProjectConfigText(event.target.value)}
              />
            </AppField>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void saveProjectConfigDraft()}>Save config</Button>
              <Button
                variant="outline"
                onClick={() => setProjectConfigText(stringify(projectConfig ?? {}))}
              >
                Reset editor
              </Button>
            </div>
          </CardContent>
        </SurfaceCard>
      </div>
    );
  }

  function renderInfrastructureView() {
    return (
      <div className="grid gap-6">
        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>Infrastructure</CardTitle>
            <CardDescription>
              Read the current declarative status, plan, and apply output from the real core services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void refreshInfrastructure()}>
                <RefreshCcwIcon className="size-4" />
                Refresh
              </Button>
              <Button variant="secondary" onClick={() => void applyInfrastructure()}>
                Apply
              </Button>
            </div>

            <Tabs defaultValue="status" className="gap-4">
              <TabsList variant="line">
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="plan">Plan</TabsTrigger>
                <TabsTrigger value="apply">Last apply</TabsTrigger>
              </TabsList>
              <TabsContent value="status">
                <OutputPanel
                  label="Status"
                  value={stringify(declarativeStatus ?? {})}
                  placeholder="{}"
                />
              </TabsContent>
              <TabsContent value="plan">
                <OutputPanel
                  label="Plan"
                  value={stringify(declarativePlan ?? {})}
                  placeholder="{}"
                />
              </TabsContent>
              <TabsContent value="apply">
                <OutputPanel
                  label="Last apply"
                  value={stringify(declarativeApplyResult ?? {})}
                  placeholder="{}"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </SurfaceCard>
      </div>
    );
  }

  function renderMcpView() {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>MCP status</CardTitle>
            <CardDescription>
              Project and user registrations for the Polter MCP server.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {mcpStatus?.scopes.length ? (
              <div className="grid gap-3">
                {mcpStatus.scopes.map((scope) => (
                  <div
                    key={scope.label}
                    className="grid gap-3 rounded-[1.5rem] border border-border/60 bg-background/50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{scope.label}</span>
                      <Badge variant={scope.registered ? "secondary" : "outline"}>
                        {scope.registered ? "registered" : "not registered"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{scope.error ?? scope.scope}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No MCP status available"
                description="The MCP status service has not returned any scope yet."
              />
            )}
          </CardContent>
        </SurfaceCard>

        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>Actions</CardTitle>
            <CardDescription>Install or remove registrations by scope.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-3">
              <h3 className="font-medium">Install</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => void installMcp("local")}>
                  Install local
                </Button>
                <Button variant="secondary" size="sm" onClick={() => void installMcp("project")}>
                  Install project
                </Button>
                <Button variant="secondary" size="sm" onClick={() => void installMcp("user")}>
                  Install user
                </Button>
              </div>
            </div>

            <Separator />

            <div className="grid gap-3">
              <h3 className="font-medium">Remove</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => void removeMcp("local")}>
                  Remove local
                </Button>
                <Button variant="outline" size="sm" onClick={() => void removeMcp("project")}>
                  Remove project
                </Button>
                <Button variant="outline" size="sm" onClick={() => void removeMcp("user")}>
                  Remove user
                </Button>
              </div>
            </div>
          </CardContent>
        </SurfaceCard>
      </div>
    );
  }

  function renderSkillView() {
    return (
      <div className="grid gap-6">
        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>Skill setup</CardTitle>
            <CardDescription>Preview and install the shared Polter skill for Claude Code.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void setupSkill()}>
                <SparklesIcon className="size-4" />
                Install or update skill
              </Button>
            </div>

            <FieldGroup>
              <AppField id="skill-path" label="Skill path">
                <Input id="skill-path" readOnly value={skillPreview?.path ?? ""} />
              </AppField>
            </FieldGroup>

            <OutputPanel
              label="Skill content"
              value={skillPreview?.content ?? ""}
              placeholder="No preview available."
              className="h-[34rem]"
            />
          </CardContent>
        </SurfaceCard>
      </div>
    );
  }

  function renderSettingsView() {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Switch the active workspace without restarting the desktop shell.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <AppField
              id="workspace-path"
              label="Current workspace"
              description="The new workspace path is loaded through the existing desktop bridge."
            >
              <Input
                id="workspace-path"
                value={cwdDraft}
                onChange={(event) => setCwdDraft(event.target.value)}
              />
            </AppField>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  startTransition(() => {
                    void loadShellState(cwdDraft);
                  })
                }
              >
                Apply workspace
              </Button>
            </div>
          </CardContent>
        </SurfaceCard>

        <SurfaceCard>
          <CardHeader className="border-b border-border/50">
            <CardTitle>App info</CardTitle>
            <CardDescription>Metadata returned by the desktop shell bootstrap.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <OutputPanel
              label="App info"
              value={stringify(appInfo ?? {})}
              placeholder="{}"
              className="h-[24rem]"
            />
          </CardContent>
        </SurfaceCard>
      </div>
    );
  }

  function renderCurrentView() {
    if (selectedView.startsWith("feature:")) {
      return renderFeatureView();
    }

    switch (selectedView) {
      case "pinned":
        return renderPinnedView();
      case "pipelines":
        return renderPipelinesView();
      case "processes":
        return renderProcessesView();
      case "scripts":
        return renderScriptsView();
      case "tool-status":
        return renderToolStatusView();
      case "project-config":
        return renderProjectConfigView();
      case "infrastructure":
        return renderInfrastructureView();
      case "mcp":
        return renderMcpView();
      case "skills":
        return renderSkillView();
      case "settings":
        return renderSettingsView();
      default:
        return (
          <EmptyState
            title="Select a view"
            description="Choose a workflow, feature, or system surface from the sidebar."
          />
        );
    }
  }

  return (
    <div className="app-shell-surface">
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader className="p-3">
            <div className="rounded-[1.75rem] border border-sidebar-border/70 bg-sidebar-accent/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-[1.25rem] bg-sidebar-primary text-sidebar-primary-foreground">
                  <AppWindowIcon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-sidebar-foreground/70">
                    Polter
                  </p>
                  <h1 className="truncate text-base font-medium text-sidebar-foreground">
                    Desktop
                  </h1>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-xs leading-5 text-sidebar-foreground/70">
                {cwd || "Loading workspace..."}
              </p>
            </div>
          </SidebarHeader>

          <SidebarSeparator />

          <SidebarContent>
            {sidebarSections.map((section) => (
              <SidebarGroup key={section.title}>
                <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const Icon = getViewIcon(item.id);
                      const badge = getSidebarBadge(item.id);

                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            isActive={selectedView === item.id}
                            tooltip={item.label}
                            onClick={() => setSelectedView(item.id)}
                          >
                            <Icon className="size-4" />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                          {badge ? <SidebarMenuBadge>{badge}</SidebarMenuBadge> : null}
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <div className="grid gap-2 rounded-[1.5rem] border border-sidebar-border/70 bg-sidebar-accent/30 p-3 text-xs text-sidebar-foreground/70">
              <div className="flex items-center justify-between gap-3">
                <span>Version</span>
                <Badge variant="outline" className="border-sidebar-border bg-transparent text-sidebar-foreground">
                  {appInfo?.version ?? "..."}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Workspace</span>
                <span className="truncate">{cwd || "..."}</span>
              </div>
            </div>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="app-shell-surface">
          <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 px-4 py-4 backdrop-blur-md md:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <SidebarTrigger className="mt-0.5 shrink-0" />
                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="uppercase tracking-[0.18em]">
                      Workspace
                    </Badge>
                    {currentViewCount ? <Badge variant="outline">{currentViewCount}</Badge> : null}
                  </div>
                  <div className="grid gap-1">
                    <h2 className="text-2xl font-medium tracking-tight">{currentViewLabel}</h2>
                    <p className="max-w-3xl text-sm text-muted-foreground">{currentViewSummary}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="max-w-full truncate">
                  {cwd || "Loading workspace..."}
                </Badge>
                <Button variant="outline" onClick={() => void loadShellState(cwd)}>
                  <RefreshCcwIcon className="size-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-6">
            <div className="grid gap-4">
              {message ? (
                <Alert>
                  <CheckCircle2Icon className="size-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              ) : null}

              {error ? (
                <Alert variant="destructive">
                  <AlertCircleIcon className="size-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              {renderCurrentView()}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
