import React from "react";
import { Box, Text, useApp } from "ink";
import { useNavigation } from "./hooks/useNavigation.js";
import { MainMenu } from "./screens/MainMenu.js";
import { CommandArgs } from "./screens/CommandArgs.js";
import { CustomCommand } from "./screens/CustomCommand.js";
import { FlagSelection } from "./screens/FlagSelection.js";
import { CommandExecution } from "./screens/CommandExecution.js";
import { colors } from "./theme.js";

export function App(): React.ReactElement {
  const { screen, params, navigate, goBack } = useNavigation();
  const { exit } = useApp();

  const handleExit = () => {
    process.stdout.write(
      "\n" +
      colors.dim("Thank you for using ") +
      colors.primaryBold("Polterbase") +
      colors.dim("!") +
      "\n\n",
    );
    exit();
  };

  switch (screen) {
    case "main-menu":
      return <MainMenu onNavigate={navigate} onExit={handleExit} />;

    case "command-args":
      return (
        <CommandArgs
          command={params.command ?? ""}
          onNavigate={navigate}
          onBack={goBack}
        />
      );

    case "custom-command":
      return <CustomCommand onNavigate={navigate} onBack={goBack} />;

    case "flag-selection":
      return (
        <FlagSelection
          args={params.args ?? []}
          onNavigate={navigate}
          onBack={goBack}
        />
      );

    case "confirm-execute":
    case "command-execution":
      return (
        <CommandExecution
          args={params.args ?? []}
          onBack={goBack}
          onExit={handleExit}
        />
      );

    default:
      return (
        <Box>
          <Text color="red">Unknown screen: {screen}</Text>
        </Box>
      );
  }
}
