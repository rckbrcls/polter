import type {
  DesktopWorkspaceSnapshot,
  ScriptLanguage,
  ScriptLibraryItem,
  ScriptSource,
  ScriptStageTarget,
  ScriptTemplate,
} from "../workbench/types.js";
import { domSafeId } from "../shared/utils.js";

export type { ScriptLanguage, ScriptLibraryItem, ScriptSource, ScriptStageTarget, ScriptTemplate };

export const scriptSourceLabels: Record<ScriptSource, string> = {
  custom: "Custom",
  package: "Package",
  template: "Templates",
};

export const scriptLanguageLabels: Record<ScriptLanguage, string> = {
  shell: "Shell",
  python: "Python",
};

export function getScriptExtension(language: ScriptLanguage): string {
  return language === "python" ? "py" : "sh";
}

export function toScriptSlug(name: string): string {
  return domSafeId(name) || "script";
}

export function getRepoScriptPath(
  repoPath: string,
  name: string,
  language: ScriptLanguage,
): string {
  return `${repoPath}/.polter/scripts/${toScriptSlug(name)}.${getScriptExtension(language)}`;
}

export function getCustomScriptCommandLine(script: Pick<ScriptLibraryItem, "language" | "path">): string {
  return script.language === "python" ? `python ${script.path}` : `sh ${script.path}`;
}

export function getPackageScriptCommandLine(
  packageManager: string,
  repoPath: string,
  scriptName: string,
  rootPath: string,
): string {
  if (repoPath === rootPath) {
    return `${packageManager} run ${scriptName}`;
  }

  return `${packageManager} --dir ${repoPath} run ${scriptName}`;
}

export function createCustomScript({
  body,
  description,
  id,
  language,
  name,
  repoName,
  repoPath,
  templateId,
}: {
  body: string;
  description: string;
  id: string;
  language: ScriptLanguage;
  name: string;
  repoName: string;
  repoPath: string;
  templateId?: string;
}): ScriptLibraryItem {
  const path = getRepoScriptPath(repoPath, name, language);

  return {
    id,
    source: "custom",
    name,
    description,
    language,
    path,
    repoName,
    repoPath,
    command: getCustomScriptCommandLine({ language, path }),
    commandLine: getCustomScriptCommandLine({ language, path }),
    body,
    editable: true,
    templateId,
  };
}

export function createTemplateItem(template: ScriptTemplate, repoPath: string): ScriptLibraryItem {
  const path = getRepoScriptPath(repoPath, template.name, template.language);

  return {
    id: `template:${template.id}`,
    source: "template",
    name: template.name,
    description: template.description,
    language: template.language,
    path,
    repoName: "template",
    repoPath,
    command: getCustomScriptCommandLine({ language: template.language, path }),
    commandLine: getCustomScriptCommandLine({ language: template.language, path }),
    body: template.body,
    editable: false,
    templateId: template.id,
  };
}

export function createPackageScriptItems(
  workspace: DesktopWorkspaceSnapshot | null | undefined,
): ScriptLibraryItem[] {
  if (!workspace) {
    return [];
  }

  const rootScripts = workspace.rootScripts.map((script) => ({
    id: `package:root:${script.name}`,
    source: "package" as const,
    name: script.name,
    description: "Package script discovered from the root package.json.",
    language: "shell" as const,
    path: workspace.root,
    repoName: "Root workspace",
    repoPath: workspace.root,
    command: script.command,
    commandLine: getPackageScriptCommandLine(
      workspace.packageManager.command,
      workspace.root,
      script.name,
      workspace.root,
    ),
    body: script.command,
    editable: false,
  }));

  const childScripts = workspace.childRepos.flatMap((repo) =>
    repo.scripts.map((script) => ({
      id: `package:${domSafeId(repo.path)}:${script.name}`,
      source: "package" as const,
      name: script.name,
      description: `Package script discovered from ${repo.name}.`,
      language: "shell" as const,
      path: repo.path,
      repoName: repo.name,
      repoPath: repo.path,
      command: script.command,
      commandLine: getPackageScriptCommandLine(
        repo.pkgManager.command,
        repo.path,
        script.name,
        workspace.root,
      ),
      body: script.command,
      editable: false,
    })),
  );

  return [...rootScripts, ...childScripts];
}

export function buildScriptLibrary({
  customScripts,
  templates,
  workspace,
}: {
  customScripts: ScriptLibraryItem[];
  templates: ScriptTemplate[];
  workspace: DesktopWorkspaceSnapshot | null | undefined;
}): ScriptLibraryItem[] {
  const repoPath = workspace?.root ?? "";

  return [
    ...customScripts,
    ...createPackageScriptItems(workspace),
    ...templates.map((template) => createTemplateItem(template, repoPath)),
  ];
}

export function filterScriptLibraryItems(
  items: ScriptLibraryItem[],
  source: ScriptSource,
): ScriptLibraryItem[] {
  return items.filter((item) => item.source === source);
}

export function createStageTarget(script: ScriptLibraryItem): ScriptStageTarget {
  return {
    commandLine: script.commandLine,
    cwd: script.repoPath,
    label: script.name,
    source: script.source,
  };
}
