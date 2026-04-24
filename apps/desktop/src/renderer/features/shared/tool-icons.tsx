import type { ComponentType, JSX } from "react";
import {
  SiGit,
  SiGithub,
  SiNpm,
  SiSupabase,
  SiVercel,
} from "@icons-pack/react-simple-icons";
import type { CliToolId } from "../workbench/types.js";
import { PackageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<{
  className?: string;
  color?: string;
  size?: string | number;
}>;

const toolIcons: Partial<Record<CliToolId, IconComponent>> = {
  gh: SiGithub,
  git: SiGit,
  pkg: SiNpm,
  supabase: SiSupabase,
  vercel: SiVercel,
};

export function getToolIcon(tool: CliToolId | string | undefined): IconComponent {
  if (!tool) {
    return PackageIcon;
  }

  return toolIcons[tool as CliToolId] ?? PackageIcon;
}

export function ToolIcon({
  className,
  tool,
}: {
  className?: string;
  tool: CliToolId | string | undefined;
}): JSX.Element {
  const Icon = getToolIcon(tool);

  return (
    <Icon
      aria-hidden="true"
      className={cn("size-4 shrink-0", className)}
      color="currentColor"
    />
  );
}
