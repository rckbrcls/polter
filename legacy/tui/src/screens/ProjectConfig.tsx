import React, { useEffect, useMemo, useState } from "react";
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
import { detectPkgManager, type PkgManagerId } from "../lib/pkgManager.js";

interface ProjectConfigProps {
  onBack: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase =
  | "overview"
  | "edit-supabase-ref"
  | "edit-vercel-id"
  | "edit-gh-repo"
  | "edit-pkg-manager"
  | "add-env-var"
  | "add-env-value"
  | "manage-env-entry";

export function ProjectConfig({
  onBack,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: ProjectConfigProps): React.ReactElement {
  const configPath = useMemo(() => getProjectConfigPath(), []);
  const [config, setConfig] = useState<ReturnType<typeof getOrCreateProjectConfig> | null>(null);
  const [phase, setPhase] = useState<Phase>("overview");
  const [feedback, setFeedback] = useState<string>();
  const [envKey, setEnvKey] = useState("");
  const [selectedEnvKey, setSelectedEnvKey] = useState("");
  const { openEditor, isEditing } = useEditor();
  const [detectedPkg, setDetectedPkg] = useState<ReturnType<typeof detectPkgManager> | null>(null);

  useEffect(() => {
    setConfig(getOrCreateProjectConfig());
    setDetectedPkg(detectPkgManager());
  }, []);

  if (!config || !detectedPkg) {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Text color={inkColors.accent}>Loading config...</Text>
      </Box>
    );
  }

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
          boxed={panelMode}
          focused={isInputActive}
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
          boxed={panelMode}
          focused={isInputActive}
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
          boxed={panelMode}
          focused={isInputActive}
        />
      </Box>
    );
  }

  if (phase === "edit-pkg-manager") {
    const pkgOptions = [
      { value: "npm", label: "npm" },
      { value: "pnpm", label: "pnpm" },
      { value: "yarn", label: "yarn" },
      { value: "bun", label: "bun" },
      { value: "__auto__", label: `auto-detect (${detectedPkg.id})` },
      { value: "__cancel__", label: "\u2190 Cancel" },
    ];

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Box marginBottom={1}>
          <Text bold>Select package manager:</Text>
        </Box>
        <SelectList
          items={pkgOptions}
          onSelect={(value) => {
            if (value === "__cancel__") {
              setPhase("overview");
              return;
            }
            const manager = value === "__auto__" ? undefined : (value as PkgManagerId);
            const updated = {
              ...config,
              tools: {
                ...config.tools,
                pkg: manager ? { ...config.tools.pkg, manager } : {},
              },
            };
            writeProjectConfig(updated);
            setConfig(updated);
            setFeedback(manager ? `Package manager set to ${manager}` : "Package manager cleared (auto-detect)");
            setPhase("overview");
          }}
          onCancel={() => setPhase("overview")}
          width={panelMode ? Math.max(20, width - 4) : width}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
          panelFocused={panelMode ? isInputActive : undefined}
        />
      </Box>
    );
  }

  if (phase === "add-env-var") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <TextPrompt
          label="Environment variable name:"
          placeholder="e.g. API_KEY"
          onSubmit={(val) => {
            const key = val.trim();
            if (!key) {
              setPhase("overview");
              return;
            }
            setEnvKey(key);
            setPhase("add-env-value");
          }}
          onCancel={() => setPhase("overview")}
          arrowNavigation={panelMode}
          isInputActive={isInputActive}
          boxed={panelMode}
          focused={isInputActive}
        />
      </Box>
    );
  }

  if (phase === "add-env-value") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <TextPrompt
          label={`Value for ${envKey}:`}
          placeholder="Enter value"
          onSubmit={(val) => {
            const updated = {
              ...config,
              env: { ...config.env, [envKey]: val },
            };
            writeProjectConfig(updated);
            setConfig(updated);
            setFeedback(`Set ${envKey}`);
            setEnvKey("");
            setPhase("overview");
          }}
          onCancel={() => {
            setEnvKey("");
            setPhase("overview");
          }}
          arrowNavigation={panelMode}
          isInputActive={isInputActive}
          boxed={panelMode}
          focused={isInputActive}
        />
      </Box>
    );
  }

  if (phase === "manage-env-entry") {
    const currentVal = config.env?.[selectedEnvKey] ?? "";
    const items = [
      { value: "__info__", label: `${selectedEnvKey} = ${currentVal}`, kind: "header" as const, selectable: false },
      { value: "edit", label: "Edit value", kind: "action" as const },
      { value: "remove", label: "Remove", kind: "action" as const },
      { value: "__cancel__", label: "\u2190 Cancel" },
    ];

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <SelectList
          items={items}
          onSelect={(value) => {
            if (value === "edit") {
              setEnvKey(selectedEnvKey);
              setPhase("add-env-value");
            } else if (value === "remove") {
              const newEnv = { ...config.env };
              delete newEnv[selectedEnvKey];
              const updated = { ...config, env: newEnv };
              writeProjectConfig(updated);
              setConfig(updated);
              setFeedback(`Removed ${selectedEnvKey}`);
              setPhase("overview");
            } else {
              setPhase("overview");
            }
          }}
          onCancel={() => setPhase("overview")}
          width={panelMode ? Math.max(20, width - 4) : width}
          isInputActive={isInputActive}
          arrowNavigation={panelMode}
          panelFocused={panelMode ? isInputActive : undefined}
        />
      </Box>
    );
  }

  const envEntries = Object.entries(config.env ?? {});
  const pkgDisplay = config.tools.pkg?.manager ?? `auto-detect (${detectedPkg.id})`;

  const configItems = [
    { value: "__section_current__", label: "\uD83D\uDCCB Current Values", kind: "header" as const, selectable: false },
    { value: "__info_supabase__", label: `Supabase ref: ${config.tools.supabase?.projectRef ?? "not set"}`, kind: "header" as const, selectable: false },
    { value: "__info_vercel__", label: `Vercel ID: ${config.tools.vercel?.projectId ?? "not set"}`, kind: "header" as const, selectable: false },
    { value: "__info_gh__", label: `GitHub repo: ${config.tools.gh?.repo ?? "not set"}`, kind: "header" as const, selectable: false },
    { value: "__info_pkg__", label: `Pkg manager: ${pkgDisplay}`, kind: "header" as const, selectable: false },
    { value: "__info_pipelines__", label: `Pipelines: ${config.pipelines.length}`, kind: "header" as const, selectable: false },
    ...(envEntries.length > 0
      ? [
          { value: "__section_env__", label: "\uD83D\uDD10 Environment Variables", kind: "header" as const, selectable: false },
          ...envEntries.map(([k, v]) => ({
            value: `env:${k}`,
            label: `${k} = ${v}`,
            kind: "action" as const,
          })),
        ]
      : []),
    { value: "__section_actions__", label: "\u26A1 Actions", kind: "header" as const, selectable: false },
    { value: "supabase", label: "Set Supabase project ref", kind: "action" as const },
    { value: "vercel", label: "Set Vercel project ID", kind: "action" as const },
    { value: "gh", label: "Set GitHub repo", kind: "action" as const },
    { value: "pkg-manager", label: "Set package manager", kind: "action" as const },
    { value: "add-env", label: "Add environment variable", kind: "action" as const },
    { value: "editor", label: "Open config in editor", kind: "action" as const },
    ...(!panelMode ? [{ value: "__back__", label: "\u2190 Back" }] : []),
  ];

  const flatItems = [
    { value: "supabase", label: "Set Supabase project ref" },
    { value: "vercel", label: "Set Vercel project ID" },
    { value: "gh", label: "Set GitHub repo" },
    { value: "pkg-manager", label: "Set package manager" },
    { value: "add-env", label: "Add environment variable" },
    { value: "editor", label: "Open config in editor" },
    ...(!panelMode ? [{ value: "__back__", label: "\u2190 Back" }] : []),
  ];

  const handleSelect = (value: string) => {
    if (value.startsWith("env:")) {
      setSelectedEnvKey(value.slice(4));
      setPhase("manage-env-entry");
      return;
    }

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
      case "pkg-manager":
        setPhase("edit-pkg-manager");
        break;
      case "add-env":
        setPhase("add-env-var");
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
          panelFocused={isInputActive}
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
        <Text>
          Pkg manager: {pkgDisplay}
        </Text>
        <Text>
          Pipelines: {config.pipelines.length}
        </Text>
        {envEntries.length > 0 && (
          <>
            <Text bold>{"\n"}Environment Variables:</Text>
            {envEntries.map(([k, v]) => (
              <Text key={k}>  {k} = {v}</Text>
            ))}
          </>
        )}
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
