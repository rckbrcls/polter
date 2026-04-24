import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  headerWorkflowItems,
  systemSidebarItems,
  workflowNavigationItems,
  type SidebarViewId,
} from "../navigation/navigation.js";
import {
  createEmptyPipeline,
  splitArgs,
  stringify,
} from "../shared/utils.js";
import {
  PROCESS_LOG_TAIL,
  formatProcessOutput,
  resolveProcessSelection,
} from "./process-state.js";
import { createMockWorkbenchAdapter } from "./mock-workbench-adapter.js";
import type {
  DesktopAppInfo,
  CommandDef,
  DesktopCommandForm,
  DesktopCommandRunResult,
  DesktopDeclarativeApplyResult,
  DesktopDeclarativePlan,
  DesktopPins,
  DesktopRepository,
  DesktopSkillPreview,
  DesktopToolStatusSnapshot,
  DesktopWorkspaceSnapshot,
  Feature,
  McpScope,
  McpStatusInfo,
  Pipeline,
  PipelineSource,
  PipelineWithSource,
  ProcessInfo,
  ProcessOutput,
  ProjectConfig,
  StatusResult,
  WorkbenchSnapshot,
} from "./types.js";

export function useWorkbench() {
  const adapter = useMemo(() => createMockWorkbenchAdapter(), []);
  const [appInfo, setAppInfo] = useState<DesktopAppInfo | null>(null);
  const [cwd, setCwd] = useState("");
  const [cwdDraft, setCwdDraft] = useState("");
  const [features, setFeatures] = useState<Feature[]>([]);
  const [repositories, setRepositories] = useState<DesktopRepository[]>([]);
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

  const deferredProcessOutput = useDeferredValue(formatProcessOutput(processLogs));
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
  const visibleRepositories = useMemo(() => {
    if (repositories.length > 0) {
      return repositories;
    }

    if (!cwd) {
      return [];
    }

    const name = cwd.split("/").filter(Boolean).at(-1) ?? cwd;
    return [
      {
        id: "current-workspace",
        name,
        path: cwd,
        lastOpenedAt: "",
        exists: true,
      },
    ];
  }, [cwd, repositories]);
  const systemViewSelected = systemSidebarItems.some((item) => item.id === selectedView);

  function applySnapshot(snapshot: WorkbenchSnapshot): void {
    setAppInfo(snapshot.appInfo);
    setRepositories(snapshot.repositories);
    setCwd(snapshot.appInfo.cwd);
    setCwdDraft(snapshot.appInfo.cwd);
    setFeatures(snapshot.features);
    setAllCommands(snapshot.allCommands);
    setPins(snapshot.pins);
    setPipelines(snapshot.pipelines);
    setWorkspace(snapshot.workspace);
    setToolStatus(snapshot.toolStatus);
    setProjectConfig(snapshot.projectConfig);
    setProjectConfigText(stringify(snapshot.projectConfig));
    setDeclarativeStatus(snapshot.declarativeStatus);
    setDeclarativePlan(snapshot.declarativePlan);
    setMcpStatus(snapshot.mcpStatus);
    setSkillPreview(snapshot.skillPreview);
    setProcesses(snapshot.processes);

    const nextSelectedProcessId = resolveProcessSelection(snapshot.processes, selectedProcessId);
    setSelectedProcessId(nextSelectedProcessId);
  }

  async function loadShellState(nextCwd?: string) {
    setError("");

    try {
      applySnapshot(await adapter.getSnapshot(nextCwd));
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }

  async function refreshProcesses() {
    setError("");

    try {
      const nextProcesses = await adapter.listProcesses(cwd);
      setProcesses(nextProcesses);

      const nextSelectedProcessId = resolveProcessSelection(nextProcesses, selectedProcessId);
      setSelectedProcessId(nextSelectedProcessId);
      setProcessLogs(
        nextSelectedProcessId
          ? await adapter.getProcessLogs(nextSelectedProcessId, PROCESS_LOG_TAIL)
          : null,
      );
    } catch (processError) {
      setError(`Could not refresh mock activity: ${(processError as Error).message}`);
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

    let disposed = false;
    void adapter.getCommandForm(selectedCommandId).then((form) => {
      if (disposed) {
        return;
      }

      setCommandForm(form);
      setCommandFlags([]);
    });

    return () => {
      disposed = true;
    };
  }, [adapter, selectedCommandId]);

  useEffect(() => {
    if (!selectedProcessId) {
      setProcessLogs(null);
      return;
    }

    let disposed = false;
    void adapter.getProcessLogs(selectedProcessId, PROCESS_LOG_TAIL).then((logs) => {
      if (!disposed) {
        setProcessLogs(logs);
      }
    });

    return () => {
      disposed = true;
    };
  }, [adapter, selectedProcessId]);

  async function runCommandById(commandId: string, args: string[] = [], flags: string[] = []) {
    setMessage("");
    setError("");

    try {
      const result = await adapter.runCommand({
        commandId,
        cwd,
        args,
        flags,
      });

      setCommandResult(result);
      setMessage(result.success ? "Mock command completed." : "Mock command finished with errors.");
      return result;
    } catch (commandError) {
      setError((commandError as Error).message);
      return null;
    }
  }

  async function runSelectedCommand() {
    if (!commandForm) {
      return null;
    }

    return runCommandById(commandForm.command.id, splitArgs(commandArgsText), commandFlags);
  }

  async function inspectCommand(commandId: string) {
    setSelectedCommandId(commandId);
    setCommandArgsText("");
    setCommandFlags([]);
    const form = await adapter.getCommandForm(commandId);
    setCommandForm(form);
    return form;
  }

  async function toggleCommandPin() {
    if (!commandForm) {
      return;
    }
    setPins(await adapter.toggleCommandPin(commandForm.commandValue));
  }

  async function toggleRunPin() {
    if (!commandForm) {
      return;
    }
    const runCommand = [commandForm.commandValue, ...splitArgs(commandArgsText), ...commandFlags]
      .filter(Boolean)
      .join(" ");
    setPins(await adapter.toggleRunPin(runCommand));
  }

  async function savePipelineDraft() {
    setError("");
    try {
      const savedPipeline = await adapter.savePipeline(pipelineDraft, pipelineSource, cwd);
      setPipelineDraft(savedPipeline);
      setPipelines((await adapter.getSnapshot(cwd)).pipelines);
      setMessage(`Saved mock pipeline "${savedPipeline.name}".`);
    } catch (pipelineError) {
      setError((pipelineError as Error).message);
    }
  }

  async function runPipelineByName(name: string) {
    try {
      const result = await adapter.runPipeline(name, cwd);
      setMessage(`Ran mock pipeline "${name}".`);
      setCommandResult({
        commandId: `pipeline:${name}`,
        commandValue: name,
        executed: `mock pipeline run ${name}`,
        success: Boolean((result as { success?: boolean }).success),
        exitCode: (result as { success?: boolean }).success ? 0 : 1,
        stdout: stringify(result),
        stderr: "",
      });
      return result;
    } catch (pipelineError) {
      setError((pipelineError as Error).message);
      return null;
    }
  }

  async function removePipeline(pipeline: PipelineWithSource) {
    await adapter.removePipeline(pipeline.id, pipeline.source, cwd);
    setPipelines((await adapter.getSnapshot(cwd)).pipelines);
    setMessage(`Removed mock pipeline "${pipeline.name}".`);
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

  function addCommandToPipelineDraft(
    commandId: string,
    args: string[] = [],
    flags: string[] = [],
    label?: string,
  ) {
    const nextStep = {
      id: `step-${pipelineDraft.steps.length + 1}`,
      commandId,
      args,
      flags,
      continueOnError: false,
      label: label || undefined,
    };

    setPipelineDraft((current) => ({
      ...current,
      steps: [...current.steps, nextStep],
    }));
    setSelectedView("pipelines");
    setMessage(`Added "${label || commandId}" to the mock pipeline draft.`);
  }

  async function saveProjectConfigDraft() {
    try {
      const parsed = JSON.parse(projectConfigText) as ProjectConfig;
      const saved = await adapter.saveProjectConfig(parsed, cwd);
      if (!saved) {
        setError("Project config could not be saved in the mock adapter.");
        return;
      }
      setProjectConfig(parsed);
      const snapshot = await adapter.getSnapshot(cwd);
      setToolStatus(snapshot.toolStatus);
      setDeclarativeStatus(snapshot.declarativeStatus);
      setDeclarativePlan(snapshot.declarativePlan);
      setMessage("Mock project config saved.");
    } catch (configError) {
      setError(`Invalid project config JSON: ${(configError as Error).message}`);
    }
  }

  async function refreshInfrastructure() {
    const next = await adapter.refreshInfrastructure(cwd);
    setDeclarativeStatus(next.status);
    setDeclarativePlan(next.plan);
    setMessage("Mock infrastructure snapshot refreshed.");
  }

  async function applyInfrastructure() {
    try {
      const result = await adapter.applyInfrastructure(cwd);
      setDeclarativeApplyResult(result);
      setMessage("Mock declarative apply finished.");
      await refreshInfrastructure();
    } catch (applyError) {
      setError((applyError as Error).message);
    }
  }

  async function runWorkspaceScript(repoPath: string, script: string) {
    try {
      const processInfo = await adapter.runWorkspaceScript(repoPath, script, []);
      setProcesses(await adapter.listProcesses(cwd));
      setSelectedProcessId(processInfo.id);
      setSelectedView("processes");
      setMessage(`Started mock ${script} in ${repoPath}.`);
    } catch (scriptError) {
      setError((scriptError as Error).message);
    }
  }

  async function startManualProcess() {
    const command = processCommand.trim();
    if (!command) {
      setError("Enter a command to start a mock process.");
      return;
    }

    try {
      const processInfo = await adapter.startProcess(command, splitArgs(processArgsText), cwd);
      setProcessCommand("");
      setProcessArgsText("");
      setProcesses(await adapter.listProcesses(cwd));
      setSelectedProcessId(processInfo.id);
      setMessage("Mock background process started.");
    } catch (processError) {
      setError((processError as Error).message);
    }
  }

  async function stopSelectedProcess(id: string) {
    try {
      await adapter.stopProcess(id);
      await refreshProcesses();
      setMessage(`Stopped mock process "${id}".`);
    } catch (processError) {
      setError(`Could not stop mock process: ${(processError as Error).message}`);
    }
  }

  async function removeSelectedProcess(id: string) {
    try {
      await adapter.removeProcess(id);
      await refreshProcesses();
      setMessage(`Removed mock process "${id}".`);
    } catch (processError) {
      setError(`Could not remove mock process: ${(processError as Error).message}`);
    }
  }

  async function installMcp(scope: McpScope) {
    const result = await adapter.installMcp(scope);
    setMessage(result.message);
    setMcpStatus((await adapter.getSnapshot(cwd)).mcpStatus);
  }

  async function removeMcp(scope: McpScope) {
    const result = await adapter.removeMcp(scope);
    setMessage(result.message);
    setMcpStatus((await adapter.getSnapshot(cwd)).mcpStatus);
  }

  async function setupSkill() {
    const result = await adapter.setupSkill();
    setMessage(`Skill ${result.status}.`);
    setSkillPreview((await adapter.getSnapshot(cwd)).skillPreview);
  }

  async function selectRepository(repository: DesktopRepository) {
    if (!repository.exists) {
      setError("Repository path is missing in the mock workspace.");
      return;
    }

    setMessage("");
    setError("");

    try {
      await adapter.addRepository(repository.path);
      startTransition(() => {
        void loadShellState(repository.path);
      });
    } catch (repositoryError) {
      setError((repositoryError as Error).message);
    }
  }

  async function addRepositoryFromPicker() {
    setMessage("");
    setError("");

    try {
      const selectedPath = await adapter.pickDirectory();
      if (!selectedPath) {
        return;
      }

      const repository = await adapter.addRepository(selectedPath);
      await loadShellState(repository.path);
      setMessage(`Added mock repository "${repository.name}".`);
    } catch (repositoryError) {
      setError((repositoryError as Error).message);
    }
  }

  async function removeRepository(repository: DesktopRepository) {
    if (repository.id === "current-workspace") {
      return;
    }

    setMessage("");
    setError("");

    try {
      await adapter.removeRepository(repository.id);
      const snapshot = await adapter.getSnapshot(cwd);
      setRepositories(snapshot.repositories);
      setMessage(`Removed mock repository "${repository.name}" from Projects.`);

      if (repository.path === cwd && snapshot.repositories[0]) {
        await loadShellState(snapshot.repositories[0].path);
      }
    } catch (repositoryError) {
      setError((repositoryError as Error).message);
    }
  }

  function applyWorkspaceDraft() {
    startTransition(() => {
      void loadShellState(cwdDraft);
    });
  }

  function getSidebarBadge(viewId: SidebarViewId): string | undefined {
    if (viewId.startsWith("feature:")) {
      const feature = featureMap.get(viewId.replace("feature:", ""));
      return feature?.commands.length ? String(feature.commands.length) : undefined;
    }

    switch (viewId) {
      case "pipelines":
        return pipelines.length ? String(pipelines.length) : undefined;
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

  return {
    activeRepositoryPath: cwd,
    addCommandToPipelineDraft,
    addPipelineStep,
    addRepositoryFromPicker,
    appInfo,
    allCommands,
    applyInfrastructure,
    applyWorkspaceDraft,
    commandArgsText,
    commandFlags,
    commandForm,
    cwdDraft,
    declarativeApplyResult,
    declarativePlan,
    declarativeStatus,
    deferredCommandOutput,
    deferredProcessOutput,
    error,
    features,
    getSidebarBadge,
    headerItems: headerWorkflowItems,
    installMcp,
    inspectCommand,
    mcpStatus,
    message,
    pins,
    pipelineDraft,
    pipelineSource,
    pipelines,
    processArgsText,
    processCommand,
    processes,
    projectConfig,
    projectConfigText,
    refreshInfrastructure,
    refreshProcesses,
    removeRepository,
    removeMcp,
    removePipeline,
    removeSelectedProcess,
    repositories: visibleRepositories,
    runCommandById,
    runPipelineByName,
    runSelectedCommand,
    runWorkspaceScript,
    savePipelineDraft,
    saveProjectConfigDraft,
    selectedCommandId,
    selectedFeature,
    selectedFeatureCommands,
    selectedProcessId,
    selectedView,
    selectRepository,
    setCommandArgsText,
    setCommandFlags,
    setCwdDraft,
    setPipelineDraft,
    setPipelineSource,
    setProcessArgsText,
    setProcessCommand,
    setProjectConfigText,
    setSelectedCommandId,
    setSelectedProcessId,
    setSelectedView,
    setStepArgsText,
    setStepCommandId,
    setStepContinueOnError,
    setStepFlagsText,
    setStepLabel,
    setupSkill,
    skillPreview,
    startManualProcess,
    stepArgsText,
    stepCommandId,
    stepContinueOnError,
    stepFlagsText,
    stepLabel,
    stopSelectedProcess,
    systemViewSelected,
    toolStatus,
    toggleCommandPin,
    toggleRunPin,
    workspace,
    workflowItems: workflowNavigationItems,
  };
}

export type Workbench = ReturnType<typeof useWorkbench>;
