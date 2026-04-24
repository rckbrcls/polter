import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "../../App.js";

describe("UI-only workbench bootstrap", () => {
  it("renders the desktop shell without a window.polter bridge", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("Pipelines");
    expect(markup).toContain("Pipeline builder");
  });
});
