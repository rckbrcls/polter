import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { SelectList } from "../components/SelectList.js";
import { StatusBar } from "../components/StatusBar.js";
import { inkColors } from "../theme.js";
import { getCurrentStatus } from "../declarative/status.js";
import { getOrCreateProjectConfig } from "../config/projectConfig.js";
import { detectPkgManager } from "../lib/pkgManager.js";
import type { StatusResult } from "../declarative/schema.js";
import type { ProjectConfig } from "../data/types.js";
import type { PkgManagerInfo } from "../lib/pkgManager.js";

interface DeclarativeStatusProps {
  onBack: () => void;
  width?: number;
  height?: number;
  panelMode?: boolean;
  isInputActive?: boolean;
}

type Phase = "loading" | "display";

export function DeclarativeStatus({
  onBack,
  width = 80,
  height = 24,
  panelMode = false,
  isInputActive = true,
}: DeclarativeStatusProps): React.ReactElement {
  const [phase, setPhase] = useState<Phase>("loading");
  const [status, setStatus] = useState<StatusResult>({});
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [pkgInfo, setPkgInfo] = useState<PkgManagerInfo | null>(null);

  const load = () => {
    setPhase("loading");
    setTimeout(() => {
      const s = getCurrentStatus();
      const c = getOrCreateProjectConfig();
      const p = detectPkgManager();
      setStatus(s);
      setConfig(c);
      setPkgInfo(p);
      setPhase("display");
    }, 0);
  };

  useEffect(() => {
    load();
  }, []);

  if (phase === "loading") {
    return (
      <Box flexDirection="column" paddingX={panelMode ? 1 : 0}>
        <Text color={inkColors.accent}>Loading infrastructure status...</Text>
      </Box>
    );
  }

  const configuredPkg = config?.tools?.pkg?.manager;

  const items = [
    { value: "__section_supabase__", label: "Supabase", kind: "header" as const, selectable: false },
    {
      value: "__info_sb_linked__",
      label: `Linked: ${status.supabase?.linked ? "yes" : "no"}`,
      kind: "header" as const,
      selectable: false,
    },
    {
      value: "__info_sb_ref__",
      label: `Project ref: ${status.supabase?.projectRef ?? "not set"}`,
      kind: "header" as const,
      selectable: false,
    },
    {
      value: "__info_sb_fns__",
      label: `Functions: ${status.supabase?.functions?.length ? status.supabase.functions.join(", ") : "none"}`,
      kind: "header" as const,
      selectable: false,
    },
    { value: "__section_vercel__", label: "Vercel", kind: "header" as const, selectable: false },
    {
      value: "__info_vc_linked__",
      label: `Linked: ${status.vercel?.linked ? "yes" : "no"}`,
      kind: "header" as const,
      selectable: false,
    },
    {
      value: "__info_vc_id__",
      label: `Project ID: ${status.vercel?.projectId ?? "not set"}`,
      kind: "header" as const,
      selectable: false,
    },
    { value: "__section_github__", label: "GitHub", kind: "header" as const, selectable: false },
    {
      value: "__info_gh_auth__",
      label: `Authenticated: ${status.github?.authenticated ? "yes" : "no"}`,
      kind: "header" as const,
      selectable: false,
    },
    {
      value: "__info_gh_repo__",
      label: `Repo: ${status.github?.repo ?? "not set"}`,
      kind: "header" as const,
      selectable: false,
    },
    { value: "__section_pkg__", label: "Package Manager", kind: "header" as const, selectable: false },
    {
      value: "__info_pkg__",
      label: `Detected: ${pkgInfo?.id ?? "npm"}${configuredPkg ? ` (configured: ${configuredPkg})` : ""}`,
      kind: "header" as const,
      selectable: false,
    },
    { value: "__section_actions__", label: "Actions", kind: "header" as const, selectable: false },
    { value: "refresh", label: "Refresh", kind: "action" as const },
    ...(!panelMode ? [{ value: "__back__", label: "\u2190 Back" }] : []),
  ];

  const handleSelect = (value: string) => {
    if (value === "refresh") {
      load();
    } else if (value === "__back__") {
      onBack();
    }
  };

  if (panelMode) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <SelectList
          items={items}
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
          Infrastructure Status
        </Text>
      </Box>

      <SelectList
        items={items}
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
