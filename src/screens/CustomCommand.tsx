import React, { useState } from "react";
import { Box, Text } from "ink";
import { TextPrompt } from "../components/TextPrompt.js";
import { SelectList } from "../components/SelectList.js";
import { StatusBar } from "../components/StatusBar.js";
import { inkColors } from "../theme.js";
import type { NavigationParams, Screen } from "../hooks/useNavigation.js";
import type { CliToolId } from "../data/types.js";

interface CustomCommandProps {
  onNavigate: (screen: Screen, params?: NavigationParams) => void;
  onBack: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase = "tool-select" | "input";

export function CustomCommand({
  onNavigate,
  onBack,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: CustomCommandProps): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("tool-select");
  const [selectedTool, setSelectedTool] = useState<CliToolId>("supabase");

  if (phase === "tool-select") {
    const toolItems = [
      { value: "__section__", label: "🛠 Select Tool", kind: "header" as const, selectable: false },
      { value: "supabase", label: "Supabase CLI", hint: "supabase ...", kind: "action" as const },
      { value: "gh", label: "GitHub CLI", hint: "gh ...", kind: "action" as const },
      { value: "vercel", label: "Vercel CLI", hint: "vercel ...", kind: "action" as const },
      { value: "git", label: "Git", hint: "git ...", kind: "action" as const },
      ...(!panelMode ? [{ value: "__back__", label: "← Back" }] : []),
    ];

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Box marginBottom={1}>
          <Text bold color={inkColors.accent}>
            ✏️ Custom Command
          </Text>
        </Box>
        {!panelMode && <Text dimColor>Select tool:</Text>}

        <SelectList
          items={toolItems}
          onSelect={(value) => {
            if (value === "__back__") {
              onBack();
              return;
            }
            setSelectedTool(value as CliToolId);
            setPhase("input");
          }}
          onCancel={onBack}
          boxedSections={panelMode}
          width={panelMode ? Math.max(20, width - 4) : width}
          maxVisible={panelMode ? Math.max(6, height - 6) : undefined}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
        />

        {!panelMode && <StatusBar hint="↑↓ navigate · Enter select · Esc back" width={width} />}
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      <Box marginBottom={1} gap={1}>
        <Text bold color={inkColors.accent}>
          ✏️ Custom Command
        </Text>
        <Text dimColor>({selectedTool})</Text>
      </Box>

      <TextPrompt
        label={`Enter your ${selectedTool} command/flags:`}
        placeholder={`e.g. ${selectedTool === "supabase" ? "-v, status -o json, db pull" : selectedTool === "gh" ? "pr list, issue create" : "deploy, env ls"}`}
        validate={(val) => {
          if (!val || !val.trim()) return "Please enter a command";
          return undefined;
        }}
        onSubmit={(value) => {
          const args = value.split(" ").filter(Boolean);
          onNavigate("flag-selection", { args, tool: selectedTool });
        }}
        onCancel={() => setPhase("tool-select")}
      />

      {!panelMode && <StatusBar hint="Type a command · Enter to continue · Esc to go back" width={width} />}
    </Box>
  );
}
