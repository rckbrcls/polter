export const IPC_CHANNELS = {
  app: {
    getInfo: "app:get-info",
  },
  commands: {
    listFeatures: "commands:list-features",
    listAll: "commands:list-all",
    getForm: "commands:get-form",
    getPins: "commands:get-pins",
    toggleCommandPin: "commands:toggle-command-pin",
    toggleRunPin: "commands:toggle-run-pin",
    run: "commands:run",
  },
  repositories: {
    list: "repositories:list",
    add: "repositories:add",
    remove: "repositories:remove",
    pickDirectory: "repositories:pick-directory",
  },
  pipelines: {
    list: "pipelines:list",
    save: "pipelines:save",
    delete: "pipelines:delete",
    run: "pipelines:run",
  },
  processes: {
    list: "processes:list",
    start: "processes:start",
    stop: "processes:stop",
    logs: "processes:logs",
    remove: "processes:remove",
  },
  status: {
    tools: "status:tools",
  },
  config: {
    read: "config:read",
    write: "config:write",
  },
  declarative: {
    status: "declarative:status",
    plan: "declarative:plan",
    apply: "declarative:apply",
  },
  workspace: {
    snapshot: "workspace:snapshot",
    runScript: "workspace:run-script",
  },
  mcp: {
    status: "mcp:status",
    install: "mcp:install",
    remove: "mcp:remove",
  },
  skills: {
    preview: "skills:preview",
    setup: "skills:setup",
  },
} as const;

export type IpcChannelTree = typeof IPC_CHANNELS;
