export interface PolterYaml {
  version: 1;

  project?: {
    name: string;
  };

  supabase?: {
    project_ref?: string;
    region?: string;
    database?: {
      migrations_dir?: string;
    };
    functions?: Array<{
      name: string;
      verify_jwt?: boolean;
    }>;
    secrets?: string[];
  };

  vercel?: {
    project_id?: string;
    framework?: string;
    domains?: string[];
    env?: Record<string, Record<string, string>>;
  };

  github?: {
    repo?: string;
    branch_protection?: Record<
      string,
      {
        required_reviews?: number;
        require_status_checks?: boolean;
      }
    >;
    secrets?: string[];
  };

  pkg?: {
    manager?: "npm" | "pnpm" | "yarn" | "bun";
  };

  pipelines?: Record<
    string,
    {
      description?: string;
      steps: string[];
    }
  >;
}

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
