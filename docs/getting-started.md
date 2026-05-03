# Getting Started

## Requirements

- Node.js.
- pnpm.
- Electron dependencies handled by the desktop package scripts.

## Installation

From the repository root:

```bash
pnpm install
```

## Environment Setup

Copy `.env.example` if you need local diagnostics or Electron renderer URL overrides:

```bash
cp .env.example .env
```

Common variables:

- `ELECTRON_RENDERER_URL`
- `POLTER_LOG_FORMAT`
- `POLTER_LOG_LEVEL`
- `POLTER_DEBUG`
- `EDITOR`
- `VISUAL`

## Running Locally

The root package scripts define:

```bash
pnpm dev
pnpm preview
```

## Verification Scripts

The root package scripts define:

```bash
pnpm typecheck
pnpm test
pnpm design:lint
pnpm build
```

## Notes

- This documentation pass did not run install, dev, build, preview, typecheck, or test commands.
- `legacy/tui` is archived and should not guide new setup work.
