import { z } from "zod";

export const PolterYamlSchema = z.object({
  version: z.literal(1),
  project: z.object({
    name: z.string(),
  }).optional(),
  supabase: z.object({
    project_ref: z.string().optional(),
    region: z.string().optional(),
    database: z.object({
      migrations_dir: z.string().optional(),
    }).optional(),
    functions: z.array(z.object({
      name: z.string(),
      verify_jwt: z.boolean().optional(),
    })).optional(),
    secrets: z.array(z.string()).optional(),
  }).optional(),
  vercel: z.object({
    project_id: z.string().optional(),
    framework: z.string().optional(),
    domains: z.array(z.string()).optional(),
    env: z.record(z.string(), z.record(z.string(), z.string())).optional(),
  }).optional(),
  github: z.object({
    repo: z.string().optional(),
    branch_protection: z.record(z.string(), z.object({
      required_reviews: z.number().optional(),
      require_status_checks: z.boolean().optional(),
    })).optional(),
    secrets: z.array(z.string()).optional(),
  }).optional(),
  pkg: z.object({
    manager: z.enum(["npm", "pnpm", "yarn", "bun"]).optional(),
  }).optional(),
  pipelines: z.record(z.string(), z.object({
    description: z.string().optional(),
    steps: z.array(z.string()),
  })).optional(),
});

export type PolterYaml = z.infer<typeof PolterYamlSchema>;

export interface PlanAction {
  tool: "supabase" | "vercel" | "gh" | "pkg";
  action: "create" | "update" | "delete";
  resource: string;
  description: string;
  args: string[];
}

export interface PlanResult {
  actions: PlanAction[];
  noChanges: boolean;
}

export interface StatusResult {
  supabase?: {
    linked: boolean;
    projectRef?: string;
    functions?: string[];
  };
  vercel?: {
    linked: boolean;
    projectId?: string;
  };
  github?: {
    repo?: string;
    authenticated: boolean;
  };
}
