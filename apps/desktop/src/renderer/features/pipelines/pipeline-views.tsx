import { useState, type JSX } from "react";
import {
  ArrowLeftIcon,
  PlayIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  WorkflowIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { EmptyState } from "../shared/components.js";
import { createEmptyPipeline } from "../shared/utils.js";
import type {
  PipelineSource,
  PipelineWithSource,
} from "../workbench/types.js";
import type { Workbench } from "../workbench/use-workbench.js";

type PipelinesWorkspaceMode = "list" | "builder";

export function PipelinesView({ workbench }: { workbench: Workbench }): JSX.Element {
  const [mode, setMode] = useState<PipelinesWorkspaceMode>("list");

  function openBuilder(): void {
    workbench.setPipelineDraft(createEmptyPipeline());
    workbench.setStepCommandId("");
    workbench.setStepArgsText("");
    workbench.setStepFlagsText("");
    workbench.setStepLabel("");
    workbench.setStepContinueOnError(false);
    setMode("builder");
  }

  async function saveDraft(): Promise<void> {
    await workbench.savePipelineDraft();
    setMode("list");
  }

  if (mode === "builder") {
    return (
      <PipelineBuilderPage
        workbench={workbench}
        onBack={() => setMode("list")}
        onSave={() => void saveDraft()}
      />
    );
  }

  return (
    <PipelineListPage
      pipelines={workbench.pipelines}
      onCreatePipeline={openBuilder}
      onRemovePipeline={(pipeline) => void workbench.removePipeline(pipeline)}
      onRunPipeline={(name) => void workbench.runPipelineByName(name)}
    />
  );
}

export function PipelineListPage({
  onCreatePipeline,
  onRemovePipeline,
  onRunPipeline,
  pipelines,
}: {
  onCreatePipeline: () => void;
  onRemovePipeline: (pipeline: PipelineWithSource) => void;
  onRunPipeline: (name: string) => void;
  pipelines: PipelineWithSource[];
}): JSX.Element {
  return (
    <div className="grid max-w-3xl gap-4" aria-label="Pipeline workspace">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={onCreatePipeline}>
          <PlusIcon className="size-4" />
          New pipeline
        </Button>
      </div>

      {pipelines.length ? (
        <div className="grid gap-3">
          {pipelines.map((pipeline) => (
            <PipelineCard
              key={`${pipeline.source}:${pipeline.id}`}
              pipeline={pipeline}
              onRemove={() => onRemovePipeline(pipeline)}
              onRun={() => onRunPipeline(pipeline.name)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No pipelines"
          description="Create a local mock pipeline from the builder page."
        />
      )}
    </div>
  );
}

function PipelineCard({
  onRemove,
  onRun,
  pipeline,
}: {
  onRemove: () => void;
  onRun: () => void;
  pipeline: PipelineWithSource;
}): JSX.Element {
  return (
    <article className="grid gap-3 rounded-3xl border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <WorkflowIcon className="size-4 shrink-0 text-muted-foreground" />
            <h2 className="truncate font-medium">{pipeline.name}</h2>
            <Badge variant="outline">{pipeline.source}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {pipeline.description || "No description."}
          </p>
        </div>
        <Badge variant="secondary">{pipeline.steps.length} steps</Badge>
      </div>

      {pipeline.steps.length ? (
        <div className="grid gap-1" aria-label={`${pipeline.name} steps`}>
          {pipeline.steps.map((step) => (
            <div
              key={step.id}
              className="grid gap-2 border-t border-border/60 pt-2 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]"
            >
              <span className="truncate text-sm font-medium">{step.label ?? step.commandId}</span>
              <code className="truncate font-mono text-xs text-muted-foreground">
                {[step.commandId, ...step.args, ...step.flags].join(" ")}
              </code>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onRun}>
          <PlayIcon className="size-4" />
          Run mock
        </Button>
        <Button size="sm" variant="outline" onClick={onRemove}>
          <Trash2Icon className="size-4" />
          Remove
        </Button>
      </div>
    </article>
  );
}

export function PipelineBuilderPage({
  onBack,
  onSave,
  workbench,
}: {
  onBack: () => void;
  onSave: () => void;
  workbench: Workbench;
}): JSX.Element {
  const {
    addPipelineStep,
    allCommands,
    pipelineDraft,
    pipelineSource,
    setPipelineDraft,
    setPipelineSource,
    setStepArgsText,
    setStepCommandId,
    setStepContinueOnError,
    setStepFlagsText,
    setStepLabel,
    stepArgsText,
    stepCommandId,
    stepContinueOnError,
    stepFlagsText,
    stepLabel,
  } = workbench;

  return (
    <div className="grid max-w-5xl gap-6" aria-label="Pipeline editor">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          <ArrowLeftIcon className="size-4" />
          Back
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!pipelineDraft.name.trim()}
          onClick={onSave}
        >
          <SaveIcon className="size-4" />
          Save mock pipeline
        </Button>
      </div>

      <div className="grid gap-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(18rem,1fr)_12rem]">
          <div className="grid gap-2">
            <Label htmlFor="pipeline-name">Name</Label>
            <Input
              id="pipeline-name"
              value={pipelineDraft.name}
              onChange={(event) =>
                setPipelineDraft((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Desktop checks"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pipeline-description">Description</Label>
            <Textarea
              id="pipeline-description"
              className="min-h-9"
              value={pipelineDraft.description ?? ""}
              onChange={(event) =>
                setPipelineDraft((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Describe what this pipeline represents."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pipeline-source">Source</Label>
            <Select
              value={pipelineSource}
              onValueChange={(value) => setPipelineSource(value as PipelineSource)}
            >
              <SelectTrigger id="pipeline-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 border-t border-border/60 pt-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(14rem,0.8fr)_repeat(3,minmax(0,1fr))]">
            <div className="grid gap-2">
              <Label htmlFor="pipeline-step-command">Command</Label>
              <Select value={stepCommandId} onValueChange={setStepCommandId}>
                <SelectTrigger id="pipeline-step-command">
                  <SelectValue placeholder="Select a command" />
                </SelectTrigger>
                <SelectContent>
                  {allCommands.map((command) => (
                    <SelectItem key={command.id} value={command.id}>
                      {command.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pipeline-step-label">Label</Label>
              <Input
                id="pipeline-step-label"
                value={stepLabel}
                onChange={(event) => setStepLabel(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pipeline-step-args">Args</Label>
              <Input
                id="pipeline-step-args"
                value={stepArgsText}
                onChange={(event) => setStepArgsText(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pipeline-step-flags">Flags</Label>
              <Input
                id="pipeline-step-flags"
                value={stepFlagsText}
                onChange={(event) => setStepFlagsText(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={stepContinueOnError}
                onCheckedChange={(checked) => setStepContinueOnError(Boolean(checked))}
              />
              Continue on error
            </label>

            <Button type="button" variant="secondary" size="sm" onClick={addPipelineStep}>
              <PlusIcon className="size-4" />
              Add step
            </Button>
          </div>
        </div>

        {pipelineDraft.steps.length ? (
          <div className="grid gap-2 border-t border-border/60 pt-5">
            <Label>Draft steps</Label>
            <div className="grid gap-1">
              {pipelineDraft.steps.map((step) => (
                <div
                  key={step.id}
                  className="grid gap-2 border-t border-border/60 pt-2 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]"
                >
                  <span className="truncate text-sm font-medium">
                    {step.label ?? step.commandId}
                  </span>
                  <code className="truncate font-mono text-xs text-muted-foreground">
                    {[step.commandId, ...step.args, ...step.flags].join(" ")}
                  </code>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
