import { useEffect, type JSX, type ReactNode } from "react";
import type { DesktopRepository } from "../workbench/types.js";
import { ChevronUpIcon, SearchIcon, Settings2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  getViewIcon,
  systemSidebarItems,
  type HeaderRouteItem,
  type SidebarViewId,
} from "../navigation/navigation.js";
import { RepositorySidebar } from "../repositories/repository-sidebar.js";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable ||
    Boolean(target.closest("[contenteditable='true']"))
  );
}

export function DesktopShell({
  activeRepositoryPath,
  children,
  getSidebarBadge,
  headerItems,
  onAddRepository,
  onOpenCommander,
  onRemoveRepository,
  onSelectRepository,
  onSelectView,
  repositories,
  selectedView,
  systemViewSelected,
}: {
  activeRepositoryPath: string;
  children: ReactNode;
  getSidebarBadge: (viewId: SidebarViewId) => string | undefined;
  headerItems: HeaderRouteItem[];
  onAddRepository: () => void;
  onOpenCommander: () => void;
  onRemoveRepository: (repository: DesktopRepository) => void;
  onSelectRepository: (repository: DesktopRepository) => void;
  onSelectView: (viewId: SidebarViewId) => void;
  repositories: DesktopRepository[];
  selectedView: SidebarViewId;
  systemViewSelected: boolean;
}): JSX.Element {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
        return;
      }

      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenCommander();
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      const shortcut = Number(event.key);
      if (!Number.isInteger(shortcut)) {
        return;
      }

      const item = headerItems.find((route) => route.shortcut === shortcut);
      if (!item) {
        return;
      }

      event.preventDefault();
      onSelectView(item.id);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [headerItems, onOpenCommander, onSelectView]);

  return (
    <div className="app-shell-surface">
      <SidebarProvider defaultOpen className="app-shell-provider">
        <div className="app-window-sidebar-trigger px-3">
          <div className="app-window-traffic-spacer" aria-hidden="true" />
          <SidebarTrigger className="size-8 shrink-0" />
        </div>

        <div className="app-shell-body">
          <Sidebar collapsible="offcanvas" variant="sidebar" className="app-shell-sidebar">
            <SidebarContent className="app-shell-sidebar-content">
              <RepositorySidebar
                activeRepositoryPath={activeRepositoryPath}
                onAddRepository={onAddRepository}
                onRemoveRepository={onRemoveRepository}
                onSelectRepository={onSelectRepository}
                repositories={repositories}
              />
            </SidebarContent>

            <SidebarFooter className="p-2">
              <HoverCard openDelay={80} closeDelay={120}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-medium text-sidebar-foreground outline-hidden transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2!",
                      systemViewSelected && "bg-sidebar-accent text-sidebar-accent-foreground",
                    )}
                  >
                    <Settings2Icon className="size-4 shrink-0" />
                    <span className="truncate group-data-[collapsible=icon]:hidden">System</span>
                    <ChevronUpIcon className="ml-auto size-4 shrink-0 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent
                  side="top"
                  align="start"
                  sideOffset={8}
                  className="app-system-menu w-64 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-none ring-0"
                >
                  <div className="grid gap-1">
                    {systemSidebarItems.map((item) => {
                      const Icon = getViewIcon(item.id);
                      const badge = getSidebarBadge(item.id);
                      const active = selectedView === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={cn(
                            "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
                            active && "bg-accent font-medium text-accent-foreground",
                          )}
                          onClick={() => onSelectView(item.id)}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                          {badge ? (
                            <Badge variant="outline" className="ml-auto h-5 min-w-5 px-1 text-xs">
                              {badge}
                            </Badge>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </HoverCardContent>
              </HoverCard>
            </SidebarFooter>

            <SidebarRail />
          </Sidebar>

          <SidebarInset className="app-shell-main">
            <div className="app-shell-content-header border-b border-border bg-background px-4 md:px-6">
              <div className="app-shell-content-header-actions flex min-w-0 items-center justify-end gap-2">
                <nav
                  aria-label="Workflow routes"
                  className="no-scrollbar flex min-w-0 shrink items-center gap-1 overflow-x-auto"
                >
                  {headerItems.map((item) => {
                    const Icon = getViewIcon(item.id);
                    const active = selectedView === item.id;

                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={item.label}
                            className={cn(
                              "app-header-nav-button flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
                              active && "bg-accent text-accent-foreground",
                            )}
                            onClick={() => onSelectView(item.id)}
                          >
                            <Icon className="size-3.5 shrink-0" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={8}>
                          <span>{item.label}</span>
                          <span className="text-background/70">⌘ {item.shortcut}</span>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </nav>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Commander"
                      className="app-header-nav-button flex size-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/20 text-muted-foreground outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={onOpenCommander}
                    >
                      <SearchIcon className="size-3.5 shrink-0" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8}>
                    <span>Commander</span>
                    <span className="text-background/70">⌘ K</span>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="app-shell-content flex-1 px-4 py-6 md:px-6">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
