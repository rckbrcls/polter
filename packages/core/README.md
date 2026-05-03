# @polterware/core

> **Status:** To be confirmed
> Shared Polter core services snapshot for CLI, MCP, pipelines, process management, and desktop integrations.

## Summary

- Shared TypeScript core for Polter's non-visual domain behavior in this checkout.
- Solves reuse across desktop and future surfaces by centralizing command metadata, package-manager helpers, process management, pipelines, declarative config, MCP setup, and IPC helpers.
- Main stack: TypeScript, Vitest, Zod, execa, conf, eventemitter3, and the Model Context Protocol SDK.
- Current status: to be confirmed because this lives in a separate `polter-rckbrcls` checkout.
- Technical value: keeps orchestration code portable and out of React renderer components.

TypeScript package that holds Polter's non-visual logic. It is consumed by the desktop app and is designed to remain portable for future CLI, service, or backend surfaces.

## Features

- Command metadata and package-manager helpers.
- Process manager and runner utilities.
- Pipeline engine, events, and storage.
- Declarative config parsing, planning, and application.
- MCP installer and skill setup utilities.
- IPC protocol/client/server helpers.
- Desktop service adapter exported through `./desktop`.

## Tech Stack

- TypeScript
- Vitest
- Zod
- execa
- conf
- eventemitter3
- Model Context Protocol SDK

## Usage

Package exports:

- `@polterware/core`
- `@polterware/core/catalog`
- `@polterware/core/desktop`

Primary scripts from `package.json`:

- `pnpm build`
- `pnpm typecheck`
- `pnpm test`

## Project Structure

```text
packages/core/
├── package.json
├── tsconfig.json
└── src/
    ├── core/
    ├── config/
    ├── data/
    ├── declarative/
    ├── desktop/
    ├── lib/
    └── pipeline/
```

## Architecture

The package keeps command execution, configuration, process lifecycle, and pipeline behavior outside the renderer. UI surfaces should call into this package through explicit adapters rather than duplicating orchestration logic.

## Technical Highlights

- Tests cover config storage, execution, process management, package manager behavior, CLI args, IPC protocol, YAML writing, pins, and suggested arguments.
- The package is not marked private in its manifest, but this workspace currently consumes it locally.
- Version in `package.json`: `0.6.3`.
