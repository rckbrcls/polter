import React from "react";
import { Text } from "ink";
import type { CliToolId } from "../data/types.js";
import type { PkgManagerId } from "../lib/pkgManager.js";
import { getToolDisplayName } from "../lib/toolResolver.js";

const toolColors: Record<CliToolId, string> = {
  supabase: "#3ECF8E",
  gh: "#58A6FF",
  vercel: "#FFFFFF",
  git: "#F05032",
  pkg: "#CB3837",
};

const pkgManagerColors: Record<PkgManagerId, string> = {
  npm: "#CB3837",
  pnpm: "#F69220",
  yarn: "#2C8EBB",
  bun: "#FBF0DF",
};

const toolLabels: Record<CliToolId, string> = {
  supabase: "supabase",
  gh: "github",
  vercel: "vercel",
  git: "git",
  pkg: "pkg",
};

function resolveToolColor(tool: CliToolId): string {
  if (tool === "pkg") {
    const name = getToolDisplayName(tool) as PkgManagerId;
    return pkgManagerColors[name] ?? toolColors.pkg;
  }
  return toolColors[tool];
}

function resolveToolLabel(tool: CliToolId): string {
  if (tool === "pkg") {
    return getToolDisplayName(tool);
  }
  return toolLabels[tool];
}

interface ToolBadgeProps {
  tool: CliToolId;
}

export function ToolBadge({ tool }: ToolBadgeProps): React.ReactElement {
  return (
    <Text color={resolveToolColor(tool)} dimColor>
      {resolveToolLabel(tool)}
    </Text>
  );
}

export { toolColors, toolLabels, pkgManagerColors, resolveToolColor, resolveToolLabel };
