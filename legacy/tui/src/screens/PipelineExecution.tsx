import React, { useState, useEffect, useMemo } from "react";
import { Box, Text } from "ink";
import { SelectList } from "../components/SelectList.js";
import { StepIndicator } from "../components/StepIndicator.js";
import { PipelineProgressBar } from "../components/PipelineProgress.js";
import { Divider } from "../components/Divider.js";
import { StatusBar } from "../components/StatusBar.js";
import { TerminalBox } from "../components/TerminalBox.js";
import { useOutputFocus } from "../hooks/useOutputFocus.js";
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
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase = "running" | "done";

export function PipelineExecution({
  pipelineId,
  onBack,
  onExit,
  width = 80,
  height = 24,
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
  const [stepOutput, setStepOutput] = useState<Record<number, { stdout: string; stderr: string }>>({});
  const { outputFocused } = useOutputFocus(isInputActive && phase === "done");

  useEffect(() => {
    if (!pipeline) return;
    let cancelled = false;

    executePipeline(
      pipeline,
      (p) => {
        if (cancelled) return;
        setProgress({ ...p });
        if (p.done) {
          setResults(p.stepResults);
          setPhase("done");
        }
      },
      process.cwd(),
      {
        onStepOutput: (stepIndex, stdout, stderr) => {
          if (cancelled) return;
          setStepOutput((prev) => ({
            ...prev,
            [stepIndex]: { stdout, stderr },
          }));
        },
      },
    ).catch(() => {
      if (!cancelled) setPhase("done");
    });

    return () => { cancelled = true; };
  }, [pipeline]);

  if (!pipeline) {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Text color="red">Pipeline not found: {pipelineId}</Text>
        <SelectList
          items={[{ value: "__back__", label: "\u2190 Back" }]}
          onSelect={onBack}
          onCancel={onBack}
          boxedSections={panelMode}
          width={panelMode ? Math.max(20, width - 4) : width}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
          panelFocused={isInputActive}
        />
      </Box>
    );
  }

  const stepResults = progress?.stepResults ?? [];
  const completedCount = stepResults.filter(
    (s) => s.status === "success" || s.status === "error" || s.status === "skipped",
  ).length;
  const errorCount = stepResults.filter((s) => s.status === "error").length;
  const currentStepIndex = progress?.currentStepIndex ?? 0;

  function getStepLabel(step: { commandId: string; args: string[] }): string {
    const cmdDef = getCommandById(step.commandId);
    const base = cmdDef ? `${cmdDef.tool}: ${cmdDef.label}` : step.commandId;
    return step.args.length > 0 ? `${base} ${step.args.join(" ")}` : base;
  }

  // Calculate output box height: header (2) + progress bar (1) + divider (1) + steps + gap (1) + border (2) + select/status (~4) = ~11 + steps
  const stepsCount = pipeline.steps.length;
  const outputBoxHeight = Math.max(3, height - 11 - stepsCount);
  const cardWidth = Math.max(30, (panelMode ? width - 4 : width) - 2);

  // Determine what output to show
  const currentOutput = stepOutput[currentStepIndex];
  // In done phase, find the last failed step or the last step
  const doneStepIndex = phase === "done"
    ? (results.findIndex((r) => r.status === "error") !== -1
      ? results.findIndex((r) => r.status === "error")
      : results.length - 1)
    : currentStepIndex;
  const doneOutput = stepOutput[doneStepIndex];

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      <Box marginBottom={1} gap={1}>
        <Text bold color={inkColors.accent}>
          {"\uD83D\uDD17"} {pipeline.name}
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

      {/* Output box for current/failed step */}
      {phase === "running" && (
        <TerminalBox
          stdout={currentOutput?.stdout}
          stderr={currentOutput?.stderr}
          height={outputBoxHeight}
          width={cardWidth}
          isActive={isInputActive}
          copyEnabled={isInputActive}
          focused={true}
          autoScrollToBottom
          emptyMessage="Waiting for output..."
          title={`Step ${currentStepIndex + 1} output`}
          footerHints={[
            { key: "\u2191\u2193", label: "scroll" },
            { key: "c", label: "copy" },
          ]}
        />
      )}

      {phase === "done" && (
        <>
          {doneOutput && (
            <TerminalBox
              stdout={doneOutput.stdout}
              stderr={doneOutput.stderr}
              height={outputBoxHeight}
              width={cardWidth}
              isActive={isInputActive && outputFocused}
              copyEnabled={isInputActive && outputFocused}
              focused={outputFocused}
              borderColor={errorCount > 0 ? "red" : undefined}
              autoScrollToBottom
              title={errorCount > 0 ? `Step ${doneStepIndex + 1} error output` : `Step ${doneStepIndex + 1} output`}
              footerHints={[
                { key: "/", label: outputFocused ? "menu" : "scroll" },
                ...(outputFocused ? [{ key: "\u2191\u2193", label: "scroll" }, { key: "c", label: "copy" }] : []),
              ]}
            />
          )}

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
              { value: "__back__", label: "\u2190 Back" },
              { value: "__exit__", label: "\uD83D\uDEAA Exit" },
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
            isInputActive={isInputActive && !outputFocused}
            arrowNavigation={panelMode}
            panelFocused={isInputActive && !outputFocused}
          />
        </>
      )}

      {!panelMode && (
        <StatusBar
          hint={phase === "running" ? "Running pipeline..." : "Enter select \u00B7 Esc back"}
          width={width}
        />
      )}
    </Box>
  );
}
