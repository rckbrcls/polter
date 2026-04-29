import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Root, resolveRendererSurface } from "./root.js";

vi.mock("./features/processes/process-views.js", () => ({
  ProcessesView: () => <div>Processes workspace</div>,
}));

describe("renderer root surfaces", () => {
  it("uses the desktop app surface by default", () => {
    expect(resolveRendererSurface("")).toBe("app");
    expect(resolveRendererSurface("?surface=unknown")).toBe("app");
  });

  it("uses the Commander overlay surface when requested", () => {
    expect(resolveRendererSurface("?surface=commander")).toBe("commander");
  });

  it("renders the normal app shell without the live desktop bridge", () => {
    const markup = renderToStaticMarkup(<Root surface="app" />);

    expect(markup).toContain("Pipelines");
    expect(markup).toContain("Processes workspace");
    expect(markup).not.toContain("commander-overlay-root");
  });

  it("renders only the Commander overlay surface for the global hotkey window", () => {
    const markup = renderToStaticMarkup(<Root surface="commander" />);

    expect(markup).toContain("commander-overlay-root");
    expect(markup).toContain("Search for apps and commands...");
    expect(markup).not.toContain("Processes workspace");
  });
});
