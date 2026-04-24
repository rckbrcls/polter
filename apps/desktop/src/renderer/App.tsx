import { useEffect, useState, type JSX } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { CommanderDialog } from "./features/commander/commander-dialog.js";
import { CommandsView } from "./features/commands/command-views.js";
import { PipelinesView } from "./features/pipelines/pipeline-views.js";
import { ProcessesView } from "./features/processes/process-views.js";
import { ScriptsView } from "./features/scripts/script-views.js";
import { DesktopShell } from "./features/shell/desktop-shell.js";
import {
  InfrastructureView,
  McpView,
  ProjectConfigView,
  SettingsView,
  SkillView,
  ToolStatusView,
} from "./features/system/system-views.js";
import { EmptyState } from "./features/shared/components.js";
import { useWorkbench, type Workbench } from "./features/workbench/use-workbench.js";

function CurrentView({ workbench }: { workbench: Workbench }): JSX.Element {
  if (workbench.selectedView.startsWith("feature:")) {
    return <CommandsView workbench={workbench} />;
  }

  switch (workbench.selectedView) {
    case "pipelines":
      return <PipelinesView workbench={workbench} />;
    case "processes":
      return <ProcessesView workbench={workbench} />;
    case "scripts":
      return <ScriptsView workbench={workbench} />;
    case "tool-status":
      return <ToolStatusView workbench={workbench} />;
    case "project-config":
      return <ProjectConfigView workbench={workbench} />;
    case "infrastructure":
      return <InfrastructureView workbench={workbench} />;
    case "mcp":
      return <McpView workbench={workbench} />;
    case "skills":
      return <SkillView workbench={workbench} />;
    case "settings":
      return <SettingsView workbench={workbench} />;
    default:
      return (
        <EmptyState
          title="Select a view"
          description="Choose a workflow, feature, or system surface from the sidebar."
        />
      );
  }
}

export function App(): JSX.Element {
  const workbench = useWorkbench();
  const [commanderOpen, setCommanderOpen] = useState(false);

  useEffect(() => {
    if (workbench.message) {
      toast.success(workbench.message);
    }
  }, [workbench.message]);

  useEffect(() => {
    if (workbench.error) {
      toast.error(workbench.error);
    }
  }, [workbench.error]);

  return (
    <>
      <DesktopShell
        activeRepositoryPath={workbench.activeRepositoryPath}
        getSidebarBadge={workbench.getSidebarBadge}
        headerItems={workbench.headerItems}
        onAddRepository={() => void workbench.addRepositoryFromPicker()}
        onOpenCommander={() => setCommanderOpen((current) => !current)}
        onRemoveRepository={(repository) => void workbench.removeRepository(repository)}
        onSelectRepository={(repository) => void workbench.selectRepository(repository)}
        onSelectView={workbench.setSelectedView}
        repositories={workbench.repositories}
        selectedView={workbench.selectedView}
        systemViewSelected={workbench.systemViewSelected}
      >
        <CurrentView workbench={workbench} />
      </DesktopShell>
      <CommanderDialog
        open={commanderOpen}
        onOpenChange={setCommanderOpen}
        workbench={workbench}
      />
      <Toaster richColors position="top-right" />
    </>
  );
}
