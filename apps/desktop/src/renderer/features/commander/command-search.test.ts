import { describe, expect, it } from "vitest";
import type {
  CommandDef,
  DesktopRepository,
  DesktopWorkspaceSnapshot,
  Feature,
  PipelineWithSource,
  ProcessInfo,
} from "../workbench/types.js";
import { buildSearchDocuments, searchDocuments } from "./command-search.js";

const packageManager = {
  id: "pnpm",
  lockFile: "pnpm-lock.yaml",
  command: "pnpm",
} as const;

const commands: CommandDef[] = [
  {
    id: "vercel:deploy",
    tool: "vercel",
    base: ["deploy"],
    label: "Deploy",
    hint: "Deploy the current project.",
  },
  {
    id: "git:status",
    tool: "git",
    base: ["status"],
    label: "Status",
    hint: "Inspect repo state.",
  },
];

const features: Feature[] = [
  { id: "deploy", icon: "", label: "Deploy", commands: [commands[0]!] },
  { id: "repo", icon: "", label: "Repo", commands: [commands[1]!] },
];

const pipelines: PipelineWithSource[] = [
  {
    id: "desktop-checks",
    name: "Desktop checks",
    description: "Validate the desktop workspace.",
    source: "project",
    createdAt: "2026-04-23T00:00:00.000Z",
    updatedAt: "2026-04-23T00:00:00.000Z",
    steps: [
      {
        id: "deploy",
        commandId: "vercel:deploy",
        args: [],
        flags: [],
        continueOnError: false,
      },
    ],
  },
];

const repositories: DesktopRepository[] = [
  {
    id: "polterware-web",
    name: "polterware-web",
    path: "/workspace/polterware-web",
    lastOpenedAt: "2026-04-23T00:00:00.000Z",
    exists: true,
  },
];

const workspace = {
  cwd: "/workspace/polter",
  root: "/workspace/polter",
  packageManager,
  rootScripts: [{ name: "typecheck", command: "tsc --noEmit" }],
  childRepos: [
    {
      name: "apps/desktop",
      path: "/workspace/polter/apps/desktop",
      scripts: [{ name: "test", command: "vitest run" }],
      pkgManager: packageManager,
    },
  ],
  projectConfig: {
    version: 1,
    tools: { pkg: { manager: "pnpm" } },
    pipelines: [],
  },
} as DesktopWorkspaceSnapshot;

const processes: ProcessInfo[] = [
  {
    id: "desktop-dev",
    command: "pnpm",
    args: ["dev"],
    cwd: "/workspace/polter",
    pid: 123,
    status: "running",
    exitCode: null,
    signal: null,
    startedAt: "2026-04-23T00:00:00.000Z",
    exitedAt: null,
    uptime: 1000,
  },
];

function buildDocuments() {
  return buildSearchDocuments({
    commands,
    features,
    pipelines,
    processes,
    repositories,
    workspace,
  });
}

describe("commander search documents", () => {
  it("indexes commands with command values and feature labels", () => {
    const documents = buildDocuments();
    const deploy = documents.find((document) => document.id === "command:vercel:deploy");

    expect(deploy).toMatchObject({
      kind: "command",
      commandId: "vercel:deploy",
      commandValue: "vercel:deploy",
      featureLabel: "Deploy",
      tool: "vercel",
    });
  });

  it("indexes pipelines, scripts, projects, and processes", () => {
    const documents = buildDocuments();

    expect(documents.some((document) => document.id === "pipeline:project:desktop-checks")).toBe(
      true,
    );
    expect(documents.some((document) => document.id === "script:/workspace/polter:typecheck")).toBe(
      true,
    );
    expect(
      documents.some((document) => document.id === "script:/workspace/polter/apps/desktop:test"),
    ).toBe(true);
    expect(documents.some((document) => document.id === "project:polterware-web")).toBe(true);
    expect(documents.some((document) => document.id === "process:desktop-dev")).toBe(true);
  });

  it("searches commands, feature labels, pipelines, and projects with Orama", async () => {
    const documents = buildDocuments();

    await expect(searchDocuments(documents, "deploy")).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "command:vercel:deploy" })]),
    );
    await expect(searchDocuments(documents, "repo")).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "command:git:status" })]),
    );
    await expect(searchDocuments(documents, "desktop checks")).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "pipeline:project:desktop-checks" })]),
    );
    await expect(searchDocuments(documents, "polterware-web")).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "project:polterware-web" })]),
    );
  });
});
