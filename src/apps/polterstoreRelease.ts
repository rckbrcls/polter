import type { ParsedCliOptions } from "./types.js";

export const DEFAULT_POLTERSTORE_GITHUB_REPO = "polterware/polterstore";
export const DEFAULT_ARTIFACT_ENV_VAR = "POLTERBASE_POLTERSTORE_MACOS_ARTIFACT_URL";
export const DEFAULT_GITHUB_REPO_ENV_VAR = "POLTERBASE_POLTERSTORE_GITHUB_REPO";

const GITHUB_API_BASE = "https://api.github.com/repos";

interface GitHubReleasePayload {
  tag_name?: unknown;
  assets?: unknown;
  message?: unknown;
}

export interface GitHubReleaseAsset {
  name: string;
  browserDownloadUrl: string;
  size?: number;
}

export interface GitHubRelease {
  tagName: string | null;
  assets: GitHubReleaseAsset[];
}

export interface ResolvedPolterstoreArtifact {
  url: string;
  fileName: string;
  size?: number;
  source: "explicit-url" | "github-release";
  repo?: string;
  tagName?: string | null;
}

function getGitHubHeaders(env: NodeJS.ProcessEnv): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = env.GITHUB_TOKEN?.trim() || env.GH_TOKEN?.trim();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function getGitHubReleaseRequestLabel(repo: string, version?: string): string {
  if (!version) {
    return `latest release in ${repo}`;
  }

  return `release ${version} in ${repo}`;
}

function parseGitHubReleaseAsset(value: unknown): GitHubReleaseAsset | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const asset = value as Record<string, unknown>;
  const name = typeof asset.name === "string" ? asset.name.trim() : "";
  const browserDownloadUrl =
    typeof asset.browser_download_url === "string"
      ? asset.browser_download_url.trim()
      : "";
  const size = typeof asset.size === "number" ? asset.size : undefined;

  if (!name || !browserDownloadUrl) {
    return null;
  }

  return {
    name,
    browserDownloadUrl,
    size,
  };
}

async function parseGitHubReleaseResponse(
  response: Response,
  label: string,
): Promise<GitHubRelease> {
  const body = await response.text();

  if (!response.ok) {
    let detail = body.trim();

    try {
      const parsed = JSON.parse(body) as GitHubReleasePayload;
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        detail = parsed.message.trim();
      }
    } catch {
      // Fall back to the raw response body.
    }

    throw new Error(
      `Unable to resolve ${label}: ${response.status} ${response.statusText}${detail ? ` (${detail})` : ""}.`,
    );
  }

  let parsed: GitHubReleasePayload;
  try {
    parsed = JSON.parse(body) as GitHubReleasePayload;
  } catch (error) {
    throw new Error(
      `Unable to parse ${label} from GitHub: ${error instanceof Error ? error.message : String(error)}.`,
    );
  }

  const assets = Array.isArray(parsed.assets)
    ? parsed.assets
        .map((asset) => parseGitHubReleaseAsset(asset))
        .filter((asset): asset is GitHubReleaseAsset => asset !== null)
    : [];

  if (assets.length === 0) {
    throw new Error(`GitHub ${label} did not contain any downloadable assets.`);
  }

  return {
    tagName: typeof parsed.tag_name === "string" ? parsed.tag_name : null,
    assets,
  };
}

export function normalizePolterstoreReleaseVersion(version: string): string {
  return version.trim().replace(/^v/i, "");
}

function buildVersionTagCandidates(version: string): string[] {
  const normalized = normalizePolterstoreReleaseVersion(version);

  if (!normalized) {
    return [];
  }

  return Array.from(new Set([`v${normalized}`, normalized]));
}

async function fetchGitHubRelease(
  repo: string,
  version: string | undefined,
  fetchImpl: typeof fetch,
  env: NodeJS.ProcessEnv,
): Promise<GitHubRelease> {
  const headers = getGitHubHeaders(env);

  if (version) {
    const tagCandidates = buildVersionTagCandidates(version);

    for (const tag of tagCandidates) {
      const response = await fetchImpl(
        `${GITHUB_API_BASE}/${repo}/releases/tags/${encodeURIComponent(tag)}`,
        { headers },
      );

      if (response.status === 404) {
        continue;
      }

      return parseGitHubReleaseResponse(
        response,
        getGitHubReleaseRequestLabel(repo, tag),
      );
    }

    throw new Error(
      `Unable to find release ${normalizePolterstoreReleaseVersion(version)} in ${repo}.`,
    );
  }

  const response = await fetchImpl(`${GITHUB_API_BASE}/${repo}/releases/latest`, {
    headers,
  });

  return parseGitHubReleaseResponse(
    response,
    getGitHubReleaseRequestLabel(repo),
  );
}

export function getArtifactFileNameFromUrl(
  url: string,
  fallback = "polterstore-macos.zip",
): string {
  try {
    const pathname = new URL(url).pathname;
    const name = decodeURIComponent(pathname.split("/").pop() ?? "").trim();
    return name || fallback;
  } catch {
    const name = decodeURIComponent(url.split("?")[0]?.split("/").pop() ?? "").trim();
    return name || fallback;
  }
}

function hasSupportedArchiveFormat(name: string): boolean {
  const lowered = name.toLowerCase();
  return lowered.endsWith(".app.tar.gz") || lowered.endsWith(".zip");
}

function hasMacosHint(name: string): boolean {
  const lowered = name.toLowerCase();
  return (
    lowered.endsWith(".app.tar.gz") ||
    lowered.includes(".app.zip") ||
    lowered.includes("macos") ||
    lowered.includes("darwin") ||
    lowered.includes("universal")
  );
}

export function isSupportedPolterstoreMacosArtifactName(name: string): boolean {
  return hasSupportedArchiveFormat(name) && hasMacosHint(name);
}

function getArchAliases(arch: string): string[] {
  switch (arch) {
    case "arm64":
    case "aarch64":
      return ["arm64", "aarch64"];
    case "x64":
    case "x86_64":
    case "amd64":
      return ["x64", "x86_64", "amd64"];
    default:
      return [arch.toLowerCase()];
  }
}

function hasAnyArchHint(name: string): boolean {
  return /(arm64|aarch64|x64|x86_64|amd64)/.test(name.toLowerCase());
}

function getArchPriority(name: string, arch: string): number {
  const lowered = name.toLowerCase();

  if (lowered.includes("universal")) {
    return 0;
  }

  const aliases = getArchAliases(arch);
  if (aliases.some((alias) => lowered.includes(alias))) {
    return 1;
  }

  if (hasAnyArchHint(lowered)) {
    return 3;
  }

  return 2;
}

function getFormatPriority(name: string): number {
  return name.toLowerCase().endsWith(".app.tar.gz") ? 0 : 1;
}

export function selectPolterstoreMacosReleaseAsset(
  assets: GitHubReleaseAsset[],
  arch: string = process.arch,
): GitHubReleaseAsset {
  const supported = assets
    .map((asset, index) => ({ asset, index }))
    .filter(({ asset }) => isSupportedPolterstoreMacosArtifactName(asset.name))
    .sort((left, right) => {
      const archPriority =
        getArchPriority(left.asset.name, arch) - getArchPriority(right.asset.name, arch);
      if (archPriority !== 0) {
        return archPriority;
      }

      const formatPriority =
        getFormatPriority(left.asset.name) - getFormatPriority(right.asset.name);
      if (formatPriority !== 0) {
        return formatPriority;
      }

      return left.index - right.index;
    });

  if (supported.length === 0) {
    const names = assets.map((asset) => asset.name).join(", ");
    throw new Error(
      `No supported macOS archive was found in the release. Expected a .app.tar.gz or .zip asset for macOS, found: ${names}.`,
    );
  }

  return supported[0]!.asset;
}

export async function resolvePolterstoreMacosArtifact(
  options: Pick<ParsedCliOptions, "artifactUrl" | "version">,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
  arch: string = process.arch,
): Promise<ResolvedPolterstoreArtifact> {
  const explicitUrl = options.artifactUrl?.trim() || env[DEFAULT_ARTIFACT_ENV_VAR]?.trim();
  if (explicitUrl) {
    return {
      url: explicitUrl,
      fileName: getArtifactFileNameFromUrl(explicitUrl),
      source: "explicit-url",
    };
  }

  const repo = env[DEFAULT_GITHUB_REPO_ENV_VAR]?.trim() || DEFAULT_POLTERSTORE_GITHUB_REPO;
  const release = await fetchGitHubRelease(repo, options.version, fetchImpl, env);
  const asset = selectPolterstoreMacosReleaseAsset(release.assets, arch);

  return {
    url: asset.browserDownloadUrl,
    fileName: asset.name,
    size: asset.size,
    source: "github-release",
    repo,
    tagName: release.tagName,
  };
}
