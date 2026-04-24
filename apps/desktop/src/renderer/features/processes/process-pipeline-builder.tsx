import type { CSSProperties, JSX } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeftIcon,
  GripVerticalIcon,
  SaveIcon,
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
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { SurfaceCard } from "../shared/components.js";
import type {
  Pipeline,
  PipelineSource,
} from "../workbench/types.js";
import {
  createPipelineFromProcessCards,
  reorderProcessCards,
  type ProcessCommandCard,
} from "./process-command-model.js";

export function ProcessPipelineBuilder({
  description,
  name,
  onBack,
  onDescriptionChange,
  onNameChange,
  onSave,
  onSourceChange,
  onStepsChange,
  source,
  steps,
}: {
  description: string;
  name: string;
  onBack: () => void;
  onDescriptionChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSave: (pipeline: Pipeline, source: PipelineSource) => void;
  onSourceChange: (source: PipelineSource) => void;
  onStepsChange: (steps: ProcessCommandCard[]) => void;
  source: PipelineSource;
  steps: ProcessCommandCard[];
}): JSX.Element {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    onStepsChange(reorderProcessCards(steps, String(active.id), String(over.id)));
  }

  function setAllContinueOnError(continueOnError: boolean): void {
    onStepsChange(steps.map((step) => ({ ...step, continueOnError })));
  }

  function setStepContinueOnError(stepId: string, continueOnError: boolean): void {
    onStepsChange(
      steps.map((step) => (step.id === stepId ? { ...step, continueOnError } : step)),
    );
  }

  const allContinueOnError = steps.length > 0 && steps.every((step) => step.continueOnError);
  const canSave = Boolean(name.trim()) && steps.length > 0;

  return (
    <SurfaceCard aria-label="Pipeline builder">
      <CardHeader className="border-b border-border/50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle className="flex items-center gap-2">
              <WorkflowIcon className="size-4 text-muted-foreground" />
              Pipeline builder
            </CardTitle>
            <CardDescription>Arrange staged commands and choose failure behavior before saving.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            <ArrowLeftIcon className="size-4" />
            Back
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(18rem,0.9fr)_minmax(18rem,1fr)_12rem]">
          <div className="grid gap-2">
            <Label htmlFor="process-pipeline-name">Name</Label>
            <Input
              id="process-pipeline-name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Process command pipeline"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="process-pipeline-description">Description</Label>
            <Textarea
              id="process-pipeline-description"
              className="min-h-9"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Describe this pipeline."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="process-pipeline-source">Source</Label>
            <NativeSelect
              id="process-pipeline-source"
              className="w-full"
              value={source}
              onChange={(event) => onSourceChange(event.target.value as PipelineSource)}
            >
              <NativeSelectOption value="project">Project</NativeSelectOption>
              <NativeSelectOption value="global">Global</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/60 bg-muted/20 p-4">
          <div className="grid gap-1">
            <span className="text-sm font-medium">Failure behavior</span>
            <span className="text-xs text-muted-foreground">
              Continue pipeline after a command fails unless a step overrides it.
            </span>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={allContinueOnError}
              onCheckedChange={(checked) => setAllContinueOnError(Boolean(checked))}
            />
            Continue on command failure
          </label>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={steps.map((step) => step.id)} strategy={verticalListSortingStrategy}>
            <div className="grid gap-2">
              {steps.map((step, index) => (
                <SortablePipelineStep
                  key={step.id}
                  index={index}
                  step={step}
                  onContinueOnErrorChange={setStepContinueOnError}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="outline">{steps.length} steps</Badge>
          <Button
            type="button"
            disabled={!canSave}
            onClick={() =>
              onSave(
                createPipelineFromProcessCards({
                  description,
                  name,
                  source,
                  steps,
                }),
                source,
              )
            }
          >
            <SaveIcon className="size-4" />
            Save mock pipeline
          </Button>
        </div>
      </CardContent>
    </SurfaceCard>
  );
}

function SortablePipelineStep({
  index,
  onContinueOnErrorChange,
  step,
}: {
  index: number;
  onContinueOnErrorChange: (stepId: string, continueOnError: boolean) => void;
  step: ProcessCommandCard;
}): JSX.Element {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: step.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      className="grid gap-3 rounded-3xl border border-border/60 bg-background/60 p-3 data-[dragging=true]:border-primary/40 data-[dragging=true]:bg-primary/10"
      data-dragging={isDragging}
      style={style}
    >
      <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Move step ${index + 1}`}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
        </button>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{index + 1}</Badge>
            <span className="font-medium">{step.label}</span>
            <Badge variant="outline">{step.source}</Badge>
          </div>
          <code className="block truncate font-mono text-xs text-muted-foreground">
            {step.commandValue}
          </code>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={step.continueOnError}
            onCheckedChange={(checked) =>
              onContinueOnErrorChange(step.id, Boolean(checked))
            }
          />
          Continue on error
        </label>
      </div>
    </div>
  );
}
