import type { JSX } from "react";
import { RefreshCcwIcon, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Workbench } from "../workbench/use-workbench.js";
import { AppField, EmptyState, OutputPanel, SurfaceCard } from "../shared/components.js";
import { stringify } from "../shared/utils.js";

export function ToolStatusView({ workbench }: { workbench: Workbench }): JSX.Element {
  const { toolStatus } = workbench;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <CardTitle>Tool status</CardTitle>
          <CardDescription>
            Mocked toolchain and linkage status for the active workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {toolStatus?.tools.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {toolStatus.tools.map((tool) => (
                <div
                  key={tool.id}
                  className="grid gap-3 rounded-3xl border border-border/60 bg-background/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{tool.label}</span>
                    <Badge variant={tool.installed ? "secondary" : "outline"}>
                      {tool.installed ? "installed" : "missing"}
                    </Badge>
                  </div>
                  <div className="grid gap-1 text-xs text-muted-foreground">
                    <span>Version: {tool.version || "unknown"}</span>
                    <span>{tool.linked ? tool.project || "linked" : "not linked"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No tool status available"
              description="The mock workbench has not loaded a tool snapshot yet."
            />
          )}
        </CardContent>
      </SurfaceCard>

      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <CardTitle>Project state</CardTitle>
          <CardDescription>Serialized mock project state for the UI preview.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <OutputPanel
            label="Project state"
            value={stringify(toolStatus?.project ?? {})}
            placeholder="{}"
            className="h-[30rem]"
          />
        </CardContent>
      </SurfaceCard>
    </div>
  );
}

export function ProjectConfigView({ workbench }: { workbench: Workbench }): JSX.Element {
  const {
    projectConfig,
    projectConfigText,
    saveProjectConfigDraft,
    setProjectConfigText,
  } = workbench;

  return (
    <div className="grid gap-6">
      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <CardTitle>Project config</CardTitle>
          <CardDescription>
            Local editor for the mocked `.polter/config.json` structure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <AppField
            id="project-config-json"
            label="Config JSON"
            description="Edits stay inside the UI-only mock adapter."
          >
            <Textarea
              id="project-config-json"
              className="min-h-[30rem] font-mono text-xs leading-6"
              value={projectConfigText}
              onChange={(event) => setProjectConfigText(event.target.value)}
            />
          </AppField>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void saveProjectConfigDraft()}>Save config</Button>
            <Button
              variant="outline"
              onClick={() => setProjectConfigText(stringify(projectConfig ?? {}))}
            >
              Reset editor
            </Button>
          </div>
        </CardContent>
      </SurfaceCard>
    </div>
  );
}

export function InfrastructureView({ workbench }: { workbench: Workbench }): JSX.Element {
  const {
    applyInfrastructure,
    declarativeApplyResult,
    declarativePlan,
    declarativeStatus,
    refreshInfrastructure,
  } = workbench;

  return (
    <div className="grid gap-6">
      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <CardTitle>Infrastructure</CardTitle>
          <CardDescription>
            Preview declarative status, plan, and apply output without changing infrastructure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void refreshInfrastructure()}>
              <RefreshCcwIcon className="size-4" />
              Refresh
            </Button>
            <Button variant="secondary" onClick={() => void applyInfrastructure()}>
              Apply
            </Button>
          </div>

          <Tabs defaultValue="status" className="gap-4">
            <TabsList variant="line">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="plan">Plan</TabsTrigger>
              <TabsTrigger value="apply">Last apply</TabsTrigger>
            </TabsList>
            <TabsContent value="status">
              <OutputPanel
                label="Status"
                value={stringify(declarativeStatus ?? {})}
                placeholder="{}"
              />
            </TabsContent>
            <TabsContent value="plan">
              <OutputPanel
                label="Plan"
                value={stringify(declarativePlan ?? {})}
                placeholder="{}"
              />
            </TabsContent>
            <TabsContent value="apply">
              <OutputPanel
                label="Last apply"
                value={stringify(declarativeApplyResult ?? {})}
                placeholder="{}"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </SurfaceCard>
    </div>
  );
}

export function McpView({ workbench }: { workbench: Workbench }): JSX.Element {
  const { installMcp, mcpStatus, removeMcp } = workbench;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <CardTitle>MCP status</CardTitle>
          <CardDescription>
            Mock project and user registrations for the Polter MCP server.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {mcpStatus?.scopes.length ? (
            <div className="grid gap-3">
              {mcpStatus.scopes.map((scope) => (
                <div
                  key={scope.label}
                  className="grid gap-3 rounded-3xl border border-border/60 bg-background/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{scope.label}</span>
                    <Badge variant={scope.registered ? "secondary" : "outline"}>
                      {scope.registered ? "registered" : "not registered"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{scope.error ?? scope.scope}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No MCP status available"
              description="The mock workbench has not loaded any MCP scope yet."
            />
          )}
        </CardContent>
      </SurfaceCard>

      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <CardTitle>Actions</CardTitle>
          <CardDescription>Simulate install or remove registrations by scope.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-3">
            <h3 className="font-medium">Install</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => void installMcp("local")}>
                Install local
              </Button>
              <Button variant="secondary" size="sm" onClick={() => void installMcp("project")}>
                Install project
              </Button>
              <Button variant="secondary" size="sm" onClick={() => void installMcp("user")}>
                Install user
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid gap-3">
            <h3 className="font-medium">Remove</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void removeMcp("local")}>
                Remove local
              </Button>
              <Button variant="outline" size="sm" onClick={() => void removeMcp("project")}>
                Remove project
              </Button>
              <Button variant="outline" size="sm" onClick={() => void removeMcp("user")}>
                Remove user
              </Button>
            </div>
          </div>
        </CardContent>
      </SurfaceCard>
    </div>
  );
}

export function SkillView({ workbench }: { workbench: Workbench }): JSX.Element {
  const { setupSkill, skillPreview } = workbench;

  return (
    <div className="grid gap-6">
      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <CardTitle>Skill setup</CardTitle>
          <CardDescription>Preview the mocked Polter skill for Claude Code.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void setupSkill()}>
              <SparklesIcon className="size-4" />
              Install or update skill
            </Button>
          </div>

          <FieldGroup>
            <AppField id="skill-path" label="Skill path">
              <Input id="skill-path" readOnly value={skillPreview?.path ?? ""} />
            </AppField>
          </FieldGroup>

          <OutputPanel
            label="Skill content"
            value={skillPreview?.content ?? ""}
            placeholder="No preview available."
            className="h-[34rem]"
          />
        </CardContent>
      </SurfaceCard>
    </div>
  );
}

export function SettingsView({ workbench }: { workbench: Workbench }): JSX.Element {
  const {
    appInfo,
    applyWorkspaceDraft,
    cwdDraft,
    setCwdDraft,
  } = workbench;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Switch the mocked active workspace without restarting the desktop shell.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <AppField
            id="workspace-path"
            label="Current workspace"
            description="The new workspace path is loaded through the UI-only mock adapter."
          >
            <Input
              id="workspace-path"
              value={cwdDraft}
              onChange={(event) => setCwdDraft(event.target.value)}
            />
          </AppField>

          <div className="flex flex-wrap gap-3">
            <Button onClick={applyWorkspaceDraft}>Apply workspace</Button>
          </div>
        </CardContent>
      </SurfaceCard>

      <SurfaceCard>
        <CardHeader className="border-b border-border/50">
          <CardTitle>App info</CardTitle>
          <CardDescription>Metadata returned by the mock desktop shell bootstrap.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <OutputPanel
            label="App info"
            value={stringify(appInfo ?? {})}
            placeholder="{}"
            className="h-[24rem]"
          />
        </CardContent>
      </SurfaceCard>
    </div>
  );
}
