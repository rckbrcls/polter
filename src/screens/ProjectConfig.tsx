import React, { useMemo, useState } from "react";
import { Box, Text } from "ink";
import { SelectList } from "../components/SelectList.js";
import { TextPrompt } from "../components/TextPrompt.js";
import { StatusBar } from "../components/StatusBar.js";
import { inkColors } from "../theme.js";
import {
  getOrCreateProjectConfig,
  writeProjectConfig,
  getProjectConfigPath,
} from "../config/projectConfig.js";
import { useEditor } from "../hooks/useEditor.js";

interface ProjectConfigProps {
  onBack: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase = "overview" | "edit-supabase-ref" | "edit-vercel-id" | "edit-gh-repo";

export function ProjectConfig({
  onBack,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: ProjectConfigProps): React.ReactElement {
  const configPath = useMemo(() => getProjectConfigPath(), []);
  const [config, setConfig] = useState(() => getOrCreateProjectConfig());
  const [phase, setPhase] = useState<Phase>("overview");
  const [feedback, setFeedback] = useState<string>();
  const { openEditor, isEditing } = useEditor();

  if (!configPath) {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Text color="red">
          No package.json found. Run from a project directory.
        </Text>
        {!panelMode && (
          <SelectList
            items={[{ value: "__back__", label: "← Back" }]}
            onSelect={onBack}
            onCancel={onBack}
            width={width}
            isInputActive={isInputActive}
          />
        )}
      </Box>
    );
  }

  if (phase === "edit-supabase-ref") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <TextPrompt
          label="Supabase project ref:"
          placeholder="e.g. abcdefghijklmnop"
          onSubmit={(val) => {
            const updated = {
              ...config,
              tools: {
                ...config.tools,
                supabase: { ...config.tools.supabase, projectRef: val.trim() || undefined },
              },
            };
            writeProjectConfig(updated);
            setConfig(updated);
            setFeedback("Supabase project ref updated");
            setPhase("overview");
          }}
          onCancel={() => setPhase("overview")}
          arrowNavigation={panelMode}
          isInputActive={isInputActive}
        />
      </Box>
    );
  }

  if (phase === "edit-vercel-id") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <TextPrompt
          label="Vercel project ID:"
          placeholder="e.g. prj_xxxx"
          onSubmit={(val) => {
            const updated = {
              ...config,
              tools: {
                ...config.tools,
                vercel: { ...config.tools.vercel, projectId: val.trim() || undefined },
              },
            };
            writeProjectConfig(updated);
            setConfig(updated);
            setFeedback("Vercel project ID updated");
            setPhase("overview");
          }}
          onCancel={() => setPhase("overview")}
          arrowNavigation={panelMode}
          isInputActive={isInputActive}
        />
      </Box>
    );
  }

  if (phase === "edit-gh-repo") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <TextPrompt
          label="GitHub repo (owner/name):"
          placeholder="e.g. myorg/my-app"
          onSubmit={(val) => {
            const updated = {
              ...config,
              tools: {
                ...config.tools,
                gh: { ...config.tools.gh, repo: val.trim() || undefined },
              },
            };
            writeProjectConfig(updated);
            setConfig(updated);
            setFeedback("GitHub repo updated");
            setPhase("overview");
          }}
          onCancel={() => setPhase("overview")}
          arrowNavigation={panelMode}
          isInputActive={isInputActive}
        />
      </Box>
    );
  }

  const configItems = [
    { value: "__section_current__", label: "📋 Current Values", kind: "header" as const, selectable: false },
    { value: "__info_supabase__", label: `Supabase ref: ${config.tools.supabase?.projectRef ?? "not set"}`, kind: "header" as const, selectable: false },
    { value: "__info_vercel__", label: `Vercel ID: ${config.tools.vercel?.projectId ?? "not set"}`, kind: "header" as const, selectable: false },
    { value: "__info_gh__", label: `GitHub repo: ${config.tools.gh?.repo ?? "not set"}`, kind: "header" as const, selectable: false },
    { value: "__section_actions__", label: "⚡ Actions", kind: "header" as const, selectable: false },
    { value: "supabase", label: "Set Supabase project ref", kind: "action" as const },
    { value: "vercel", label: "Set Vercel project ID", kind: "action" as const },
    { value: "gh", label: "Set GitHub repo", kind: "action" as const },
    { value: "editor", label: "Open config in editor", kind: "action" as const },
    ...(!panelMode ? [{ value: "__back__", label: "← Back" }] : []),
  ];

  const flatItems = [
    { value: "supabase", label: "Set Supabase project ref" },
    { value: "vercel", label: "Set Vercel project ID" },
    { value: "gh", label: "Set GitHub repo" },
    { value: "editor", label: "Open config in editor" },
    ...(!panelMode ? [{ value: "__back__", label: "← Back" }] : []),
  ];

  const handleSelect = (value: string) => {
    switch (value) {
      case "supabase":
        setPhase("edit-supabase-ref");
        break;
      case "vercel":
        setPhase("edit-vercel-id");
        break;
      case "gh":
        setPhase("edit-gh-repo");
        break;
      case "editor":
        openEditor(configPath!.file).then(() => {
          try {
            const reloaded = getOrCreateProjectConfig();
            setConfig(reloaded);
            setFeedback("Config reloaded from file");
          } catch {
            setFeedback("Warning: could not parse config after editing");
          }
        });
        break;
      default:
        onBack();
    }
  };

  if (panelMode) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box marginBottom={1}>
          <Text bold color={inkColors.accent}>
            ⚙️ Project Config
          </Text>
        </Box>

        <Box marginBottom={1} marginLeft={2}>
          <Text dimColor>Path: {configPath.file}</Text>
        </Box>

        {feedback && (
          <Box marginBottom={1}>
            <Text color={inkColors.accent}>✓ {feedback}</Text>
          </Box>
        )}

        <SelectList
          items={configItems}
          onSelect={handleSelect}
          onCancel={onBack}
          boxedSections
          width={Math.max(20, width - 4)}
          maxVisible={Math.max(6, height - 6)}
          isInputActive={isInputActive}
          arrowNavigation
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={inkColors.accent}>
          ⚙️ Project Config
        </Text>
      </Box>

      <Box marginBottom={1} marginLeft={2} flexDirection="column">
        <Text dimColor>Path: {configPath.file}</Text>
        <Text>
          Supabase ref: {config.tools.supabase?.projectRef ?? <Text dimColor>not set</Text>}
        </Text>
        <Text>
          Vercel ID: {config.tools.vercel?.projectId ?? <Text dimColor>not set</Text>}
        </Text>
        <Text>
          GitHub repo: {config.tools.gh?.repo ?? <Text dimColor>not set</Text>}
        </Text>
      </Box>

      {feedback && (
        <Box marginBottom={1}>
          <Text color={inkColors.accent}>✓ {feedback}</Text>
        </Box>
      )}

      <SelectList
        items={flatItems}
        onSelect={handleSelect}
        onCancel={onBack}
        width={width}
        isInputActive={isInputActive}
        arrowNavigation={panelMode}
      />

      <StatusBar hint="↑↓ navigate · Enter select · Esc back" width={width} />
    </Box>
  );
}
