---
version: alpha
name: Polter Desktop
description: A serious desktop command workbench for inspecting, composing, and running developer workflows.
colors:
  primary: "#E8ECEF"
  on-primary: "#0B0D10"
  secondary: "#A7B0B8"
  on-secondary: "#0B0D10"
  tertiary: "#86E1C4"
  on-tertiary: "#07110E"
  background: "#0B0D10"
  foreground: "#E8ECEF"
  surface: "#12161B"
  surface-raised: "#171D23"
  surface-muted: "#20262E"
  border: "#303842"
  border-strong: "#4A5562"
  muted: "#8A949F"
  danger: "#F36F6F"
  warning: "#F2C15F"
  success: "#86E1C4"
typography:
  title:
    fontFamily: Inter Variable
    fontSize: 1.375rem
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: 0
  section:
    fontFamily: Inter Variable
    fontSize: 0.9375rem
    fontWeight: 620
    lineHeight: 1.35
    letterSpacing: 0
  body:
    fontFamily: Inter Variable
    fontSize: 0.875rem
    fontWeight: 450
    lineHeight: 1.5
    letterSpacing: 0
  label:
    fontFamily: Inter Variable
    fontSize: 0.75rem
    fontWeight: 620
    lineHeight: 1.35
    letterSpacing: 0.04em
  mono:
    fontFamily: ui-monospace
    fontSize: 0.8125rem
    fontWeight: 450
    lineHeight: 1.55
    letterSpacing: 0
rounded:
  sm: 4px
  md: 6px
  lg: 8px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 8px
  button-secondary:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 8px
  button-inverse:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 8px
  tag-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 4px
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 16px
  divider:
    backgroundColor: "{colors.border}"
    textColor: "{colors.foreground}"
    height: 1px
  focus-ring:
    backgroundColor: "{colors.border-strong}"
    textColor: "{colors.foreground}"
    size: 2px
  metadata:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  sidebar:
    backgroundColor: "{colors.background}"
    textColor: "{colors.secondary}"
    padding: 12px
  inspector:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 16px
  code-log:
    backgroundColor: "{colors.background}"
    textColor: "{colors.primary}"
    typography: "{typography.mono}"
    rounded: "{rounded.sm}"
    padding: 12px
  status-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.background}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 4px
  status-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.background}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 4px
  status-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.background}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 4px
---

## Overview

Polter Desktop is a serious command workbench for developers who need to inspect tools, run repeatable workflows, manage background processes, and understand project state without leaving the desktop app.

The interface should feel operational, mature, and native to long work sessions. It is not a marketing surface. It should privilege density, hierarchy, keyboard movement, readable logs, and predictable panes over decorative presentation.

## Colors

The palette is a restrained dark workbench with a single mint technical accent. Neutrals carry almost all structure; accent color is reserved for the current route, primary action, active state, success state, or a small affordance that needs immediate recognition.

- **Background (#0B0D10):** The app chrome and deep canvas.
- **Surface (#12161B):** Primary content panels and grouped work areas.
- **Surface Raised (#171D23):** Inspectors, focused regions, and editable panels.
- **Border (#303842):** Persistent separators and pane boundaries.
- **Tertiary (#86E1C4):** The only high-energy interaction color.
- **Danger / Warning / Success:** Used only for real status, never as decoration.

Avoid blue-black drift, purple gradients, translucent overlays, and color variety that makes the app feel like a generic SaaS dashboard.

## Typography

Use Inter Variable as the product typeface for now because the app already imports it and the current priority is maturity, not typographic novelty. Use system monospace for command output, exact invocations, and logs.

Headings stay compact. Labels may use slight positive letter spacing, but normal body text must remain at `letterSpacing: 0`. Do not scale type with viewport width.

## Layout

The default shape is a command workbench:

- A persistent navigation rail or sidebar for major surfaces.
- A central task area for lists, forms, tables, and command composition.
- An optional inspector/detail region for focused metadata, logs, or output.
- Tight but breathable spacing based on 4px increments.

Prefer split panes, tables, grouped fields, command palettes, toolbars, and status strips. Do not build landing-page hero sections inside the app.

## Elevation & Depth

Depth comes from clear borders, contrast, and pane separation. Shadows are not part of the default system. Use raised surfaces sparingly and only when a region needs interaction priority.

No glassmorphism, blur-backed cards, neon glows, floating gradient objects, or decorative depth effects.

## Shapes

Corners are small and utilitarian. The default radius is 4px to 8px. Larger radii require a specific component need, such as a modal or command palette, and must not become the dominant visual language.

Avoid pill-shaped buttons unless the control is truly a segmented or token-like interaction.

## Components

Primary components should support repeated professional use:

- **Command lists:** Dense rows, clear active state, visible keyboard focus.
- **Forms:** Left-aligned labels, compact descriptions, explicit validation.
- **Logs and output:** Monospace, scrollable, copy-friendly, stable height.
- **Tables:** Scannable columns, sticky context where useful, no decorative cards.
- **Status surfaces:** Calm text first, color second, icons only when they reduce scanning time.
- **Dialogs and sheets:** Focused on a single decision or edit, never used as decorative layout.

Use `shadcn/ui` and Radix primitives as implementation tools, but tune them back to this desktop workbench direction.

## Do's and Don'ts

Do:

- Make the first screen useful for real desktop work.
- Keep command execution, process state, and workspace metadata easy to scan.
- Use one accent color intentionally.
- Keep controls stable in size across states.
- Prefer direct labels and concrete action verbs.

Don't:

- Add generic SaaS hero blocks, feature cards, marketing copy, or decorative dashboards.
- Use gradient orbs, glass panels, heavy shadows, neon glow, or bokeh backgrounds.
- Hide operational state behind oversized cards.
- Add visual effects that make logs, paths, commands, or errors harder to read.
- Create custom styling that bypasses these tokens without updating this file.
