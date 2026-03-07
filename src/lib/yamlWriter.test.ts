import { describe, it, expect } from "vitest";
import { generatePolterYaml } from "./yamlWriter.js";
import type { PolterYaml } from "../declarative/schema.js";

describe("generatePolterYaml", () => {
  it("generates minimal yaml with just version", () => {
    const yaml: PolterYaml = { version: 1 };
    const output = generatePolterYaml(yaml);
    expect(output).toContain("version: 1");
  });

  it("generates yaml with all sections", () => {
    const yaml: PolterYaml = {
      version: 1,
      project: { name: "my-app" },
      supabase: {
        project_ref: "abc123",
        region: "us-east-1",
        functions: [
          { name: "hello", verify_jwt: false },
          { name: "world" },
        ],
        secrets: ["MY_SECRET"],
      },
      vercel: {
        project_id: "prj_xxx",
        framework: "nextjs",
        domains: ["example.com"],
      },
      github: {
        repo: "org/repo",
        secrets: ["GH_TOKEN"],
      },
      pkg: { manager: "pnpm" },
      pipelines: {
        deploy: {
          description: "Full deploy",
          steps: ["build", "test", "deploy"],
        },
      },
    };

    const output = generatePolterYaml(yaml);

    expect(output).toContain("version: 1");
    expect(output).toContain("project:");
    expect(output).toContain("  name: my-app");
    expect(output).toContain("supabase:");
    expect(output).toContain("  project_ref: abc123");
    expect(output).toContain("    - name: hello");
    expect(output).toContain("      verify_jwt: false");
    expect(output).toContain("    - name: world");
    expect(output).toContain("vercel:");
    expect(output).toContain("  domains:");
    expect(output).toContain("    - example.com");
    expect(output).toContain("github:");
    expect(output).toContain("  repo: org/repo");
    expect(output).toContain("pkg:");
    expect(output).toContain("  manager: pnpm");
    expect(output).toContain("pipelines:");
    expect(output).toContain("  deploy:");
    expect(output).toContain("    steps:");
  });

  it("handles empty supabase functions array", () => {
    const yaml: PolterYaml = {
      version: 1,
      supabase: { functions: [] },
    };
    const output = generatePolterYaml(yaml);
    expect(output).toContain("supabase:");
    expect(output).not.toContain("functions:");
  });

  it("quotes values with special characters", () => {
    const yaml: PolterYaml = {
      version: 1,
      project: { name: "my app: special" },
    };
    const output = generatePolterYaml(yaml);
    expect(output).toContain('"my app: special"');
  });
});
