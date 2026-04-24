import type { JSX } from "react";
import { PinIcon, PlayIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Workbench } from "../workbench/use-workbench.js";
import { FEATURE_LIST_HEIGHT } from "../shared/constants.js";
import { AppField, EmptyState, OutputPanel, SurfaceCard } from "../shared/components.js";
import { ToolIcon } from "../shared/tool-icons.js";
import { domSafeId, getCommandValue } from "../shared/utils.js";

export function CommandsView({ workbench }: { workbench: Workbench }): JSX.Element {
  const {
    commandArgsText,
    commandFlags,
    commandForm,
    deferredCommandOutput,
    pins,
    runSelectedCommand,
    selectedCommandId,
    selectedFeature,
    selectedFeatureCommands,
    setCommandArgsText,
    setCommandFlags,
    setSelectedCommandId,
    toggleCommandPin,
    toggleRunPin,
  } = workbench;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <SurfaceCard className="overflow-hidden">
        <CardHeader className="border-b border-border/50">
          <CardTitle>{selectedFeature?.label ?? "Commands"}</CardTitle>
          <CardDescription>{selectedFeature?.commands.length ?? 0} commands available.</CardDescription>
          <CardAction>
            <Badge variant="secondary">{selectedFeatureCommands.length}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="pt-6">
          {selectedFeatureCommands.length ? (
            <ScrollArea className={FEATURE_LIST_HEIGHT}>
              <div className="grid gap-3 pr-3">
                {selectedFeatureCommands.map((command) => {
                  const commandValue = getCommandValue(command);
                  const active = selectedCommandId === command.id;
                  return (
                    <Button
                      key={command.id}
                      variant="ghost"
                      className={cn(
                        "h-auto w-full flex-col items-start gap-1 rounded-3xl border px-4 py-4 text-left whitespace-normal",
                        active
                          ? "border-primary/35 bg-primary/10 text-foreground hover:bg-primary/10"
                          : "border-border/60 bg-background/40 hover:bg-muted/40",
                      )}
                      onClick={() => {
                        setSelectedCommandId(command.id);
                        setCommandArgsText("");
                        setCommandFlags([]);
                      }}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <ToolIcon tool={command.tool} className="text-muted-foreground" />
                        {command.label}
                      </span>
                      <span className="pl-6 text-xs text-muted-foreground">{commandValue}</span>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <EmptyState
              title="No commands available"
              description="This feature has not exposed any command yet."
            />
          )}
        </CardContent>
      </SurfaceCard>

      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <CardTitle>{commandForm?.command.label ?? "Command details"}</CardTitle>
          <CardDescription>
            {commandForm?.command.hint ??
              "Choose a command to inspect arguments, flags, and output."}
          </CardDescription>
          {commandForm ? (
            <CardAction>
              <Badge variant="outline">{commandForm.commandValue}</Badge>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {commandForm ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ToolIcon tool={commandForm.command.tool} />
                <span>{commandForm.command.tool}</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => void toggleCommandPin()}>
                  <PinIcon className="size-4" />
                  {pins.commandPins.includes(commandForm.commandValue) ? "Unpin command" : "Pin command"}
                </Button>
                <Button variant="outline" onClick={() => void toggleRunPin()}>
                  <PinIcon className="size-4" />
                  Pin current run
                </Button>
              </div>

              <FieldSet>
                <Field>
                  <FieldLabel>Suggested args</FieldLabel>
                  {commandForm.suggestedArgs.length ? (
                    <div className="flex flex-wrap gap-2">
                      {commandForm.suggestedArgs.map((option) => (
                        <Button
                          key={option.value}
                          variant="outline"
                          size="sm"
                          onClick={() => setCommandArgsText(option.args.join(" "))}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <FieldDescription>
                      This command does not expose suggested argument sets.
                    </FieldDescription>
                  )}
                </Field>

                <AppField
                  id="command-args"
                  label="Arguments"
                  description="Arguments are split on whitespace before execution."
                >
                  <Input
                    id="command-args"
                    value={commandArgsText}
                    onChange={(event) => setCommandArgsText(event.target.value)}
                  />
                </AppField>

                <Field>
                  <FieldLabel>Flags</FieldLabel>
                  {commandForm.flags.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {commandForm.flags.map((flag) => {
                        const flagId = `command-flag-${domSafeId(flag.value)}`;
                        const checked = commandFlags.includes(flag.value);

                        return (
                          <div
                            key={flag.value}
                            className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3"
                          >
                            <Checkbox
                              id={flagId}
                              checked={checked}
                              onCheckedChange={(nextChecked) => {
                                setCommandFlags((current) =>
                                  nextChecked
                                    ? [...current, flag.value]
                                    : current.filter((item) => item !== flag.value),
                                );
                              }}
                            />
                            <div className="grid gap-1">
                              <Label htmlFor={flagId} className="cursor-pointer text-sm font-medium">
                                {flag.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">{flag.value}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <FieldDescription>No toggleable flags are available.</FieldDescription>
                  )}
                </Field>
              </FieldSet>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void runSelectedCommand()}>
                  <PlayIcon className="size-4" />
                  Run command
                </Button>
              </div>

              <OutputPanel
                label="Output"
                value={deferredCommandOutput}
                placeholder="No command has been executed yet."
              />
            </>
          ) : (
            <EmptyState
              title="Select a command"
              description="Choose a command from the list to preview arguments and run it."
            />
          )}
        </CardContent>
      </SurfaceCard>
    </div>
  );
}
