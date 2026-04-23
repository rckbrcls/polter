import React from "react";
import { Box, Text, useApp } from "ink";
import { useNavigation } from "./hooks/useNavigation.js";
import { useTerminalWidth } from "./hooks/useTerminalWidth.js";
import { useTerminalHeight } from "./hooks/useTerminalHeight.js";
import { GhostBanner } from "./components/GhostBanner.js";
import { Home } from "./screens/Home.js";
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
import { DeclarativePlan } from "./screens/DeclarativePlan.js";
import { DeclarativeStatus } from "./screens/DeclarativeStatus.js";
import { InitScaffold } from "./screens/InitScaffold.js";
import { ScriptPicker } from "./screens/ScriptPicker.js";
import { SkillSetup } from "./screens/SkillSetup.js";
import { colors } from "./theme.js";

export function AppClassic(): React.ReactElement {
  const { screen, params, navigate, goBack, goHome } = useNavigation();
  const { exit } = useApp();
  const width = useTerminalWidth();
  const height = useTerminalHeight();

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

  const renderScreen = () => {
    switch (screen) {
      case "home":
        return <Home onNavigate={navigate} onExit={handleExit} width={width} height={height} />;

      case "command-args":
        return (
          <CommandArgs
            command={params.command ?? ""}
            tool={params.tool}
            onNavigate={navigate}
            onBack={goBack}
            width={width}
          />
        );

      case "custom-command":
        return <CustomCommand onNavigate={navigate} onBack={goBack} width={width} />;

      case "flag-selection":
        return (
          <FlagSelection
            args={params.args ?? []}
            tool={params.tool}
            onNavigate={navigate}
            onBack={goBack}
            width={width}
          />
        );

      case "confirm-execute":
      case "command-execution":
        return (
          <CommandExecution
            args={params.args ?? []}
            tool={params.tool}
            rawCommand={params.rawCommand}
            onBack={goBack}
            onExit={handleExit}
            onRunSuggestion={(sugTool, sugArgs) => {
              goHome();
              navigate("confirm-execute", { tool: sugTool, args: sugArgs });
            }}
            width={width}
          />
        );

      case "self-update":
        return <SelfUpdate onBack={goBack} onExit={handleExit} width={width} />;

      case "tool-status":
        return <ToolStatus onBack={goBack} onNavigate={navigate} width={width} />;

      case "mcp-manage":
        return <McpManage onBack={goBack} width={width} />;

      case "process-list":
        return <ProcessList onNavigate={navigate} onBack={goBack} width={width} height={height} />;

      case "process-logs":
        return <ProcessLogs processId={params.processId ?? ""} onBack={goBack} width={width} height={height} />;

      case "project-config":
        return <ProjectConfig onBack={goBack} width={width} />;

      case "pipeline-list":
        return <PipelineList onNavigate={navigate} onBack={goBack} width={width} />;

      case "pipeline-builder":
        return <PipelineBuilder onBack={goBack} width={width} height={height} />;

      case "pipeline-execution":
        return (
          <PipelineExecution
            pipelineId={params.pipelineId ?? ""}
            onBack={goBack}
            onExit={handleExit}
            width={width}
          />
        );

      case "declarative-plan":
        return <DeclarativePlan onBack={goBack} onNavigate={navigate} width={width} height={height} />;

      case "declarative-status":
        return <DeclarativeStatus onBack={goBack} width={width} height={height} />;

      case "init-scaffold":
        return <InitScaffold onBack={goBack} onNavigate={navigate} width={width} height={height} />;

      case "script-picker":
        return <ScriptPicker onNavigate={navigate} onBack={goBack} width={width} height={height} />;

      case "skill-setup":
        return <SkillSetup onBack={goBack} width={width} height={height} />;

      default:
        return (
          <Box>
            <Text color="red">Unknown screen: {screen}</Text>
          </Box>
        );
    }
  };

  return (
    <Box flexDirection="column">
      <GhostBanner width={width} />
      {renderScreen()}
    </Box>
  );
}
