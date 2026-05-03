# Troubleshooting

## Desktop app does not load the renderer

Checks:

- Confirm `ELECTRON_RENDERER_URL` only when overriding the default development renderer URL.
- Confirm the desktop package is the active surface under `apps/desktop`.

## Core command/process behavior is unexpected

Checks:

- Inspect `packages/core` first for shared non-visual logic.
- Confirm environment variables are not leaking secrets into logs.
- Keep renderer UI mock/local-only until runtime integration is explicitly added.

## Legacy TUI behavior differs from desktop

`legacy/tui` is archived transition code. Do not treat it as the current product contract.
