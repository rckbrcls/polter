import { useMemo, useState, type CSSProperties, type JSX } from "react";
import type { DesktopRepository } from "../workbench/types.js";
import type { LucideIcon } from "lucide-react";
import {
  BracesIcon,
  FolderIcon,
  FolderPlusIcon,
  SearchIcon,
  SquareTerminalIcon,
  WorkflowIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const REPOSITORY_APPEARANCE_STORAGE_KEY = "polter.repositoryAppearance.v1";

const REPOSITORY_ICON_OPTIONS = [
  { key: "folder", label: "Folder", Icon: FolderIcon },
  { key: "workflow", label: "Workflow", Icon: WorkflowIcon },
  { key: "terminal", label: "Terminal", Icon: SquareTerminalIcon },
  { key: "code", label: "Code", Icon: BracesIcon },
] as const satisfies readonly { key: string; label: string; Icon: LucideIcon }[];

const REPOSITORY_COLOR_OPTIONS = [
  { key: "default", label: "Default", value: undefined },
  { key: "muted", label: "Muted", value: "var(--muted-foreground)" },
  { key: "primary", label: "Primary", value: "var(--primary)" },
  { key: "accent", label: "Accent", value: "var(--accent-foreground)" },
  { key: "danger", label: "Danger", value: "var(--destructive)" },
] as const satisfies readonly { key: string; label: string; value: string | undefined }[];

type RepositoryIconKey = (typeof REPOSITORY_ICON_OPTIONS)[number]["key"];
type RepositoryColorKey = (typeof REPOSITORY_COLOR_OPTIONS)[number]["key"];

interface RepositoryAppearance {
  displayName: string;
  icon: RepositoryIconKey;
  color: RepositoryColorKey;
}

type RepositoryAppearanceMap = Record<string, RepositoryAppearance>;

const DEFAULT_REPOSITORY_APPEARANCE: RepositoryAppearance = {
  displayName: "",
  icon: "folder",
  color: "default",
};

const REPOSITORY_ICON_KEYS = new Set<RepositoryIconKey>(
  REPOSITORY_ICON_OPTIONS.map((option) => option.key),
);
const REPOSITORY_COLOR_KEYS = new Set<RepositoryColorKey>(
  REPOSITORY_COLOR_OPTIONS.map((option) => option.key),
);

function getCompactPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 2) {
    return path;
  }
  return parts.slice(-2).join("/");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeRepositoryAppearance(value: unknown): RepositoryAppearance | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    displayName: typeof value.displayName === "string" ? value.displayName.slice(0, 80) : "",
    icon: REPOSITORY_ICON_KEYS.has(value.icon as RepositoryIconKey)
      ? (value.icon as RepositoryIconKey)
      : DEFAULT_REPOSITORY_APPEARANCE.icon,
    color: REPOSITORY_COLOR_KEYS.has(value.color as RepositoryColorKey)
      ? (value.color as RepositoryColorKey)
      : DEFAULT_REPOSITORY_APPEARANCE.color,
  };
}

function readRepositoryAppearanceMap(): RepositoryAppearanceMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(REPOSITORY_APPEARANCE_STORAGE_KEY);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as unknown;
    if (!isRecord(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([repositoryId, value]) => {
          const appearance = normalizeRepositoryAppearance(value);
          return appearance ? [repositoryId, appearance] : null;
        })
        .filter((entry): entry is [string, RepositoryAppearance] => Boolean(entry)),
    );
  } catch {
    return {};
  }
}

function saveRepositoryAppearanceMap(appearanceMap: RepositoryAppearanceMap): void {
  window.localStorage.setItem(
    REPOSITORY_APPEARANCE_STORAGE_KEY,
    JSON.stringify(appearanceMap),
  );
}

function getRepositoryIcon(icon: RepositoryIconKey): LucideIcon {
  return REPOSITORY_ICON_OPTIONS.find((option) => option.key === icon)?.Icon ?? FolderIcon;
}

function getRepositoryIconStyle(color: RepositoryColorKey): CSSProperties | undefined {
  const value = REPOSITORY_COLOR_OPTIONS.find((option) => option.key === color)?.value;
  return value ? { color: value } : undefined;
}

function hasDefaultRepositoryAppearance(
  repository: DesktopRepository,
  appearance: RepositoryAppearance,
): boolean {
  return (
    appearance.displayName.trim() === repository.name &&
    appearance.icon === DEFAULT_REPOSITORY_APPEARANCE.icon &&
    appearance.color === DEFAULT_REPOSITORY_APPEARANCE.color
  );
}

export function RepositorySidebar({
  activeRepositoryPath,
  onAddRepository,
  onRemoveRepository,
  onSelectRepository,
  repositories,
}: {
  activeRepositoryPath: string;
  onAddRepository: () => void;
  onRemoveRepository: (repository: DesktopRepository) => void;
  onSelectRepository: (repository: DesktopRepository) => void;
  repositories: DesktopRepository[];
}): JSX.Element {
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [appearanceMap, setAppearanceMap] = useState<RepositoryAppearanceMap>(
    readRepositoryAppearanceMap,
  );
  const [editingRepository, setEditingRepository] = useState<DesktopRepository | null>(null);
  const [appearanceDraft, setAppearanceDraft] = useState<RepositoryAppearance>(
    DEFAULT_REPOSITORY_APPEARANCE,
  );
  const visibleRepositories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return repositories;
    }

    return repositories.filter(
      (repository) =>
        repository.name.toLowerCase().includes(normalizedQuery) ||
        repository.path.toLowerCase().includes(normalizedQuery),
    );
  }, [query, repositories]);

  function getRepositoryAppearance(repository: DesktopRepository): RepositoryAppearance {
    return appearanceMap[repository.id] ?? DEFAULT_REPOSITORY_APPEARANCE;
  }

  function openRepositoryEditor(repository: DesktopRepository): void {
    const currentAppearance = getRepositoryAppearance(repository);
    setEditingRepository(repository);
    setAppearanceDraft({
      ...currentAppearance,
      displayName: currentAppearance.displayName || repository.name,
    });
  }

  function saveRepositoryAppearance(): void {
    if (!editingRepository) {
      return;
    }

    const normalizedAppearance: RepositoryAppearance = {
      ...appearanceDraft,
      displayName: appearanceDraft.displayName.trim() || editingRepository.name,
    };

    setAppearanceMap((current) => {
      const next = { ...current };
      if (hasDefaultRepositoryAppearance(editingRepository, normalizedAppearance)) {
        delete next[editingRepository.id];
      } else {
        next[editingRepository.id] = normalizedAppearance;
      }
      saveRepositoryAppearanceMap(next);
      return next;
    });
    setEditingRepository(null);
  }

  function resetRepositoryAppearance(): void {
    if (!editingRepository) {
      return;
    }

    setAppearanceMap((current) => {
      const next = { ...current };
      delete next[editingRepository.id];
      saveRepositoryAppearanceMap(next);
      return next;
    });
    setEditingRepository(null);
  }

  return (
    <>
      <SidebarGroup className="app-projects-sidebar gap-2">
        <div className="flex h-9 items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <SidebarGroupLabel className="h-auto flex-1 px-1 text-sm font-semibold text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            Projects
          </SidebarGroupLabel>
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-pressed={filterOpen}
              title="Filter projects"
              onClick={() => setFilterOpen((open) => !open)}
            >
              <SearchIcon className="size-3.5" />
              <span className="sr-only">Filter projects</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              title="Add repository"
              onClick={onAddRepository}
            >
              <FolderPlusIcon className="size-3.5" />
              <span className="sr-only">Add repository</span>
            </Button>
          </div>
        </div>

        {filterOpen ? (
          <div className="px-2 group-data-[collapsible=icon]:hidden">
            <Input
              aria-label="Filter projects"
              className="h-8"
              placeholder="Filter projects"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        ) : null}

        <SidebarGroupContent>
          <SidebarMenu>
            {visibleRepositories.map((repository) => {
              const active = repository.path === activeRepositoryPath;
              const removable = repository.id !== "current-workspace";
              const appearance = getRepositoryAppearance(repository);
              const RepositoryIcon = getRepositoryIcon(appearance.icon);
              const displayName = appearance.displayName || repository.name;

              return (
                <SidebarMenuItem key={repository.id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={displayName}
                        className={cn(
                          "h-auto min-h-10 items-start py-2",
                          !repository.exists && "opacity-60",
                        )}
                        onClick={() => onSelectRepository(repository)}
                      >
                        <RepositoryIcon
                          className="mt-0.5 size-4 shrink-0"
                          style={getRepositoryIconStyle(appearance.color)}
                        />
                        <span className="grid min-w-0 gap-0.5 group-data-[collapsible=icon]:hidden">
                          <span className="truncate">{displayName}</span>
                          <span className="truncate text-xs font-normal text-sidebar-foreground/55">
                            {getCompactPath(repository.path)}
                          </span>
                        </span>
                      </SidebarMenuButton>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="app-system-menu w-56 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-none ring-0">
                      <ContextMenuLabel className="truncate">{displayName}</ContextMenuLabel>
                      <ContextMenuSeparator />
                      <ContextMenuItem onSelect={() => openRepositoryEditor(repository)}>
                        Edit appearance
                      </ContextMenuItem>
                      <ContextMenuItem
                        disabled={!removable}
                        variant="destructive"
                        onSelect={() => onRemoveRepository(repository)}
                      >
                        Remove from Projects
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                  {!repository.exists ? <SidebarMenuBadge>Missing</SidebarMenuBadge> : null}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <Dialog
        open={Boolean(editingRepository)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRepository(null);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-4xl">
          <form
            className="grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveRepositoryAppearance();
            }}
          >
            <DialogHeader>
              <DialogTitle>Project appearance</DialogTitle>
              <DialogDescription>
                Customize how this project appears in the local desktop sidebar.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="repository-display-name">Display name</Label>
                <Input
                  id="repository-display-name"
                  value={appearanceDraft.displayName}
                  onChange={(event) =>
                    setAppearanceDraft((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="repository-icon">Icon</Label>
                <Select
                  value={appearanceDraft.icon}
                  onValueChange={(icon) =>
                    setAppearanceDraft((current) => ({
                      ...current,
                      icon: icon as RepositoryIconKey,
                    }))
                  }
                >
                  <SelectTrigger id="repository-icon" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPOSITORY_ICON_OPTIONS.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        <option.Icon className="size-4" />
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Icon color</Label>
                <div className="flex flex-wrap gap-2">
                  {REPOSITORY_COLOR_OPTIONS.map((option) => {
                    const selected = appearanceDraft.color === option.key;
                    const swatchColor = option.value ?? "currentColor";

                    return (
                      <button
                        key={option.key}
                        type="button"
                        aria-label={option.label}
                        aria-pressed={selected}
                        title={option.label}
                        className={cn(
                          "flex size-8 items-center justify-center rounded-2xl border border-border bg-background text-sidebar-foreground outline-hidden transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                          selected && "border-foreground bg-muted",
                        )}
                        onClick={() =>
                          setAppearanceDraft((current) => ({
                            ...current,
                            color: option.key,
                          }))
                        }
                      >
                        <span
                          className="size-3 rounded-full"
                          style={{ backgroundColor: swatchColor }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="justify-between sm:justify-between">
              <Button type="button" variant="ghost" onClick={resetRepositoryAppearance}>
                Reset
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingRepository(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
