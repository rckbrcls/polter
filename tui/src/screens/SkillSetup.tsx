import React, { useState } from "react";
import { Box, Text } from "ink";
import { SelectList } from "../components/SelectList.js";
import { StatusBar } from "../components/StatusBar.js";
import { inkColors } from "../theme.js";
import { setupSkill, getSkillContent, getSkillPath, type SkillSetupStatus } from "../lib/skillSetup.js";

interface SkillSetupProps {
  onBack: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase = "preview" | "done";

export function SkillSetup({
  onBack,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: SkillSetupProps): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("preview");
  const [resultStatus, setResultStatus] = useState<SkillSetupStatus | null>(null);

  const skillPath = getSkillPath();

  if (phase === "preview") {
    const content = getSkillContent();
    const previewLines = content.split("\n").slice(0, Math.max(8, height - 12));

    const items = [
      { value: "install", label: "Install skill", kind: "action" as const },
      ...(!panelMode ? [{ value: "__back__", label: "\u2190 Back" }] : []),
    ];

    const handleSelect = (value: string) => {
      if (value === "install") {
        const result = setupSkill();
        setResultStatus(result.status);
        setPhase("done");
      } else {
        onBack();
      }
    };

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Box marginBottom={1}>
          <Text bold color={inkColors.accent}>Preview: ~/.claude/skills/polter/SKILL.md</Text>
        </Box>

        <Box flexDirection="column" marginBottom={1} marginLeft={panelMode ? 1 : 2}>
          {previewLines.map((line, i) => (
            <Text key={i} dimColor>{line}</Text>
          ))}
          {content.split("\n").length > previewLines.length && (
            <Text dimColor>  ...</Text>
          )}
        </Box>

        <Box marginBottom={1}>
          <Text dimColor>Path: {skillPath}</Text>
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

  // done phase
  const statusMessage = resultStatus === "created"
    ? "\u2713 Skill installed successfully!"
    : resultStatus === "updated"
      ? "\u2713 Skill updated successfully!"
      : "\u2713 Skill already up to date.";

  const items = [
    ...(!panelMode ? [{ value: "__back__", label: "\u2190 Back" }] : []),
  ];

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      <Box marginBottom={1}>
        <Text color={inkColors.accent}>{statusMessage}</Text>
      </Box>
      <Box marginBottom={1}>
        <Text dimColor>Path: {skillPath}</Text>
      </Box>
      <Box marginBottom={1}>
        <Text dimColor>Use /polter in Claude Code to activate the skill.</Text>
      </Box>
      {items.length > 0 && (
        <SelectList
          items={items}
          onSelect={onBack}
          onCancel={onBack}
          width={panelMode ? Math.max(20, width - 4) : width}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
          panelFocused={panelMode ? isInputActive : undefined}
        />
      )}
      {!panelMode && <StatusBar hint="Esc back" width={width} />}
    </Box>
  );
}
