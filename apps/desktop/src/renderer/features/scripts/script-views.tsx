import type { JSX } from "react";
import { PlayIcon, SquareCodeIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState, SurfaceCard } from "../shared/components.js";
import type { Workbench } from "../workbench/use-workbench.js";
import type { WorkspaceScript } from "../workbench/types.js";

function ScriptRow({
  onRun,
  path,
  script,
}: {
  onRun: () => void;
  path: string;
  script: WorkspaceScript;
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/60 bg-background/50 p-4">
      <div className="grid min-w-0 gap-1">
        <div className="flex items-center gap-2">
          <SquareCodeIcon className="size-4 text-muted-foreground" />
          <span className="font-medium">{script.name}</span>
          <Badge variant="outline">mock</Badge>
        </div>
        <code className="truncate font-mono text-xs text-muted-foreground">{script.command}</code>
        <span className="truncate text-xs text-muted-foreground">{path}</span>
      </div>
      <Button type="button" size="sm" onClick={onRun}>
        <PlayIcon className="size-4" />
        Run mock
      </Button>
    </div>
  );
}

export function ScriptsView({ workbench }: { workbench: Workbench }): JSX.Element {
  const { runWorkspaceScript, workspace } = workbench;

  if (!workspace) {
    return (
      <EmptyState
        title="No workspace loaded"
        description="The mock workbench has not loaded script metadata yet."
      />
    );
  }

  const totalScripts =
    workspace.rootScripts.length +
    workspace.childRepos.reduce((count, repo) => count + repo.scripts.length, 0);

  return (
    <div className="grid gap-6" aria-label="Scripts workspace">
      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-1">
              <CardTitle>Scripts</CardTitle>
              <CardDescription>
                Preview workspace scripts without starting package manager processes.
              </CardDescription>
            </div>
            <Badge variant="secondary">{totalScripts} scripts</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-3">
            <h3 className="text-sm font-medium">Root workspace</h3>
            {workspace.rootScripts.map((script) => (
              <ScriptRow
                key={`${workspace.root}:${script.name}`}
                path={workspace.root}
                script={script}
                onRun={() => void runWorkspaceScript(workspace.root, script.name)}
              />
            ))}
          </div>

          {workspace.childRepos.map((repo) => (
            <div key={repo.path} className="grid gap-3">
              <h3 className="text-sm font-medium">{repo.name}</h3>
              {repo.scripts.map((script) => (
                <ScriptRow
                  key={`${repo.path}:${script.name}`}
                  path={repo.path}
                  script={script}
                  onRun={() => void runWorkspaceScript(repo.path, script.name)}
                />
              ))}
            </div>
          ))}
        </CardContent>
      </SurfaceCard>
    </div>
  );
}
