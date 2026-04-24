import type { JSX } from "react";
import {
  PlayIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  WorkflowIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { EmptyState, SurfaceCard } from "../shared/components.js";
import type { Workbench } from "../workbench/use-workbench.js";
import type { PipelineSource } from "../workbench/types.js";

export function PipelinesView({ workbench }: { workbench: Workbench }): JSX.Element {
  const {
    addPipelineStep,
    allCommands,
    pipelineDraft,
    pipelineSource,
    pipelines,
    removePipeline,
    runPipelineByName,
    savePipelineDraft,
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
    <div
      className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.9fr)]"
      aria-label="Pipelines workspace"
    >
      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <CardTitle>Pipelines</CardTitle>
          <CardDescription>
            Compose and preview workflow pipelines with local mock state.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {pipelines.length ? (
            pipelines.map((pipeline) => (
              <div
                key={`${pipeline.source}:${pipeline.id}`}
                className="grid gap-3 rounded-3xl border border-border/60 bg-background/50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <WorkflowIcon className="size-4 text-muted-foreground" />
                      <h3 className="font-medium">{pipeline.name}</h3>
                      <Badge variant="outline">{pipeline.source}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pipeline.description || "No description."}
                    </p>
                  </div>
                  <Badge variant="secondary">{pipeline.steps.length} steps</Badge>
                </div>

                <div className="grid gap-2">
                  {pipeline.steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2"
                    >
                      <span className="text-sm font-medium">{step.label ?? step.commandId}</span>
                      <code className="font-mono text-xs text-muted-foreground">
                        {[step.commandId, ...step.args, ...step.flags].join(" ")}
                      </code>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void runPipelineByName(pipeline.name)}>
                    <PlayIcon className="size-4" />
                    Run mock
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void removePipeline(pipeline)}
                  >
                    <Trash2Icon className="size-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No pipelines"
              description="Use the builder to create a mock pipeline for this UI preview."
            />
          )}
        </CardContent>
      </SurfaceCard>

      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <CardTitle>Pipeline builder</CardTitle>
          <CardDescription>
            Build a local draft without writing files or running commands.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
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
              value={pipelineDraft.description ?? ""}
              onChange={(event) =>
                setPipelineDraft((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Describe what this pipeline represents."
            />
          </div>

          <div className="grid gap-2">
            <Label>Source</Label>
            <Select
              value={pipelineSource}
              onValueChange={(value) => setPipelineSource(value as PipelineSource)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 rounded-3xl border border-border/60 bg-muted/20 p-4">
            <div className="grid gap-2">
              <Label>Command</Label>
              <Select value={stepCommandId} onValueChange={setStepCommandId}>
                <SelectTrigger>
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

            <div className="grid gap-3 md:grid-cols-3">
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

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={stepContinueOnError}
                onCheckedChange={(checked) => setStepContinueOnError(Boolean(checked))}
              />
              Continue on error
            </label>

            <Button type="button" variant="secondary" onClick={addPipelineStep}>
              <PlusIcon className="size-4" />
              Add step
            </Button>
          </div>

          {pipelineDraft.steps.length ? (
            <div className="grid gap-2">
              <Label>Draft steps</Label>
              {pipelineDraft.steps.map((step) => (
                <div
                  key={step.id}
                  className="rounded-2xl border border-border/60 bg-background/50 px-3 py-2 text-sm"
                >
                  {step.label ?? step.commandId}
                </div>
              ))}
            </div>
          ) : null}

          <Button
            type="button"
            disabled={!pipelineDraft.name.trim()}
            onClick={() => void savePipelineDraft()}
          >
            <SaveIcon className="size-4" />
            Save mock pipeline
          </Button>
        </CardContent>
      </SurfaceCard>
    </div>
  );
}
