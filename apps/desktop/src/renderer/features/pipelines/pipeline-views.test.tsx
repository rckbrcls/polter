import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type {
  CommandDef,
  Pipeline,
  PipelineWithSource,
} from "../workbench/types.js";
import type { Workbench } from "../workbench/use-workbench.js";
import {
  PipelineBuilderPage,
  PipelineListPage,
  PipelinesView,
} from "./pipeline-views.js";

const commands: CommandDef[] = [
  {
    id: "git:status",
    tool: "git",
    base: ["status"],
    label: "Git Status",
    isReadOnly: true,
  },
];

const draft: Pipeline = {
  id: "",
  name: "",
  description: "",
  steps: [],
  createdAt: "",
  updatedAt: "",
};

const pipelines: PipelineWithSource[] = [
  {
    id: "desktop-ui-review",
    name: "Desktop UI review",
    description: "Mock pipeline for reviewing the desktop interface surfaces.",
    source: "project",
    createdAt: "2026-04-24T00:00:00.000Z",
    updatedAt: "2026-04-24T00:00:00.000Z",
    steps: [
      {
        id: "inspect-repository",
        commandId: "git:status",
        args: [],
        flags: [],
        continueOnError: false,
        label: "Inspect repository",
      },
    ],
  },
];

function workbench(overrides: Partial<Workbench> = {}): Workbench {
  return {
    addPipelineStep: vi.fn(),
    allCommands: commands,
    pipelineDraft: draft,
    pipelineSource: "project",
    pipelines,
    removePipeline: vi.fn(),
    runPipelineByName: vi.fn(),
    savePipelineDraft: vi.fn().mockResolvedValue(undefined),
    setPipelineDraft: vi.fn(),
    setPipelineSource: vi.fn(),
    setStepArgsText: vi.fn(),
    setStepCommandId: vi.fn(),
    setStepContinueOnError: vi.fn(),
    setStepFlagsText: vi.fn(),
    setStepLabel: vi.fn(),
    stepArgsText: "",
    stepCommandId: "",
    stepContinueOnError: false,
    stepFlagsText: "",
    stepLabel: "",
    ...overrides,
  } as unknown as Workbench;
}

describe("PipelinesView", () => {
  it("renders pipeline cards without the old workspace card header or inline builder", () => {
    const markup = renderToStaticMarkup(<PipelinesView workbench={workbench()} />);

    expect(markup).toContain("New pipeline");
    expect(markup).toContain("Desktop UI review");
    expect(markup).toContain("Inspect repository");
    expect(markup).not.toContain("Compose and preview workflow pipelines with local mock state.");
    expect(markup).not.toContain("Pipeline builder");
    expect(markup).not.toContain("Build a local draft without writing files or running commands.");
  });

  it("keeps the list creation action on the pipeline page", () => {
    const onCreatePipeline = vi.fn();
    const markup = renderToStaticMarkup(
      <PipelineListPage
        pipelines={pipelines}
        onCreatePipeline={onCreatePipeline}
        onRemovePipeline={vi.fn()}
        onRunPipeline={vi.fn()}
      />,
    );

    expect(markup).toContain("New pipeline");
    expect(markup).toContain("Desktop UI review");
  });

  it("renders the builder as a dedicated page without the removed heading copy", () => {
    const markup = renderToStaticMarkup(
      <PipelineBuilderPage
        workbench={workbench()}
        onBack={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(markup).toContain("Back");
    expect(markup).toContain("Save mock pipeline");
    expect(markup).toContain("Name");
    expect(markup).toContain("Description");
    expect(markup).not.toContain("Pipeline builder");
    expect(markup).not.toContain("Build a local draft without writing files or running commands.");
  });
});
