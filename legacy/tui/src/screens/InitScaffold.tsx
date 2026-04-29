import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { SelectList } from "../components/SelectList.js";
import { StatusBar } from "../components/StatusBar.js";
import { inkColors } from "../theme.js";
import { findPolterYaml } from "../declarative/parser.js";
import { getCurrentStatus } from "../declarative/status.js";
import { getOrCreateProjectConfig } from "../config/projectConfig.js";
import { detectPkgManager } from "../lib/pkgManager.js";
import { generatePolterYaml } from "../lib/yamlWriter.js";
import { useEditor } from "../hooks/useEditor.js";
import type { PolterYaml } from "../declarative/schema.js";
import type { Screen } from "../data/types.js";
import type { NavigationParams } from "../hooks/useNavigation.js";

interface InitScaffoldProps {
  onBack: () => void;
  onNavigate?: (screen: Screen, params?: NavigationParams) => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase = "detecting" | "already-exists" | "preview" | "writing" | "done";

export function InitScaffold({
  onBack,
  onNavigate,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: InitScaffoldProps): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("detecting");
  const [yamlString, setYamlString] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const { openEditor } = useEditor();

  const cwd = process.cwd();
  const yamlPath = join(cwd, "polter.yaml");

  const detect = (forceOverwrite = false) => {
    setPhase("detecting");
    setTimeout(() => {
      const existing = findPolterYaml();
      if (existing && !forceOverwrite) {
        setPhase("already-exists");
        return;
      }

      const status = getCurrentStatus();
      const config = getOrCreateProjectConfig();
      const pkg = detectPkgManager();

      const yaml: PolterYaml = {
        version: 1,
        project: { name: cwd.split("/").pop() ?? "my-project" },
      };

      if (status.supabase) {
        yaml.supabase = {};
        if (config.tools.supabase?.projectRef) {
          yaml.supabase.project_ref = config.tools.supabase.projectRef;
        }
        if (status.supabase.functions && status.supabase.functions.length > 0) {
          yaml.supabase.functions = status.supabase.functions.map((name) => ({ name }));
        }
      }

      if (status.vercel) {
        yaml.vercel = {};
        if (config.tools.vercel?.projectId) {
          yaml.vercel.project_id = config.tools.vercel.projectId;
        }
      }

      if (status.github) {
        yaml.github = {};
        if (status.github.repo) {
          yaml.github.repo = status.github.repo;
        }
      }

      yaml.pkg = { manager: config.tools.pkg?.manager ?? pkg.id };

      const generated = generatePolterYaml(yaml);
      setYamlString(generated);
      setPhase("preview");
    }, 0);
  };

  useEffect(() => {
    detect();
  }, []);

  if (phase === "detecting") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Text color={inkColors.accent}>Detecting project state...</Text>
      </Box>
    );
  }

  if (phase === "already-exists") {
    const items = [
      { value: "editor", label: "Open in editor", kind: "action" as const },
      { value: "overwrite", label: "Overwrite with detected state", kind: "action" as const },
      ...(!panelMode ? [{ value: "__back__", label: "\u2190 Back" }] : []),
    ];

    const handleSelect = (value: string) => {
      if (value === "editor") {
        openEditor(yamlPath);
      } else if (value === "overwrite") {
        detect(true);
      } else {
        onBack();
      }
    };

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Box marginBottom={1}>
          <Text color="yellow">polter.yaml already exists.</Text>
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

  if (phase === "preview") {
    const previewLines = yamlString.split("\n").slice(0, Math.max(8, height - 12));

    const items = [
      { value: "write", label: "Write polter.yaml", kind: "action" as const },
      { value: "edit-first", label: "Edit before writing", kind: "action" as const },
      ...(!panelMode ? [{ value: "__back__", label: "\u2190 Back" }] : []),
    ];

    const handleSelect = (value: string) => {
      if (value === "write") {
        writeFileSync(yamlPath, yamlString, "utf-8");
        setPhase("done");
      } else if (value === "edit-first") {
        writeFileSync(yamlPath, yamlString, "utf-8");
        openEditor(yamlPath);
      } else {
        onBack();
      }
    };

    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Box marginBottom={1}>
          <Text bold color={inkColors.accent}>Preview: polter.yaml</Text>
        </Box>

        <Box flexDirection="column" marginBottom={1} marginLeft={panelMode ? 1 : 2}>
          {previewLines.map((line, i) => (
            <Text key={i} dimColor>{line}</Text>
          ))}
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

  if (phase === "writing") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Text color={inkColors.accent}>Writing polter.yaml...</Text>
      </Box>
    );
  }

  // done phase
  const items = [
    ...(onNavigate
      ? [{ value: "plan", label: "View plan", kind: "action" as const }]
      : []),
    { value: "editor", label: "Open in editor", kind: "action" as const },
    ...(!panelMode ? [{ value: "__back__", label: "\u2190 Back" }] : []),
  ];

  const handleSelect = (value: string) => {
    if (value === "plan" && onNavigate) {
      onNavigate("declarative-plan");
    } else if (value === "editor") {
      openEditor(yamlPath);
    } else {
      onBack();
    }
  };

  return (
    <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
      <Box marginBottom={1}>
        <Text color={inkColors.accent}>{"\u2713"} polter.yaml created successfully!</Text>
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
