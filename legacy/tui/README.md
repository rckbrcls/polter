# Legacy Polter TUI

> Status: archived transition code.

This package contains the older Ink/Bun terminal implementation of Polter. It is kept for historical reference while the active product moves to the Electron desktop app in `apps/desktop` and shared TypeScript services in `packages/core`.

Do not use this package as the source of truth for new product architecture. New runtime and UI work should target the active workspace unless a task explicitly asks to inspect or preserve legacy behavior.

## Responsibility

The legacy TUI previously provided:

- Terminal command browsing across Supabase CLI, GitHub CLI, Vercel CLI, Git, and package managers.
- Pipeline execution.
- Background process management.
- Project configuration editing.
- Declarative `polter.yaml` planning and applying.
- MCP server entrypoint.
- Bun-based binary packaging scripts.

## How It Fits Into The Current Repository

```text
apps/desktop/      # Active product surface
packages/core/     # Active shared non-visual logic
legacy/tui/        # Archived terminal implementation
```

The legacy package remains useful when comparing old command taxonomy, older terminal UX decisions, pipeline behavior, process manager behavior, and MCP server behavior. It should not drive new desktop UI structure.

## Main Files And Folders

```text
legacy/tui/
├── src/
│   ├── app.tsx
│   ├── appPanel.tsx
│   ├── index.tsx
│   ├── mcp.ts
│   ├── components/
│   ├── screens/
│   ├── hooks/
│   ├── data/
│   ├── lib/
│   ├── config/
│   ├── core/
│   ├── declarative/
│   └── pipeline/
├── docs/assets/
├── install.sh
├── uninstall.sh
├── release.sh
├── package.json
└── LICENSE
```

## Technology Stack

- TypeScript.
- React.
- Ink.
- Bun.
- MCP SDK.
- execa.
- conf.
- Zod.
- Vitest.
- tsup.

## Scripts

Legacy scripts from `legacy/tui/package.json`:

| Script | Purpose |
| --- | --- |
| `bun run dev` | Watches legacy sources with tsup. |
| `bun run build` | Builds legacy JS output with tsup. |
| `bun run lint` | Runs `tsc --noEmit`. |
| `bun run test` | Runs Vitest. |
| `bun run test:watch` | Runs Vitest in watch mode. |
| `bun run build:bin` | Compiles legacy Bun binaries. |
| `bun run build:all` | Builds JS output and binaries. |

These scripts are for archived code. They are not the current desktop workflow.

## Legacy Package Metadata

- Package name: `@polterware/polter`
- Version in package manifest: `0.6.3`
- License in this legacy package: MIT
- Binary names: `polter`, `polter-mcp`

## Important Notes

- The active root package does not declare a license.
- The MIT license in `legacy/tui/LICENSE` should not be assumed to cover the whole current monorepo without confirmation.
- The root `.github/workflows/release.yml` appears aligned with this older Bun binary shape, not the active Electron monorepo.
- Keep documentation and code changes in English.
