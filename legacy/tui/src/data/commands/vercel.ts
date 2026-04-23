import type { CommandDef } from "../types.js";

export const vercelCommands: CommandDef[] = [
  // Deploy
  {
    id: "vercel:deploy",
    tool: "vercel",
    base: ["deploy"],
    label: "deploy",
    hint: "Deploy to Vercel",
  },
  {
    id: "vercel:deploy:prod",
    tool: "vercel",
    base: ["deploy", "--prod"],
    label: "deploy --prod",
    hint: "Deploy to production",
  },
  {
    id: "vercel:promote",
    tool: "vercel",
    base: ["promote"],
    label: "promote",
    hint: "Promote a deployment",
  },
  {
    id: "vercel:rollback",
    tool: "vercel",
    base: ["rollback"],
    label: "rollback",
    hint: "Rollback to previous deployment",
  },

  // Domains
  {
    id: "vercel:domains:list",
    tool: "vercel",
    base: ["domains", "ls"],
    label: "domains ls",
    hint: "List domains",
  },
  {
    id: "vercel:domains:add",
    tool: "vercel",
    base: ["domains", "add"],
    label: "domains add",
    hint: "Add a domain",
  },
  {
    id: "vercel:domains:rm",
    tool: "vercel",
    base: ["domains", "rm"],
    label: "domains rm",
    hint: "Remove a domain",
  },

  // Environment Variables
  {
    id: "vercel:env:ls",
    tool: "vercel",
    base: ["env", "ls"],
    label: "env ls",
    hint: "List environment variables",
  },
  {
    id: "vercel:env:add",
    tool: "vercel",
    base: ["env", "add"],
    label: "env add",
    hint: "Add an environment variable",
  },
  {
    id: "vercel:env:rm",
    tool: "vercel",
    base: ["env", "rm"],
    label: "env rm",
    hint: "Remove an environment variable",
  },
  {
    id: "vercel:env:pull",
    tool: "vercel",
    base: ["env", "pull"],
    label: "env pull",
    hint: "Pull env vars to .env file",
  },

  // Project
  {
    id: "vercel:project:ls",
    tool: "vercel",
    base: ["project", "ls"],
    label: "project ls",
    hint: "List projects",
  },
  {
    id: "vercel:project:add",
    tool: "vercel",
    base: ["project", "add"],
    label: "project add",
    hint: "Add a project",
  },
  {
    id: "vercel:project:rm",
    tool: "vercel",
    base: ["project", "rm"],
    label: "project rm",
    hint: "Remove a project",
  },

  // Setup
  {
    id: "vercel:link",
    tool: "vercel",
    base: ["link"],
    label: "link",
    hint: "Link to a Vercel project",
    interactive: true,
  },
  {
    id: "vercel:login",
    tool: "vercel",
    base: ["login"],
    label: "login",
    hint: "Log in to Vercel",
    interactive: true,
  },
  {
    id: "vercel:whoami",
    tool: "vercel",
    base: ["whoami"],
    label: "whoami",
    hint: "Show current user",
  },

  // Logs & Inspect
  {
    id: "vercel:logs",
    tool: "vercel",
    base: ["logs"],
    label: "logs",
    hint: "View deployment logs",
  },
  {
    id: "vercel:inspect",
    tool: "vercel",
    base: ["inspect"],
    label: "inspect",
    hint: "Inspect a deployment",
  },
  {
    id: "vercel:ls",
    tool: "vercel",
    base: ["ls"],
    label: "ls",
    hint: "List deployments",
  },
];
