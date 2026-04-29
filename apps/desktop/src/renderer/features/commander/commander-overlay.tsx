import { useEffect, useState, type JSX } from "react";
import { CommanderPanel } from "./commander-dialog.js";
import { useWorkbench } from "../workbench/use-workbench.js";

function focusCommanderSearchInput(): void {
  window.requestAnimationFrame(() => {
    document.getElementById("commander-search-input")?.focus();
  });
}

export function CommanderOverlayApp(): JSX.Element | null {
  const workbench = useWorkbench();
  const [open, setOpen] = useState(true);

  function requestHide(): void {
    setOpen(false);
    void window.polter?.commander.hideOverlay();
  }

  function requestMainWindow(): void {
    void window.polter?.commander.showMainWindow();
  }

  useEffect(() => {
    document.documentElement.dataset["surface"] = "commander";

    return () => {
      delete document.documentElement.dataset["surface"];
    };
  }, []);

  useEffect(() => {
    const unsubscribe = window.polter?.commander.onFocusSearch(() => {
      setOpen(false);
      window.requestAnimationFrame(() => {
        setOpen(true);
        focusCommanderSearchInput();
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const handleBlur = () => requestHide();
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestHide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div className="commander-overlay-root">
      <div className="w-full overflow-hidden rounded-4xl border border-border bg-popover text-popover-foreground">
        <CommanderPanel
          open={open}
          onOpenChange={(nextOpen) => {
            if (nextOpen) {
              setOpen(true);
              return;
            }

            requestHide();
          }}
          onRequestMainWindow={requestMainWindow}
          workbench={workbench}
        />
      </div>
    </div>
  );
}
