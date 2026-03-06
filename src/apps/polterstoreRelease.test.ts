import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_ARTIFACT_ENV_VAR,
  DEFAULT_GITHUB_REPO_ENV_VAR,
  resolvePolterstoreMacosArtifact,
  selectPolterstoreMacosReleaseAsset,
} from "./polterstoreRelease.js";

const originalEnv = process.env;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("resolvePolterstoreMacosArtifact", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("prefers an explicit artifact URL over GitHub release resolution", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;

    const resolved = await resolvePolterstoreMacosArtifact(
      {
        artifactUrl: "https://example.com/downloads/polterstore-macos.zip",
        version: "1.2.3",
      },
      process.env,
      fetchImpl,
      "arm64",
    );

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(resolved).toEqual({
      url: "https://example.com/downloads/polterstore-macos.zip",
      fileName: "polterstore-macos.zip",
      source: "explicit-url",
    });
  });

  it("supports an environment override for the artifact URL", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    process.env[DEFAULT_ARTIFACT_ENV_VAR] =
      "https://example.com/downloads/polterstore-macos-x64.app.tar.gz";

    const resolved = await resolvePolterstoreMacosArtifact({}, process.env, fetchImpl, "x64");

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(resolved).toEqual({
      url: "https://example.com/downloads/polterstore-macos-x64.app.tar.gz",
      fileName: "polterstore-macos-x64.app.tar.gz",
      source: "explicit-url",
    });
  });

  it("resolves the latest GitHub release from the default repository", async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      expect(String(input)).toBe(
        "https://api.github.com/repos/polterware/polterstore/releases/latest",
      );

      return jsonResponse({
        tag_name: "v1.2.3",
        assets: [
          {
            name: "polterstore-macos-aarch64.app.tar.gz",
            browser_download_url:
              "https://github.com/polterware/polterstore/releases/download/v1.2.3/polterstore-macos-aarch64.app.tar.gz",
            size: 123,
          },
        ],
      });
    }) as unknown as typeof fetch;

    const resolved = await resolvePolterstoreMacosArtifact({}, process.env, fetchImpl, "arm64");

    expect(resolved).toEqual({
      url: "https://github.com/polterware/polterstore/releases/download/v1.2.3/polterstore-macos-aarch64.app.tar.gz",
      fileName: "polterstore-macos-aarch64.app.tar.gz",
      size: 123,
      source: "github-release",
      repo: "polterware/polterstore",
      tagName: "v1.2.3",
    });
  });

  it("tries both v-prefixed and raw version tags with a repository override", async () => {
    process.env[DEFAULT_GITHUB_REPO_ENV_VAR] = "forks/example-polterstore";

    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.endsWith("/releases/tags/v2.0.0")) {
        return jsonResponse({ message: "Not Found" }, 404);
      }

      expect(url).toBe(
        "https://api.github.com/repos/forks/example-polterstore/releases/tags/2.0.0",
      );

      return jsonResponse({
        tag_name: "2.0.0",
        assets: [
          {
            name: "polterstore-macos-x64.app.tar.gz",
            browser_download_url:
              "https://github.com/forks/example-polterstore/releases/download/2.0.0/polterstore-macos-x64.app.tar.gz",
            size: 456,
          },
        ],
      });
    }) as unknown as typeof fetch;

    const resolved = await resolvePolterstoreMacosArtifact(
      { version: "2.0.0" },
      process.env,
      fetchImpl,
      "x64",
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(resolved).toEqual({
      url: "https://github.com/forks/example-polterstore/releases/download/2.0.0/polterstore-macos-x64.app.tar.gz",
      fileName: "polterstore-macos-x64.app.tar.gz",
      size: 456,
      source: "github-release",
      repo: "forks/example-polterstore",
      tagName: "2.0.0",
    });
  });
});

describe("selectPolterstoreMacosReleaseAsset", () => {
  it("prefers universal assets over architecture-specific ones", () => {
    const selected = selectPolterstoreMacosReleaseAsset(
      [
        {
          name: "polterstore-macos-arm64.app.tar.gz",
          browserDownloadUrl: "https://example.com/arm64",
        },
        {
          name: "polterstore-macos-universal.zip",
          browserDownloadUrl: "https://example.com/universal",
        },
      ],
      "arm64",
    );

    expect(selected.name).toBe("polterstore-macos-universal.zip");
  });

  it("throws a directed error when only unsupported assets exist", () => {
    expect(() =>
      selectPolterstoreMacosReleaseAsset(
        [
          {
            name: "polterstore-macos-arm64.dmg",
            browserDownloadUrl: "https://example.com/polterstore-macos-arm64.dmg",
          },
        ],
        "arm64",
      ),
    ).toThrow(
      "No supported macOS archive was found in the release. Expected a .app.tar.gz or .zip asset for macOS, found: polterstore-macos-arm64.dmg.",
    );
  });
});
