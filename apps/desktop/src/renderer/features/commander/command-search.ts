import { create, insertMultiple, search } from "@orama/orama";
import type {
  CommandDef,
  DesktopRepository,
  DesktopWorkspaceSnapshot,
  Feature,
  PipelineWithSource,
  ProcessInfo,
} from "../workbench/types.js";
import { getCommandValue } from "../shared/utils.js";

export type SearchDocumentKind = "command" | "pipeline" | "script" | "project" | "process";

export interface SearchDocument {
  id: string;
  kind: SearchDocumentKind;
  title: string;
  subtitle: string;
  commandValue: string;
  tool: string;
  featureLabel: string;
  description: string;
  path: string;
  targetId: string;
  commandId?: string;
  pipelineName?: string;
  processId?: string;
  projectId?: string;
  repoPath?: string;
  scriptName?: string;
  embedding?: number[];
}

export interface SearchDocumentInput {
  commands: CommandDef[];
  features: Feature[];
  pipelines: PipelineWithSource[];
  processes: ProcessInfo[];
  repositories: DesktopRepository[];
  workspace: DesktopWorkspaceSnapshot | null;
}

const searchSchema = {
  id: "string",
  kind: "string",
  title: "string",
  subtitle: "string",
  commandValue: "string",
  tool: "string",
  featureLabel: "string",
  description: "string",
  path: "string",
  targetId: "string",
} as const;

const kindRank: Record<SearchDocumentKind, number> = {
  command: 0,
  pipeline: 1,
  script: 2,
  project: 3,
  process: 4,
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function sortDocuments(documents: SearchDocument[]): SearchDocument[] {
  return [...documents].sort((left, right) => {
    const rankDelta = kindRank[left.kind] - kindRank[right.kind];
    if (rankDelta !== 0) {
      return rankDelta;
    }

    return left.title.localeCompare(right.title);
  });
}

function buildFeatureLabels(features: Feature[]): Map<string, string> {
  const labels = new Map<string, string[]>();

  for (const feature of features) {
    for (const command of feature.commands) {
      labels.set(command.id, [...(labels.get(command.id) ?? []), feature.label]);
    }
  }

  return new Map(
    [...labels.entries()].map(([commandId, commandLabels]) => [
      commandId,
      unique(commandLabels).join(", "),
    ]),
  );
}

export function buildSearchDocuments({
  commands,
  features,
  pipelines,
  processes,
  repositories,
  workspace,
}: SearchDocumentInput): SearchDocument[] {
  const featureLabelByCommand = buildFeatureLabels(features);
  const documents: SearchDocument[] = [];

  for (const command of commands) {
    const commandValue = getCommandValue(command);
    const featureLabel = featureLabelByCommand.get(command.id) ?? "";

    documents.push({
      id: `command:${command.id}`,
      kind: "command",
      title: command.label,
      subtitle: commandValue,
      commandValue,
      tool: command.tool,
      featureLabel,
      description: command.hint ?? featureLabel,
      path: "",
      targetId: command.id,
      commandId: command.id,
    });
  }

  for (const pipeline of pipelines) {
    const stepText = pipeline.steps
      .map((step) => [step.label, step.commandId, ...step.args, ...step.flags].filter(Boolean).join(" "))
      .join(" ");

    documents.push({
      id: `pipeline:${pipeline.source}:${pipeline.id}`,
      kind: "pipeline",
      title: pipeline.name,
      subtitle: `${pipeline.source} pipeline - ${pipeline.steps.length} steps`,
      commandValue: "",
      tool: "",
      featureLabel: "Pipelines",
      description: [pipeline.description, stepText].filter(Boolean).join(" "),
      path: "",
      targetId: pipeline.name,
      pipelineName: pipeline.name,
    });
  }

  if (workspace) {
    for (const script of workspace.rootScripts) {
      documents.push({
        id: `script:${workspace.root}:${script.name}`,
        kind: "script",
        title: script.name,
        subtitle: `Root script - ${script.command}`,
        commandValue: script.command,
        tool: workspace.packageManager.id,
        featureLabel: "Scripts",
        description: script.command,
        path: workspace.root,
        targetId: `${workspace.root}:${script.name}`,
        repoPath: workspace.root,
        scriptName: script.name,
      });
    }

    for (const repo of workspace.childRepos) {
      for (const script of repo.scripts) {
        documents.push({
          id: `script:${repo.path}:${script.name}`,
          kind: "script",
          title: script.name,
          subtitle: `${repo.name} - ${script.command}`,
          commandValue: script.command,
          tool: repo.pkgManager.id,
          featureLabel: "Scripts",
          description: script.command,
          path: repo.path,
          targetId: `${repo.path}:${script.name}`,
          repoPath: repo.path,
          scriptName: script.name,
        });
      }
    }
  }

  for (const repository of repositories) {
    documents.push({
      id: `project:${repository.id}`,
      kind: "project",
      title: repository.name,
      subtitle: repository.path,
      commandValue: "",
      tool: "",
      featureLabel: "Projects",
      description: repository.exists ? "Available project" : "Missing project path",
      path: repository.path,
      targetId: repository.id,
      projectId: repository.id,
    });
  }

  for (const processInfo of processes) {
    const commandValue = [processInfo.command, ...processInfo.args].join(" ");

    documents.push({
      id: `process:${processInfo.id}`,
      kind: "process",
      title: processInfo.id,
      subtitle: `${processInfo.status} - ${commandValue}`,
      commandValue,
      tool: "",
      featureLabel: "Processes",
      description: `${processInfo.status} ${commandValue}`,
      path: processInfo.cwd,
      targetId: processInfo.id,
      processId: processInfo.id,
    });
  }

  return sortDocuments(documents);
}

export async function searchDocuments(
  documents: SearchDocument[],
  term: string,
  limit = 24,
): Promise<SearchDocument[]> {
  const query = term.trim();

  if (!query) {
    return sortDocuments(documents).slice(0, limit);
  }

  const database = create({ schema: searchSchema });
  await insertMultiple(database, documents);
  const results = await search(database, {
    term: query,
    limit,
    tolerance: 1,
    properties: [
      "title",
      "subtitle",
      "commandValue",
      "tool",
      "featureLabel",
      "description",
      "path",
      "kind",
    ],
    boost: {
      title: 8,
      commandValue: 7,
      featureLabel: 5,
      tool: 4,
      description: 3,
      subtitle: 2,
      path: 1,
      kind: 1,
    },
  });

  return results.hits.map((hit) => hit.document as SearchDocument);
}
