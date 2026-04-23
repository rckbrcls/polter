import React from "react";
import { Box, Text, useApp, useInput } from "ink";
import { useFullscreen } from "./hooks/useFullscreen.js";
import { useTerminalDimensions } from "./hooks/useTerminalDimensions.js";
import { usePanelNavigation } from "./hooks/usePanelNavigation.js";
import { usePanelFocus } from "./hooks/usePanelFocus.js";
import { useSidebarItems } from "./hooks/useSidebarItems.js";
import { useModal } from "./hooks/useModal.js";
import { PanelLayout } from "./components/PanelLayout.js";
import { Panel } from "./components/Panel.js";
import { Sidebar } from "./components/Sidebar.js";
import { GhostBanner } from "./components/GhostBanner.js";
import { PanelFooter, type KeyHint } from "./components/PanelFooter.js";
import { Modal } from "./components/Modal.js";
import { FeatureCommands } from "./components/FeatureCommands.js";
import { PinnedCommands } from "./components/PinnedCommands.js";

import { CommandArgs } from "./screens/CommandArgs.js";
import { CustomCommand } from "./screens/CustomCommand.js";
import { FlagSelection } from "./screens/FlagSelection.js";
import { CommandExecution } from "./screens/CommandExecution.js";
import { SelfUpdate } from "./screens/SelfUpdate.js";
import { ToolStatus } from "./screens/ToolStatus.js";
import { ProjectConfig } from "./screens/ProjectConfig.js";
import { PipelineList } from "./screens/PipelineList.js";
import { PipelineBuilder } from "./screens/PipelineBuilder.js";
import { PipelineExecution } from "./screens/PipelineExecution.js";
import { McpManage } from "./screens/McpManage.js";
import { ProcessList } from "./screens/ProcessList.js";
import { ProcessLogs } from "./screens/ProcessLogs.js";
import { DeclarativeHome } from "./screens/DeclarativeHome.js";
import { DeclarativePlan } from "./screens/DeclarativePlan.js";
import { DeclarativeStatus } from "./screens/DeclarativeStatus.js";
import { InitScaffold } from "./screens/InitScaffold.js";
import { ScriptPicker } from "./screens/ScriptPicker.js";
import { SkillSetup } from "./screens/SkillSetup.js";
import { getFeatureById } from "./data/features.js";
import { colors } from "./theme.js";
import type { PanelNavState } from "./hooks/usePanelNavigation.js";

const screenLabels: Record<string, string> = {
  "command-args": "Args",
  "flag-selection": "Flags",
  "confirm-execute": "Execute",
  "command-execution": "Execute",
  "custom-command": "Custom Cmd",
  "pipeline-list": "Pipelines",
  "pipeline-builder": "Builder",
  "pipeline-execution": "Run",
  "self-update": "Update",
  "tool-status": "Status",
  "project-config": "Config",
  "mcp-manage": "MCP",
  "process-list": "Processes",
  "process-logs": "Logs",
  "declarative-plan": "Plan/Apply",
  "declarative-status": "Status",
  "init-scaffold": "Init",
  "script-picker": "Scripts",
  "skill-setup": "Skill Setup",
};

function buildBreadcrumb(nav: PanelNavState): string {
  // Base label from the current view
  let base: string;
  switch (nav.view) {
    case "feature": {
      const feat = getFeatureById(nav.featureId);
      base = feat ? `${feat.icon} ${feat.label}` : nav.featureId;
      break;
    }
    case "pinned":
      base = "📌 Pinned";
      break;
    case "custom-command":
      base = "✏️ Custom Cmd";
      break;
    case "pipelines":
      base = "🔗 Pipelines";
      break;
    case "tool-status":
      base = "🔧 Status";
      break;
    case "config":
      base = "⚙️ Config";
      break;
    case "self-update":
      base = "⬆️ Update";
      break;
    case "processes":
      base = "\uD83D\uDCBB Processes";
      break;
    case "scripts":
      base = "\uD83D\uDCDC Scripts";
      break;
    case "declarative":
      base = "\uD83C\uDFD7\uFE0F Infrastructure";
      break;
    case "skill-setup":
      base = "\uD83E\uDDE0 Skill Setup";
      break;
    default:
      base = nav.view;
  }

  if (nav.innerScreen === "home") {
    return base;
  }

  const parts = [base];
  for (const entry of nav.innerStack) {
    if (entry.screen !== "home") {
      parts.push(screenLabels[entry.screen] ?? entry.screen);
    }
  }
  parts.push(screenLabels[nav.innerScreen] ?? nav.innerScreen);

  return parts.join(" › ");
}

const FOOTER_HINTS: KeyHint[] = [
  { key: "Tab", action: "focus" },
  { key: "←/Esc", action: "back" },
  { key: "→/Enter", action: "select" },
  { key: "j/k", action: "nav" },
  { key: "p", action: "pin" },
  { key: "q", action: "quit" },
  { key: "?", action: "help" },
];

export function AppPanel(): React.ReactElement {
  useFullscreen();
  const { width, height } = useTerminalDimensions();
  const { exit } = useApp();
  const nav = usePanelNavigation();
  const focus = usePanelFocus();
  const sidebarItems = useSidebarItems();
  const modal = useModal();

  const singlePanel = width < 60 || height < 15;

  const handleExit = () => {
    process.stdout.write(
      "\n" +
      colors.dim("Thank you for using ") +
      colors.primaryBold("Polter") +
      colors.dim("!") +
      "\n\n",
    );
    exit();
  };

  // Global keybindings
  useInput((input, key) => {
    if (modal.isOpen) {
      if (key.escape || input === "q") {
        modal.closeModal();
      }
      return;
    }

    if (input === "q") {
      handleExit();
      return;
    }

    if (key.tab) {
      focus.toggleFocus();
      return;
    }

    // Left arrow: main -> sidebar
    if (key.leftArrow && focus.isMainFocused && nav.innerScreen === "home") {
      focus.focusSidebar();
      return;
    }

    // Right arrow when sidebar focused: select + focus main (handled by Sidebar component)
    // Esc when main focused at top level: go back to sidebar
    if (key.escape && focus.isMainFocused && nav.innerScreen === "home") {
      focus.focusSidebar();
      return;
    }

    if (input === "?") {
      modal.openModal(
        <Box flexDirection="column">
          <Text><Text bold>←/→</Text>    Move between sidebar and main panel</Text>
          <Text><Text bold>Tab</Text>     Toggle sidebar / main panel</Text>
          <Text><Text bold>j/k</Text>     Navigate up/down</Text>
          <Text><Text bold>Enter</Text>   Select item</Text>
          <Text><Text bold>Esc</Text>     Go back (or return to sidebar)</Text>
          <Text><Text bold>q</Text>       Quit Polter</Text>
          <Text><Text bold>?</Text>       Show this help</Text>
          <Text><Text bold>p</Text>       Pin/unpin command</Text>
        </Box>,
        "Keyboard Shortcuts",
      );
    }
  });

  // Determine which sidebar item is "selected"
  const activeSidebarId = (() => {
    switch (nav.view) {
      case "feature": return nav.featureId;
      case "pinned": return "pinned";
      case "custom-command": return "custom-command";
      case "pipelines": return "pipelines";
      case "tool-status": return "tool-status";
      case "config": return "config";
      case "self-update": return "self-update";
      case "processes": return "processes";
      case "scripts": return "scripts";
      case "declarative": return "declarative";
      case "skill-setup": return "skill-setup";
      default: return nav.featureId;
    }
  })();

  const handleSidebarHighlight = (itemId: string) => {
    if (itemId === "exit") return;
    nav.selectSidebarItem(itemId);
  };

  const handleSidebarSelect = (itemId: string) => {
    if (itemId === "exit") {
      handleExit();
      return;
    }
    nav.selectSidebarItem(itemId);
    focus.focusMain();
  };

  // Ghost art = 8 lines + outer border (top+bottom) = 10
  // Narrow mode: version box (3) + badges box (3) = 6 lines
  const bannerHeight = width < 60 ? 6 : 10;

  const footerHints = FOOTER_HINTS;

  // Render main panel content
  const mainContentHeight = Math.max(5, height - bannerHeight - 1 - 2); // borders take 2
  const mainContentWidth = singlePanel
    ? width
    : width - Math.max(20, Math.min(35, Math.floor(width * 0.3)));

  const renderMainContent = (): React.ReactElement => {
    // If inner navigation is active (not on home), render that screen
    if (nav.innerScreen !== "home") {
      return renderInnerScreen();
    }

    // Default view based on sidebar selection
    switch (nav.view) {
      case "pinned":
        return (
          <PinnedCommands
            onNavigate={nav.navigateInner}
            onBack={focus.focusSidebar}
            width={mainContentWidth - 2}
            height={mainContentHeight}
            isInputActive={focus.isMainFocused}
          />
        );

      case "feature": {
        const feature = getFeatureById(nav.featureId);
        if (!feature) {
          return <Text color="red">Feature not found: {nav.featureId}</Text>;
        }
        return (
          <FeatureCommands
            feature={feature}
            onNavigate={nav.navigateInner}
            onExit={handleExit}
            onBack={focus.focusSidebar}
            width={mainContentWidth - 2}
            height={mainContentHeight}
            isInputActive={focus.isMainFocused}
          />
        );
      }

      case "custom-command":
        return (
          <CustomCommand
            onNavigate={nav.navigateInner}
            onBack={focus.focusSidebar}
            width={mainContentWidth - 2}
            height={mainContentHeight}
            panelMode
            isInputActive={focus.isMainFocused}
          />
        );

      case "pipelines":
        return (
          <PipelineList
            onNavigate={nav.navigateInner}
            onBack={focus.focusSidebar}
            width={mainContentWidth - 2}
            height={mainContentHeight}
            panelMode
            isInputActive={focus.isMainFocused}
          />
        );

      case "tool-status":
        return (
          <ToolStatus
            onBack={focus.focusSidebar}
            onNavigate={nav.navigateInner}
            width={mainContentWidth - 2}
            height={mainContentHeight}
            panelMode
            isInputActive={focus.isMainFocused}
          />
        );

      case "processes":
        return (
          <ProcessList
            onNavigate={nav.navigateInner}
            onBack={focus.focusSidebar}
            width={mainContentWidth - 2}
            height={mainContentHeight}
            panelMode
            isInputActive={focus.isMainFocused}
          />
        );

      case "scripts":
        return (
          <ScriptPicker
            onNavigate={nav.navigateInner}
            onBack={focus.focusSidebar}
            width={mainContentWidth - 2}
            height={mainContentHeight}
            panelMode
            isInputActive={focus.isMainFocused}
          />
        );

      case "declarative":
        return (
          <DeclarativeHome
            onNavigate={nav.navigateInner}
            onBack={focus.focusSidebar}
            width={mainContentWidth - 2}
            height={mainContentHeight}
            isInputActive={focus.isMainFocused}
          />
        );

      case "skill-setup":
        return (
          <SkillSetup
            onBack={focus.focusSidebar}
            width={mainContentWidth - 2}
            height={mainContentHeight}
            panelMode
            isInputActive={focus.isMainFocused}
          />
        );

      case "config":
        return (
          <ProjectConfig
            onBack={focus.focusSidebar}
            width={mainContentWidth - 2}
            height={mainContentHeight}
            panelMode
            isInputActive={focus.isMainFocused}
          />
        );

      case "self-update":
        return (
          <SelfUpdate
            onBack={focus.focusSidebar}
            onExit={handleExit}
            width={mainContentWidth - 2}
            height={mainContentHeight}
            panelMode
            isInputActive={focus.isMainFocused}
          />
        );

      default:
        return <Text>Select an item from the sidebar</Text>;
    }
  };

  const renderInnerScreen = (): React.ReactElement => {
    const isActive = focus.isMainFocused;
    const w = mainContentWidth - 2;

    switch (nav.innerScreen) {
      case "command-args":
        return (
          <CommandArgs
            command={nav.innerParams.command ?? ""}
            tool={nav.innerParams.tool}
            onNavigate={nav.navigateInner}
            onBack={nav.goBackInner}
            width={w}
            panelMode
            isInputActive={isActive}
          />
        );

      case "custom-command":
        return (
          <CustomCommand
            onNavigate={nav.navigateInner}
            onBack={nav.goBackInner}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "flag-selection":
        return (
          <FlagSelection
            args={nav.innerParams.args ?? []}
            tool={nav.innerParams.tool}
            interactive={nav.innerParams.interactive}
            onNavigate={nav.navigateInner}
            onBack={nav.goBackInner}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "confirm-execute":
      case "command-execution":
        return (
          <CommandExecution
            key={`${nav.view}-${nav.innerParams.tool}-${(nav.innerParams.args ?? []).join("-")}`}
            args={nav.innerParams.args ?? []}
            tool={nav.innerParams.tool}
            rawCommand={nav.innerParams.rawCommand}
            interactive={nav.innerParams.interactive}
            cwd={nav.innerParams.cwd}
            onBack={nav.goBackInner}
            onHome={nav.goHomeInner}
            onExit={handleExit}
            onRunSuggestion={(sugTool, sugArgs) => {
              nav.switchViewAndNavigate("custom-command", "confirm-execute", { tool: sugTool, args: sugArgs, interactive: true });
            }}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "pipeline-list":
        return (
          <PipelineList
            onNavigate={nav.navigateInner}
            onBack={nav.goBackInner}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "pipeline-builder":
        return (
          <PipelineBuilder
            onBack={nav.goBackInner}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "pipeline-execution":
        return (
          <PipelineExecution
            pipelineId={nav.innerParams.pipelineId ?? ""}
            onBack={nav.goBackInner}
            onExit={handleExit}
            width={w}
            panelMode
            isInputActive={isActive}
          />
        );

      case "self-update":
        return (
          <SelfUpdate
            onBack={nav.goBackInner}
            onExit={handleExit}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "tool-status":
        return (
          <ToolStatus
            onBack={nav.goBackInner}
            onNavigate={nav.navigateInner}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "mcp-manage":
        return (
          <McpManage
            onBack={nav.goBackInner}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "process-list":
        return (
          <ProcessList
            onNavigate={nav.navigateInner}
            onBack={nav.goBackInner}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "process-logs":
        return (
          <ProcessLogs
            processId={nav.innerParams.processId ?? ""}
            onBack={nav.goBackInner}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "project-config":
        return (
          <ProjectConfig
            onBack={nav.goBackInner}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "declarative-plan":
        return (
          <DeclarativePlan
            onBack={nav.goBackInner}
            onNavigate={nav.navigateInner}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "declarative-status":
        return (
          <DeclarativeStatus
            onBack={nav.goBackInner}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "init-scaffold":
        return (
          <InitScaffold
            onBack={nav.goBackInner}
            onNavigate={nav.navigateInner}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "script-picker":
        return (
          <ScriptPicker
            onNavigate={nav.navigateInner}
            onBack={nav.goBackInner}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      case "skill-setup":
        return (
          <SkillSetup
            onBack={nav.goBackInner}
            width={w}
            height={mainContentHeight}
            panelMode
            isInputActive={isActive}
          />
        );

      default:
        return <Text color="red">Unknown screen: {nav.innerScreen}</Text>;
    }
  };

  if (modal.isOpen) {
    return (
      <Box flexDirection="column" width={width} height={height}>
        <Modal title={modal.modalTitle} width={width} height={height}>
          {modal.modalContent}
        </Modal>
      </Box>
    );
  }

  const header = <GhostBanner width={width} compact />;

  const sidebar = (
    <Panel
      id="sidebar"
      title="Menu"
      width={Math.max(20, Math.min(35, Math.floor(width * 0.3)))}
      height={Math.max(5, height - bannerHeight - 1)}
      focused={focus.isSidebarFocused}
    >
      <Sidebar
        items={sidebarItems}
        selectedId={activeSidebarId}
        isFocused={focus.isSidebarFocused}
        height={Math.max(5, height - bannerHeight - 4)}
        onSelect={handleSidebarSelect}
        onHighlight={handleSidebarHighlight}
      />
    </Panel>
  );

  const main = (
    <Panel
      id="main"
      title={buildBreadcrumb(nav)}
      width={mainContentWidth}
      height={Math.max(5, height - bannerHeight - 1)}
      focused={focus.isMainFocused}
    >
      {renderMainContent()}
    </Panel>
  );

  const footer = <PanelFooter hints={footerHints} width={width} />;

  return (
    <PanelLayout
      header={header}
      footer={footer}
      sidebar={sidebar}
      main={main}
      width={width}
      height={height}
      bannerHeight={bannerHeight}
      singlePanel={singlePanel}
    />
  );
}
