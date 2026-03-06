import React, { useState, useEffect, useMemo } from "react";
import { Box, Text } from "ink";
import { SelectList } from "../components/SelectList.js";
import { StepIndicator } from "../components/StepIndicator.js";
import { PipelineProgressBar } from "../components/PipelineProgress.js";
import { Divider } from "../components/Divider.js";
import { StatusBar } from "../components/StatusBar.js";
import { inkColors } from "../theme.js";
import {
  executePipeline,
  type PipelineProgress,
  type StepResult,
} from "../pipeline/engine.js";
import { getAllPipelines } from "../pipeline/storage.js";
import { getCommandById } from "../data/commands/index.js";

interface PipelineExecutionProps {
  pipelineId: string;
  onBack: () => void;
  onExit: () => void;
  width?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase = "running" | "done";

export function PipelineExecution({
  pipelineId,
  onBack,
  onExit,
  width = 80,
  panelMode = false,
  isInputActive = true,
}: PipelineExecutionProps): React.ReactElement {
  const pipeline = useMemo(
    () => getAllPipelines().find((p) => p.id === pipelineId),
    [pipelineId],
  );

  const [phase, setPhase] = useState<Phase>("running");
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [results, setResults] = useState<StepResult[]>([]);

  useEffect(() => {
    if (!pipeline) return;

    executePipeline(pipeline, (p) => {
      setProgress({ ...p });
      if (p.done) {
        setResults(p.stepResults);
        setPhase("done");
      }
    }).catch(() => {
      setPhase("done");
    });
  }, [pipeline]);

  if (!pipeline) {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Text color="red">Pipeline not found: {pipelineId}</Text>
        <SelectList
          items={[{ value: "__back__", label: "← Back" }]}
          onSelect={onBack}
          onCancel={onBack}
          boxedSections={panelMode}
          width={panelMode ? Math.max(20, width - 4) : width}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
        />
      </Box>
    );
  }

  const stepResults = progress?.stepResults ?? [];
  const completedCount = stepResults.filter(
    (s) => s.status === "success" || s.status === "error" || s.status === "skipped",
  ).length;
  const errorCount = stepResults.filter((s) => s.status === "error").length;

  function getStepLabel(step: { commandId: string; args: string[] }): string {
    const cmdDef = getCommandById(step.commandId);
    const base = cmdDef ? `${cmdDef.tool}: ${cmdDef.label}` : step.commandId;
    return step.args.length > 0 ? `${base} ${step.args.join(" ")}` : base;
  }

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      <Box marginBottom={1} gap={1}>
        <Text bold color={inkColors.accent}>
          🔗 {pipeline.name}
        </Text>
        <Text dimColor>
          {phase === "running" ? "Running..." : "Complete"}
        </Text>
      </Box>

      <PipelineProgressBar
        total={pipeline.steps.length}
        completed={completedCount}
        errors={errorCount}
        width={width}
      />

      <Divider width={width} />

      <Box flexDirection="column" marginY={1}>
        {pipeline.steps.map((step, i) => (
          <StepIndicator
            key={step.id}
            label={step.label ?? getStepLabel(step)}
            status={stepResults[i]?.status ?? "pending"}
            index={i}
          />
        ))}
      </Box>

      {phase === "done" && (
        <>
          <Divider width={width} />
          <Box marginY={1}>
            <Text
              color={errorCount > 0 ? "red" : inkColors.accent}
              bold
            >
              {errorCount > 0
                ? `Pipeline completed with ${errorCount} error(s)`
                : "Pipeline completed successfully!"}
            </Text>
          </Box>
          <SelectList
            items={[
              { value: "__back__", label: "← Back" },
              { value: "__exit__", label: "🚪 Exit" },
            ]}
            onSelect={(value) => {
              if (value === "__exit__") {
                onExit();
                return;
              }
              onBack();
            }}
            onCancel={onBack}
            boxedSections={panelMode}
            width={panelMode ? Math.max(20, width - 4) : width}
            isInputActive={isInputActive}
            arrowNavigation={panelMode}
          />
        </>
      )}

      {!panelMode && (
        <StatusBar
          hint={phase === "running" ? "Running pipeline..." : "Enter select · Esc back"}
          width={width}
        />
      )}
    </Box>
  );
}
