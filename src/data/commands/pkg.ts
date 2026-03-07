import type { CommandDef } from "../types.js";

export const pkgCommands: CommandDef[] = [
  // Build & Publish
  { id: "pkg:build",         tool: "pkg", base: ["run", "build"],      label: "build",         hint: "Run build script" },
  { id: "pkg:publish",       tool: "pkg", base: ["publish"],           label: "publish",       hint: "Publish package to registry" },
  { id: "pkg:pack",          tool: "pkg", base: ["pack"],              label: "pack",          hint: "Create tarball from package" },
  { id: "pkg:version:patch", tool: "pkg", base: ["version", "patch"],  label: "version patch", hint: "Bump patch version" },
  { id: "pkg:version:minor", tool: "pkg", base: ["version", "minor"],  label: "version minor", hint: "Bump minor version" },
  { id: "pkg:version:major", tool: "pkg", base: ["version", "major"],  label: "version major", hint: "Bump major version" },
  { id: "pkg:login",         tool: "pkg", base: ["login"],             label: "login",         hint: "Log in to registry" },
  { id: "pkg:logout",        tool: "pkg", base: ["logout"],            label: "logout",        hint: "Log out from registry" },

  // Dependency Management
  { id: "pkg:install",  tool: "pkg", base: ["install"],   label: "install",  hint: "Install all dependencies" },
  { id: "pkg:add",      tool: "pkg", base: ["add"],       label: "add",      hint: "Add a dependency" },
  { id: "pkg:remove",   tool: "pkg", base: ["remove"],    label: "remove",   hint: "Remove a dependency" },
  { id: "pkg:update",   tool: "pkg", base: ["update"],    label: "update",   hint: "Update dependencies" },
  { id: "pkg:outdated", tool: "pkg", base: ["outdated"],  label: "outdated", hint: "List outdated packages" },
  { id: "pkg:audit",    tool: "pkg", base: ["audit"],     label: "audit",    hint: "Run security audit" },
  { id: "pkg:ls",       tool: "pkg", base: ["ls"],        label: "ls",       hint: "List installed packages" },

  // Registry & Config
  { id: "pkg:config:list", tool: "pkg", base: ["config", "list"], label: "config list", hint: "Show config" },
  { id: "pkg:whoami",      tool: "pkg", base: ["whoami"],         label: "whoami",      hint: "Show logged-in user" },

  // Scripts & Info
  { id: "pkg:run",    tool: "pkg", base: ["run"],    label: "run",    hint: "Run a package script" },
  { id: "pkg:info",   tool: "pkg", base: ["info"],   label: "info",   hint: "Show package info" },
  { id: "pkg:search", tool: "pkg", base: ["search"], label: "search", hint: "Search packages in registry" },
  { id: "pkg:init",   tool: "pkg", base: ["init"],   label: "init",   hint: "Initialize a new package.json" },
];
