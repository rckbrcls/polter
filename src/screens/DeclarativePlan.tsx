import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { SelectList } from "../components/SelectList.js";
import { StatusBar } from "../components/StatusBar.js";
import { inkColors } from "../theme.js";
import { findPolterYaml, parsePolterYaml } from "../declarative/parser.js";
import { planChanges } from "../declarative/planner.js";
import { applyActions } from "../declarative/applier.js";
import type { ApplyResult } from "../declarative/applier.js";
import type { PlanAction } from "../declarative/schema.js";
import { useEditor } from "../hooks/useEditor.js";
import type { Screen } from "../data/types.js";
import type { NavigationParams } from "../hooks/useNavigation.js";

interface DeclarativePlanProps {
  onBack: () => void;
  onNavigate?: (screen: Screen, params?: NavigationParams) => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase = "loading" | "no-yaml" | "plan-view" | "applying" | "results";

export function DeclarativePlan({
  onBack,
  onNavigate,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: DeclarativePlanProps): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("loading");
  const [actions, setActions] = useState<PlanAction[]>([]);
  const [applyProgress, setApplyProgress] = useState("");
  const [applyResults, setApplyResults] = useState<ApplyResult[]>([]);
  const { openEditor } = useEditor();

  const loadPlan = () => {
    setPhase("loading");
    setTimeout(() => {
      const yamlPath = findPolterYaml();
      if (!yamlPath) {
        setPhase("no-yaml");
        return;
      }
      const yaml = parsePolterYaml();
      if (!yaml) {
        setPhase("no-yaml");
        return;
      }
      const plan = planChanges(yaml);
      setActions(plan.actions);
      setPhase("plan-view");
    }, 0);
  };

  useEffect(() => {
    loadPlan();
  }, []);

  if (phase === "loading") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Text color={inkColors.accent}>Loading plan...</Text>
      </Box>
    );
  }

  if (phase === "no-yaml") {
    const items = [
      ...(onNavigate
        ? [{ value: "init", label: "Init from current state", kind: "action" as const }]
        : []),
      { value: "editor", label: "Open editor to create polter.yaml", kind: "action" as const },
      ...(!panelMode ? [{ value: "__back__", label: "\u2190 Back" }] : []),
    ];

    const handleSelect = (value: string) => {
      if (value === "init" && onNavigate) {
        onNavigate("init-scaffold");
      } else if (value === "editor") {
        const cwd = process.cwd();
        openEditor(`${cwd}/polter.yaml`).then(() => loadPlan());
      } else {
        onBack();
      }
    };

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Box marginBottom={1}>
          <Text color="yellow">No polter.yaml found in the current directory.</Text>
        </Box>
        <SelectList
          items={items}
          onSelect={handleSelect}
          onCancel={onBack}
          width={panelMode ? Math.max(20, width - 4) : width}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
          panelFocused={panelMode ? isInputActive : undefined}
        />
        {!panelMode && <StatusBar hint="Enter select \u00B7 Esc back" width={width} />}
      </Box>
    );
  }

  if (phase === "applying") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Box marginBottom={1}>
          <Text bold color={inkColors.accent}>Applying changes...</Text>
        </Box>
        <Text>{applyProgress}</Text>
      </Box>
    );
  }

  if (phase === "results") {
    const resultItems = [
      { value: "__section_results__", label: "Results", kind: "header" as const, selectable: false },
      ...applyResults.map((r, i) => ({
        value: `result-${i}`,
        label: `${r.success ? "\u2713" : "\u2717"} ${r.action.description}`,
        hint: r.success ? "success" : (r.result.stderr || "failed"),
        kind: "header" as const,
        selectable: false,
      })),
      { value: "__section_actions__", label: "Actions", kind: "header" as const, selectable: false },
      { value: "replan", label: "Re-run plan", kind: "action" as const },
      ...(!panelMode ? [{ value: "__back__", label: "\u2190 Back" }] : []),
    ];

    const handleSelect = (value: string) => {
      if (value === "replan") {
        loadPlan();
      } else {
        onBack();
      }
    };

    if (panelMode) {
      return (
        <Box flexDirection="column" paddingX={1}>
          <SelectList
            items={resultItems}
            onSelect={handleSelect}
            onCancel={onBack}
            boxedSections
            width={Math.max(20, width - 4)}
            maxVisible={Math.max(6, height - 6)}
            isInputActive={isInputActive}
            arrowNavigation
            panelFocused={isInputActive}
          />
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color={inkColors.accent}>Apply Results</Text>
        </Box>
        <SelectList
          items={resultItems}
          onSelect={handleSelect}
          onCancel={onBack}
          boxedSections
          width={width}
          maxVisible={Math.max(8, height - 10)}
          isInputActive={isInputActive}
        />
        <StatusBar hint="Enter select \u00B7 Esc back" width={width} />
      </Box>
    );
  }

  // plan-view phase
  const actionPrefix = (a: PlanAction) => {
    switch (a.action) {
      case "create": return "+";
      case "update": return "~";
      case "delete": return "-";
    }
  };

  const actionColor = (a: PlanAction) => {
    switch (a.action) {
      case "create": return "green";
      case "update": return "yellow";
      case "delete": return "red";
    }
  };

  const planItems = [
    {
      value: "__section_plan__",
      label: actions.length > 0 ? `Plan: ${actions.length} action${actions.length > 1 ? "s" : ""}` : "No changes needed",
      kind: "header" as const,
      selectable: false,
    },
    ...actions.map((a, i) => ({
      value: `action-${i}`,
      label: `${actionPrefix(a)} ${a.description}`,
      hint: `${a.tool} ${a.resource}`,
      kind: "header" as const,
      selectable: false,
    })),
    { value: "__section_actions__", label: "Actions", kind: "header" as const, selectable: false },
    ...(actions.length > 0
      ? [{ value: "apply", label: "Apply all changes", kind: "action" as const }]
      : []),
    { value: "editor", label: "Open polter.yaml in editor", kind: "action" as const },
    { value: "refresh", label: "Refresh plan", kind: "action" as const },
    ...(!panelMode ? [{ value: "__back__", label: "\u2190 Back" }] : []),
  ];

  const handleSelect = (value: string) => {
    if (value === "apply") {
      setPhase("applying");
      applyActions(actions, process.cwd(), (completed, total, current) => {
        setApplyProgress(`[${completed + 1}/${total}] ${current.description}...`);
      }).then((results) => {
        setApplyResults(results);
        setPhase("results");
      });
    } else if (value === "editor") {
      const yamlPath = findPolterYaml();
      if (yamlPath) {
        openEditor(yamlPath).then(() => loadPlan());
      }
    } else if (value === "refresh") {
      loadPlan();
    } else {
      onBack();
    }
  };

  if (panelMode) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <SelectList
          items={planItems}
          onSelect={handleSelect}
          onCancel={onBack}
          boxedSections
          width={Math.max(20, width - 4)}
          maxVisible={Math.max(6, height - 6)}
          isInputActive={isInputActive}
          arrowNavigation
          panelFocused={isInputActive}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={inkColors.accent}>
          Plan / Apply
        </Text>
      </Box>

      <SelectList
        items={planItems}
        onSelect={handleSelect}
        onCancel={onBack}
        boxedSections
        width={width}
        maxVisible={Math.max(8, height - 10)}
        isInputActive={isInputActive}
      />

      <StatusBar hint="Enter select \u00B7 Esc back" width={width} />
    </Box>
  );
}
