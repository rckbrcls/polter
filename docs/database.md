# Storage And Persistence

## Database Technology

No database technology is active in the current codebase. There is no SQLite, Postgres, MySQL, Redis, ORM, migration system, schema folder, or seed workflow in the active workspace.

This document exists because Polter has local persistence and storage contracts even without a database.

## Storage Overview

Current storage surfaces:

| Storage | Location | Owner | Purpose |
| --- | --- | --- | --- |
| Project config | `.polter/config.json` | `packages/core/src/config/projectConfig.ts` | Per-project tool metadata, env entries, child repos, and pipelines. |
| Global config | `conf` package project `polter` | `packages/core/src/config/globalConf.ts` and `store.ts` | Global pipelines and saved desktop repositories. |
| Renderer localStorage | Browser `localStorage` key `polter.repositoryAppearance.v1` | `apps/desktop/src/renderer/features/repositories/repository-sidebar.tsx` | Local project display name, icon, and color preferences. |
| Declarative desired state | `polter.yaml` when present | `packages/core/src/declarative/parser.ts` | Optional desired infrastructure state for plan/apply helpers. |
| Process registry | In memory | `packages/core/src/lib/processManager.ts` | Runtime process metadata and stdout/stderr ring buffers. |

## Project Config Model

`ProjectConfig` is defined in `packages/core/src/data/types.ts`.

Shape:

```ts
interface ProjectConfig {
  version: 1;
  tools: {
    supabase?: { projectRef?: string };
    vercel?: { projectId?: string; orgId?: string };
    gh?: { repo?: string };
    git?: {};
    pkg?: { manager?: PkgManagerId };
  };
  env?: Record<string, string>;
  childRepos?: string[];
  pipelines: Pipeline[];
}
```

Current repository example:

```json
{
  "version": 1,
  "tools": {
    "supabase": {}
  },
  "pipelines": []
}
```

The project config path is resolved from the nearest package root and written to `.polter/config.json`.

## Pipeline Persistence

Pipelines can be project-scoped or global:

- Project pipelines are stored in `.polter/config.json`.
- Global pipelines are stored by `conf` under the key `globalPipelinesV1`.

Pipeline shape:

```ts
interface Pipeline {
  id: string;
  name: string;
  description?: string;
  steps: PipelineStep[];
  createdAt: string;
  updatedAt: string;
}
```

## Desktop Repository Persistence

Desktop repositories are stored globally through `conf` under the key `desktopRepositoriesV1`.

Shape:

```ts
interface DesktopRepository {
  id: string;
  name: string;
  path: string;
  lastOpenedAt: string;
  exists: boolean;
}
```

Repository IDs are derived from the normalized path and a SHA-1 hash prefix.

## Renderer Appearance Preferences

The repository sidebar stores purely local UI preferences in `localStorage`:

```text
polter.repositoryAppearance.v1
```

These preferences are desktop UI metadata only. They are not project metadata and are not written to `.polter/config.json`.

## Declarative `polter.yaml`

The declarative parser looks for `polter.yaml` in the selected working directory.

Supported top-level areas include:

- `version`
- `project`
- `supabase`
- `vercel`
- `github`
- `pkg`
- `pipelines`

The parser is a small internal YAML parser, not a full YAML dependency. It is intended for simple Polter configs.

## Process Runtime Storage

The process manager stores process state in memory:

- Process metadata is held in a `Map`.
- stdout and stderr use ring buffers.
- Default buffer capacity is 1000 lines per stream.
- State is lost when the hosting process exits.

This is suitable for current local runtime helpers, but not for durable audit history.

## Migrations And Seeds

No migrations or seeds were identified in the active codebase.

If durable storage is added later, schema changes should include:

- Explicit migration files.
- Versioned schema ownership.
- Backward-compatible config migration where possible.
- Tests for reading old config shapes.

## Data Access Strategy

Current strategy:

- Use structured JSON for project config.
- Use `conf` for small global local settings.
- Use renderer `localStorage` only for UI-only appearance preferences.
- Use memory for mock renderer state and active process tracking.
- Avoid treating command output, secrets, or shell history as durable data by default.

## Performance Considerations

- Process output buffers are capped to avoid unbounded memory growth.
- `listDesktopRepositories()` refreshes `exists` status when reading repositories.
- Command search in the renderer uses in-memory data in the current UI-only phase.
- A future durable command registry, audit log, or machine registry should not be built on `conf` or `localStorage`.

## Precautions

- Do not store secrets in `.polter/config.json`.
- Do not store shell history by default.
- Do not move user-facing project metadata into renderer `localStorage`.
- Treat `polter.yaml` as desired state, not as an execution log.
- Add migrations before introducing a real database or changing persisted config shapes broadly.
