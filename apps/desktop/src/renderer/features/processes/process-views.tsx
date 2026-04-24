import type { JSX, KeyboardEvent } from "react";
import type { ProcessInfo } from "../workbench/types.js";
import {
  PlayIcon,
  RefreshCcwIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, OutputPanel, SurfaceCard } from "../shared/components.js";
import type { Workbench } from "../workbench/use-workbench.js";

function getCommandLine(processInfo: ProcessInfo): string {
  return [processInfo.command, ...processInfo.args].filter(Boolean).join(" ");
}

function formatUptime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function getStatusVariant(processInfo: ProcessInfo): "secondary" | "outline" | "destructive" {
  switch (processInfo.status) {
    case "running":
      return "secondary";
    case "errored":
      return "destructive";
    case "exited":
    default:
      return "outline";
  }
}

function ProcessStatusBadge({ processInfo }: { processInfo: ProcessInfo }): JSX.Element {
  return <Badge variant={getStatusVariant(processInfo)}>{processInfo.status}</Badge>;
}

export function ProcessesView({ workbench }: { workbench: Workbench }): JSX.Element {
  const selectedProcess =
    workbench.processes.find((processInfo) => processInfo.id === workbench.selectedProcessId) ??
    workbench.processes[0] ??
    null;
  const canStartProcess = Boolean(workbench.processCommand.trim());

  function selectProcess(processId: string) {
    workbench.setSelectedProcessId(processId);
  }

  function handleProcessRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, processId: string) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    selectProcess(processId);
  }

  return (
    <div
      className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.95fr)]"
      aria-label="Processes workspace"
    >
      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-1">
              <CardTitle>Processes</CardTitle>
              <CardDescription>
                Preview background activity with local mock state only.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void workbench.refreshProcesses()}
            >
              <RefreshCcwIcon className="size-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <form
            className="grid gap-3 rounded-3xl border border-border/60 bg-muted/20 p-4 lg:grid-cols-[minmax(8rem,0.9fr)_minmax(8rem,1.2fr)_auto] lg:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              void workbench.startManualProcess();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="process-command">Command</Label>
              <Input
                id="process-command"
                value={workbench.processCommand}
                onChange={(event) => workbench.setProcessCommand(event.target.value)}
                placeholder="pnpm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="process-arguments">Arguments</Label>
              <Input
                id="process-arguments"
                value={workbench.processArgsText}
                onChange={(event) => workbench.setProcessArgsText(event.target.value)}
                placeholder="run dev"
              />
            </div>
            <Button type="submit" disabled={!canStartProcess}>
              <PlayIcon className="size-4" />
              Start Process
            </Button>
          </form>

          {workbench.processes.length ? (
            <div className="rounded-3xl border border-border/60 bg-background/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Command</TableHead>
                    <TableHead>PID</TableHead>
                    <TableHead>CWD</TableHead>
                    <TableHead className="text-right">Uptime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workbench.processes.map((processInfo) => {
                    const selected = selectedProcess?.id === processInfo.id;

                    return (
                      <TableRow
                        key={processInfo.id}
                        tabIndex={0}
                        aria-selected={selected}
                        data-state={selected ? "selected" : undefined}
                        className="cursor-pointer outline-none focus-visible:bg-muted"
                        onClick={() => selectProcess(processInfo.id)}
                        onKeyDown={(event) => handleProcessRowKeyDown(event, processInfo.id)}
                      >
                        <TableCell>
                          <ProcessStatusBadge processInfo={processInfo} />
                        </TableCell>
                        <TableCell className="max-w-[20rem]">
                          <div className="grid gap-1">
                            <span className="truncate font-medium">{processInfo.id}</span>
                            <code className="truncate font-mono text-xs text-muted-foreground">
                              {getCommandLine(processInfo)}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {processInfo.pid ?? "n/a"}
                        </TableCell>
                        <TableCell className="max-w-[18rem]">
                          <code className="block truncate font-mono text-xs text-muted-foreground">
                            {processInfo.cwd}
                          </code>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {formatUptime(processInfo.uptime)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title="No processes tracked"
              description="Start a mock process or run a mock workspace script to monitor it here."
            />
          )}
        </CardContent>
      </SurfaceCard>

      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-1">
              <CardTitle>Logs</CardTitle>
              <CardDescription>
                {selectedProcess
                  ? `Mock output for ${selectedProcess.id}.`
                  : "Select a mock process to inspect captured output."}
              </CardDescription>
            </div>
            {selectedProcess ? <ProcessStatusBadge processInfo={selectedProcess} /> : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {selectedProcess ? (
            <>
              <div className="grid gap-2 rounded-3xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span>Command</span>
                  <code className="truncate text-right font-mono text-foreground">
                    {getCommandLine(selectedProcess)}
                  </code>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Started</span>
                  <code className="font-mono text-foreground">{selectedProcess.startedAt}</code>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Exit</span>
                  <code className="font-mono text-foreground">
                    {selectedProcess.exitCode ?? selectedProcess.signal ?? "running"}
                  </code>
                </div>
              </div>

              <OutputPanel
                label="Process output"
                value={workbench.deferredProcessOutput}
                placeholder="No output captured yet."
                className="h-[32rem]"
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void workbench.refreshProcesses()}
                >
                  <RefreshCcwIcon className="size-4" />
                  Refresh
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={selectedProcess.status !== "running"}
                  onClick={() => void workbench.stopSelectedProcess(selectedProcess.id)}
                >
                  <SquareIcon className="size-4" />
                  Stop
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={selectedProcess.status === "running"}
                  onClick={() => void workbench.removeSelectedProcess(selectedProcess.id)}
                >
                  <Trash2Icon className="size-4" />
                  Remove
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              title="No process selected"
              description="Select a mock process to inspect logs and lifecycle state."
            />
          )}
        </CardContent>
      </SurfaceCard>
    </div>
  );
}
