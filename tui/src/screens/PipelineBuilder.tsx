import React, { useState } from "react";
import { Box, Text } from "ink";
import { TextPrompt } from "../components/TextPrompt.js";
import { SelectList, type SelectItem } from "../components/SelectList.js";
import { StatusBar } from "../components/StatusBar.js";
import { inkColors } from "../theme.js";
import { savePipeline } from "../pipeline/storage.js";
import { allCommands, getCommandValue } from "../data/commands/index.js";
import type { Pipeline, PipelineStep } from "../data/types.js";

interface PipelineBuilderProps {
  onBack: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase = "name" | "add-step" | "review";

let stepCounter = 0;
function nextStepId(): string {
  stepCounter += 1;
  return `step-${Date.now()}-${stepCounter}`;
}

export function PipelineBuilder({
  onBack,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: PipelineBuilderProps): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("name");
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<PipelineStep[]>([]);

  if (phase === "name") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Box marginBottom={1}>
          <Text bold color={inkColors.accent}>
            🔗 New Pipeline
          </Text>
        </Box>

        <TextPrompt
          label="Pipeline name:"
          placeholder="e.g. deploy-all"
          validate={(val) => {
            if (!val?.trim()) return "Name is required";
            return undefined;
          }}
          onSubmit={(val) => {
            setName(val.trim());
            setPhase("add-step");
          }}
          onCancel={onBack}
          arrowNavigation={panelMode}
          isInputActive={isInputActive}
          boxed={panelMode}
          focused={isInputActive}
        />

        {!panelMode && <StatusBar hint="Type name · Enter to continue · Esc cancel" width={width} />}
      </Box>
    );
  }

  if (phase === "add-step") {
    const commandItems: SelectItem[] = [
      {
        id: "section-commands",
        value: "__section__",
        label: "Available Commands",
        kind: "header",
        selectable: false,
      },
      ...allCommands.map((cmd) => ({
        id: cmd.id,
        value: cmd.id,
        label: `${cmd.tool}: ${cmd.label}`,
        hint: cmd.hint,
        kind: "command" as const,
      })),
      {
        id: "section-done",
        value: "__section_done__",
        label: "⚡ Actions",
        kind: "header",
        selectable: false,
      },
      {
        id: "action-done",
        value: "__done__",
        label: steps.length > 0 ? "✓ Done - save pipeline" : "← Cancel",
        kind: "action",
      },
    ];

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Box marginBottom={1} gap={1}>
          <Text bold color={inkColors.accent}>
            🔗 {name}
          </Text>
          <Text dimColor>({steps.length} steps)</Text>
        </Box>

        {steps.length > 0 && (
          <Box flexDirection="column" marginBottom={1}>
            {steps.map((step, i) => (
              <Text key={step.id} dimColor>
                {i + 1}. {step.commandId}
                {step.args.length > 0 ? ` ${step.args.join(" ")}` : ""}
              </Text>
            ))}
          </Box>
        )}

        <Text dimColor>Select a command to add as step:</Text>

        <SelectList
          items={commandItems}
          onSelect={(value) => {
            if (value === "__done__") {
              if (steps.length > 0) {
                setPhase("review");
              } else {
                onBack();
              }
              return;
            }

            setSteps((prev) => [
              ...prev,
              {
                id: nextStepId(),
                commandId: value,
                args: [],
                flags: [],
                continueOnError: false,
              },
            ]);
          }}
          onCancel={() => {
            if (steps.length > 0) {
              setPhase("review");
            } else {
              onBack();
            }
          }}
          maxVisible={Math.max(8, height - 14)}
          boxedSections={panelMode}
          width={panelMode ? Math.max(20, width - 4) : width}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
          panelFocused={isInputActive}
        />

        {!panelMode && <StatusBar hint="↑↓ navigate · Enter add step · Esc done" width={width} />}
      </Box>
    );
  }

  // Review phase
  const reviewItems: SelectItem[] = [
    {
      id: "action-save",
      value: "__save__",
      label: "✓ Save pipeline",
      kind: "action",
    },
    {
      id: "action-add-more",
      value: "__add__",
      label: "➕ Add more steps",
      kind: "action",
    },
    {
      id: "action-cancel",
      value: "__cancel__",
      label: "← Cancel",
      kind: "action",
    },
  ];

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      <Box marginBottom={1}>
        <Text bold color={inkColors.accent}>
          🔗 Review: {name}
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        {steps.map((step, i) => (
          <Text key={step.id}>
            {i + 1}. {step.commandId}
            {step.args.length > 0 ? ` ${step.args.join(" ")}` : ""}
          </Text>
        ))}
      </Box>

      <SelectList
        items={reviewItems}
        onSelect={(value) => {
          if (value === "__save__") {
            const now = new Date().toISOString();
            const pipeline: Pipeline = {
              id: `pipeline-${Date.now()}`,
              name,
              steps,
              createdAt: now,
              updatedAt: now,
            };
            savePipeline(pipeline, "project");
            onBack();
            return;
          }
          if (value === "__add__") {
            setPhase("add-step");
            return;
          }
          onBack();
        }}
        onCancel={onBack}
        boxedSections={panelMode}
        width={panelMode ? Math.max(20, width - 4) : width}
        isInputActive={isInputActive}
        arrowNavigation={panelMode}
        panelFocused={isInputActive}
      />

      {!panelMode && <StatusBar hint="↑↓ navigate · Enter select · Esc back" width={width} />}
    </Box>
  );
}
