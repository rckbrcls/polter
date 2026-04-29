import type { JSX } from "react";
import { App } from "./App.js";
import { CommanderOverlayApp } from "./features/commander/commander-overlay.js";

export type RendererSurface = "app" | "commander";

export function resolveRendererSurface(search = window.location.search): RendererSurface {
  const params = new URLSearchParams(search);
  return params.get("surface") === "commander" ? "commander" : "app";
}

export function Root({ surface = resolveRendererSurface() }: { surface?: RendererSurface }): JSX.Element {
  if (surface === "commander") {
    return <CommanderOverlayApp />;
  }

  return <App />;
}
