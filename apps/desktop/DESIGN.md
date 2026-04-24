---
version: alpha
name: Polter Desktop
description: A serious desktop command workbench for inspecting, composing, and running developer workflows.
theme:
  implementation: "shadcn/ui radix-luma"
  baseColor: "zinc"
  css: "apps/desktop/src/renderer/styles.css"
  config: "apps/desktop/components.json"
colors:
  background: "#ffffff"
  foreground: "#09090b"
  card: "#ffffff"
  card-foreground: "#09090b"
  popover: "#ffffff"
  popover-foreground: "#09090b"
  primary: "#18181b"
  primary-foreground: "#fafafa"
  secondary: "#f4f4f5"
  secondary-foreground: "#18181b"
  muted: "#f4f4f5"
  muted-foreground: "#71717a"
  accent: "#f4f4f5"
  accent-foreground: "#18181b"
  destructive: "#dc2626"
  border: "#e4e4e7"
  input: "#e4e4e7"
  ring: "#a1a1aa"
  sidebar: "#fafafa"
  sidebar-foreground: "#09090b"
  sidebar-accent: "#f4f4f5"
  sidebar-accent-foreground: "#18181b"
  sidebar-border: "#e4e4e7"
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
  base: "0.625rem"
  xs: "2px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  3xl: "22px"
  4xl: "26px"
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
components:
  button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.4xl}"
    height: 36px
  secondary-button:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.4xl}"
    height: 36px
  destructive-button:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.4xl}"
    height: 36px
  command-palette:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.popover-foreground}"
    rounded: "{rounded.4xl}"
    padding: 4px
  panel:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.4xl}"
    padding: 24px
  muted-row:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.2xl}"
    padding: 8px
  metadata:
    backgroundColor: "{colors.card}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.label}"
  accent-row:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.2xl}"
    padding: 8px
  sidebar:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.sidebar-foreground}"
    padding: 8px
  sidebar-row:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.sidebar-accent-foreground}"
    rounded: "{rounded.md}"
    padding: 8px
  sidebar-divider:
    backgroundColor: "{colors.sidebar-border}"
    textColor: "{colors.sidebar-foreground}"
    height: 1px
  inspector:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.3xl}"
    padding: 16px
  input:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.3xl}"
    height: 36px
  divider:
    backgroundColor: "{colors.border}"
    textColor: "{colors.foreground}"
    height: 1px
  focus-ring:
    backgroundColor: "{colors.ring}"
    textColor: "{colors.foreground}"
    size: 2px
  code-log:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    typography: "{typography.mono}"
    rounded: "{rounded.3xl}"
    padding: 16px
---

## Overview

Polter Desktop is a serious command workbench for developers who need to inspect tools, compose workflows, manage background processes, and understand project state without leaving the desktop app.

The interface should feel operational, mature, and native to long work sessions. It is not a marketing surface. It should privilege density, hierarchy, keyboard movement, readable logs, and predictable panes over decorative presentation.

## Theme Source

The active renderer theme is the `radix-luma` shadcn/ui preset with `zinc` as the base color. The implementation lives in `apps/desktop/src/renderer/styles.css`, and `apps/desktop/components.json` points shadcn at that file.

Use semantic CSS variables such as `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--muted`, `--accent`, `--border`, `--input`, `--ring`, and the `--sidebar-*` family. Do not introduce one-off hex, RGB, or OKLCH values in component code unless the theme file and this document are updated together.

## Colors

The current aesthetic is a restrained neutral desktop workbench. Light mode uses white and gray surfaces; dark mode uses black, charcoal, and gray surfaces. Color should come from state and hierarchy, not decorative variety.

The active CSS values are OKLCH tokens in `styles.css`. The frontmatter keeps hex approximations only so the design lint tool can validate the document.

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --popover: oklch(1 0 0);
  --primary: oklch(0.205 0 0);
  --secondary: oklch(0.97 0 0);
  --muted: oklch(0.97 0 0);
  --accent: oklch(0.97 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --popover: oklch(0.205 0 0);
  --primary: oklch(0.922 0 0);
  --secondary: oklch(0.269 0 0);
  --muted: oklch(0.269 0 0);
  --accent: oklch(0.269 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}
```

- **Background / foreground:** The app canvas and default readable text.
- **Card / popover:** Raised surfaces, menus, modals, command palette, and grouped regions.
- **Muted / accent:** Low-emphasis controls, selected rows, hover states, and quiet affordances.
- **Primary:** Main actions and active emphasis.
- **Destructive:** Destructive actions and real error states only.
- **Sidebar tokens:** Sidebar chrome and project navigation.

Avoid purple gradients, blue-black drift, glass panels, translucent decorative layers, neon glow, and color variety that makes the app feel like a generic SaaS dashboard.

## Radius

Radius is part of the theme, not an ad hoc component decision. The base token is `--radius: 0.625rem`; Tailwind maps it to the following app scale:

- `rounded-xs`: 2px for tiny marks, arrows, and chart chips.
- `rounded-sm`: 6px for checkboxes and small hard-edged controls.
- `rounded-md`: 8px for compact icon buttons and dense rows.
- `rounded-lg`: 10px for small popovers that need a slightly softer edge.
- `rounded-xl`: 14px for sidebar controls and small media slots.
- `rounded-2xl`: 18px for menu items, command rows, and compact grouped fields.
- `rounded-3xl`: 22px for inputs, menus, inspector panes, and output regions.
- `rounded-4xl`: 26px for cards, dialogs, drawers, command palette shells, and large surfaces.

Do not use numeric arbitrary radii such as `rounded-[1.5rem]` in active renderer code. `rounded-full` is allowed only for true circles, switches, sliders, and token-like controls. `rounded-[inherit]` is allowed only when a child must match the parent radius exactly.

## Spacing And Padding

Spacing is part of the theme scale. Use Tailwind spacing utilities in 4px increments and avoid arbitrary padding values in active renderer code.

- Dense rows: `px-3 py-2`.
- Compact grouped fields: `p-3` or `p-4`.
- Dialog and command palette shells: `p-4`.
- Inspector panes: `p-5`.
- Tool strips: `p-3` or `p-4`, separated from scrollable content.

Command palettes must keep results and search input as distinct surfaces. A single search input may sit directly in the footer without an extra wrapper card; only add a grouped footer surface when it carries multiple controls.

## Typography

Use Inter Variable as the product typeface for now because the app already imports it and the current priority is maturity and consistency. Use system monospace for command output, exact invocations, file paths, and logs.

Headings stay compact. Labels may use slight positive letter spacing, but normal body text must remain at `letterSpacing: 0`. Do not scale type with viewport width.

Labels must be terse. Use one to three words for field labels, table headers, tabs, badges, and toolbar text whenever possible. Do not use sentence-length labels, explanatory labels, redundant page titles, or long helper copy as a substitute for clear layout. Keep the default interface minimal; move necessary explanation into placeholders, tooltips, empty states, inspectors, or documentation instead of making every surface describe itself.

## Layout

The default shape is a command workbench:

- A persistent navigation rail or sidebar for major surfaces.
- A central task area for lists, forms, tables, and command composition.
- Optional inspectors or detail panes for focused metadata, logs, or output.
- Tight but breathable spacing based on 4px increments.

Prefer split panes, tables, grouped fields, command palettes, toolbars, context menus, toasts, and status strips. Do not build landing-page hero sections inside the app.

Avoid nested card structures. A card may own a compact record, command, or repeated item, but page sections must not be framed as large cards that contain more card-like rows or forms. Forms and actions should not be stacked as cards inside larger cards. Use a modal for simple forms, and use a dedicated page, sidebar, inspector, or split-pane view for complex forms, multi-step commands, and larger content workflows.

## Scripts Surface

The Scripts workflow is a library/editor surface, not a runtime monitor. Its list view should be minimal: source tabs, creation actions, script rows, and short row metadata only. Do not add a redundant page title or explanatory paragraph at the top of the list.

Custom scripts are visually prepared for `.polter/scripts` storage. Until filesystem persistence is implemented, the desktop UI may keep them in mock or in-memory state, but the interface must still show the future repo-local path clearly.

The primary execution-related action from Scripts is **Stage in Processes**. This fills the Processes command input for review and does not start a process automatically. Package scripts belong in Scripts for discovery and staging; Processes owns direct command launch, process state, logs, stop/remove actions, and runtime feedback.

Creation and editing in Scripts must use a dedicated editor mode, modal, sheet, or builder-style page. Do not show the script list and a large edit form on the same surface.

## Elevation And Feedback

Depth comes from borders, contrast, rings, and pane separation. Shadows exist in some shadcn primitives, but they must stay subtle and subordinate to the desktop workbench shape.

Use Sonner toasts for transient success/error notifications. Do not place large persistent alert cards at the top of the main workspace for routine operations.

No glassmorphism, blur-backed cards, neon glows, floating gradient objects, or decorative depth effects.

## Components

Primary components should support repeated professional use:

- **Command lists:** Dense rows, clear active state, visible keyboard focus.
- **Forms:** Left-aligned labels, compact descriptions, explicit validation.
- **Logs and output:** Monospace, scrollable, copy-friendly, stable height.
- **Tables:** Scannable columns, sticky context where useful, no decorative cards.
- **Status surfaces:** Calm text first, color second, icons only when they reduce scanning time.
- **Dialogs and sheets:** Focused on a single decision or edit, never used as decorative layout.
- **Project sidebar:** Stores local visual preferences, such as display name, icon, and icon tone, as desktop UI preferences rather than repository metadata.

Use `shadcn/ui` and Radix primitives as implementation tools, but tune them back to this desktop workbench direction.

## Do's And Don'ts

Do:

- Make the first screen useful for real desktop work.
- Keep command execution, process state, and workspace metadata easy to scan.
- Use semantic theme tokens for all colors.
- Keep radius choices on the documented scale.
- Keep controls stable in size across states.
- Prefer direct labels and concrete action verbs.

Don't:

- Add generic SaaS hero blocks, feature cards, marketing copy, or decorative dashboards.
- Use gradient orbs, glass panels, heavy shadows, neon glow, or bokeh backgrounds.
- Hide operational state behind oversized cards.
- Add visual effects that make logs, paths, commands, or errors harder to read.
- Create custom styling that bypasses these tokens without updating this file.
