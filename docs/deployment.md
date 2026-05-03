# Deployment

## Overview

Polter is currently packaged through the Electron desktop app workspace. The root scripts expose distribution targets, but signing/notarization policy should be confirmed before public release.

## Distribution Scripts

The root package scripts define:

```bash
pnpm dist
pnpm dist:mac
pnpm dist:win
pnpm dist:linux
pnpm dist:all
```

## Notes

- Confirm whether builds are unsigned or signed before distribution.
- Confirm auto-update strategy before documenting update channels.
- Keep `packages/core` portable for future CLI/service surfaces.
