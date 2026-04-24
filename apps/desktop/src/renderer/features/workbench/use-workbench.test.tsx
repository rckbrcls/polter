import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../App.js";

vi.mock("../processes/process-views.js", () => ({
  ProcessesView: () => <div>Processes workspace</div>,
}));

describe("UI-only workbench bootstrap", () => {
  it("renders the desktop shell without a window.polter bridge", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("Pipelines");
    expect(markup).toContain("Processes workspace");
    expect(markup).not.toContain("Pipeline builder");
  });
});
