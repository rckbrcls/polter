import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { SelectList, type SelectItem } from "../components/SelectList.js";
import { StatusBar } from "../components/StatusBar.js";
import { inkColors } from "../theme.js";
import { getAllPipelines } from "../pipeline/storage.js";
import type { NavigationParams, Screen } from "../hooks/useNavigation.js";

interface PipelineListProps {
  onNavigate: (screen: Screen, params?: NavigationParams) => void;
  onBack: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

export function PipelineList({
  onNavigate,
  onBack,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: PipelineListProps): React.ReactElement {
  const pipelines = useMemo(() => getAllPipelines(), []);

  const items: SelectItem[] = useMemo(() => {
    const list: SelectItem[] = [];

    if (pipelines.length === 0) {
      list.push({
        id: "empty-hint",
        value: "__empty__",
        label: "No pipelines yet",
        kind: "header",
        selectable: false,
      });
    } else {
      list.push({
        id: "section-pipelines",
        value: "__section__",
        label: "🔗 Saved Pipelines",
        kind: "header",
        selectable: false,
      });

      for (const pipeline of pipelines) {
        list.push({
          id: `pipeline:${pipeline.id}`,
          value: pipeline.id,
          label: pipeline.name,
          hint: `${pipeline.steps.length} steps · ${pipeline.source}${pipeline.description ? ` · ${pipeline.description}` : ""}`,
          kind: "action",
        });
      }
    }

    list.push({
      id: "section-actions",
      value: "__section_actions__",
      label: "⚡ Actions",
      kind: "header",
      selectable: false,
    });

    list.push({
      id: "action-new",
      value: "__new__",
      label: "Create Pipeline",
      hint: "Build a new command sequence",
      icon: "➕",
      kind: "action",
    });
    if (!panelMode) {
      list.push({
        id: "action-back",
        value: "__back__",
        label: "← Back",
        kind: "action",
      });
    }

    return list;
  }, [pipelines, panelMode]);

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      {!panelMode && (
        <Box marginBottom={1}>
          <Text bold color={inkColors.accent}>
            🔗 Pipelines
          </Text>
        </Box>
      )}

      <SelectList
        items={items}
        onSelect={(value) => {
          if (value === "__back__") {
            onBack();
            return;
          }
          if (value === "__new__") {
            onNavigate("pipeline-builder");
            return;
          }
          // Run existing pipeline
          onNavigate("pipeline-execution", { pipelineId: value });
        }}
        onCancel={onBack}
        boxedSections={panelMode}
        width={panelMode ? Math.max(20, width - 4) : width}
        maxVisible={panelMode ? Math.max(6, height - 6) : undefined}
        isInputActive={isInputActive}
        arrowNavigation={panelMode}
        panelFocused={isInputActive}
      />

      {!panelMode && <StatusBar hint="↑↓ navigate · Enter select · Esc back" width={width} />}
    </Box>
  );
}
