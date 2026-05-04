# Polter Library Candidates

This document catalogs installed dependencies and future library candidates for Polter. It does not install anything and should not be read as technical lock-in.

The decision principle:

```text
Add libraries only when they strengthen Process, Terminal UX, Command Registry, Machine Gateway, Security, Logs, or Audit.
```

Polter should own the product model. Libraries should provide focused leverage.

## Current Baseline

The current workspace already has a modern baseline:

- `apps/desktop`: Electron, React, Vite, shadcn/Radix-style UI, Commander, renderer UI.
- `packages/core`: non-visual logic for commands, pipelines, processes, config, MCP, skills, IPC, and desktop services.
- `docs/polter-product-architecture.md`: product mission and future architecture direction.
- `docs/polter-interface-ux.md`: interface direction for Desktop, CLI, and MCP.

This document separates:

- **Installed**: already present in the repo.
- **Candidate**: not installed.
- **Recommended later**: useful when the product reaches the matching runtime phase.
- **Avoid for now**: likely to add complexity before it adds real leverage.

## Dependency Decision Rules

Before adding a package, answer:

- Does it help the `Machine -> Command -> Stage -> Approval -> Execution -> Logs -> Audit` chain?
- Does it belong in `packages/core`, `apps/desktop`, or a future gateway/node package?
- Does it run well across macOS, Windows, and Linux?
- Does it require native binaries, special permissions, or packaging care?
- Does it improve security, auditability, reliability, or UX?
- Does it replace an existing capability or fill a real gap?

If the answer is only "it looks modern", do not add it.

## Installed: Core And Platform

| Package | Layer | What it covers | Keep using |
| --- | --- | --- | --- |
| `@modelcontextprotocol/sdk` | MCP | Base for future Polter MCP tools and current MCP setup helpers. | Yes. |
| `conf` | Config | Small local/global settings such as global pipelines and desktop repositories. | Yes, but not for large durable indexes. |
| `eventemitter3` | Events | Lightweight internal event emitter. | Yes. |
| `execa` | Process | Non-interactive command execution with stdout/stderr capture. | Yes. |
| `p-limit` | Concurrency | Simple concurrency limiting. | Yes. |
| `p-retry` | Reliability | Controlled retries for transient operations. | Yes. |
| `semver` | Versioning | Version comparisons. | Yes. |
| `signal-exit` | Process lifecycle | Cleanup when host process exits. | Yes. |
| `which` | Command discovery | Resolve executables on `PATH`. | Yes. |
| `zod` | Contracts | Runtime validation and typed schemas. | Yes. |
| `ms` | Utilities | Duration parsing/formatting. | Yes. |
| `picocolors` | CLI output | Terminal colors outside renderer UI. | Yes. |

## Installed: Desktop And UI

| Package | Layer | What it covers | Keep using |
| --- | --- | --- | --- |
| `electron` | Desktop runtime | Main desktop application runtime. | Yes. |
| `electron-vite` | Desktop build workflow | Main, preload, and renderer build workflow. | Yes. |
| `electron-builder` | Packaging | Local unsigned desktop packaging. | Yes. |
| `electron-log` | Desktop logging | Main-process logging. | Yes. |
| `@electron-toolkit/utils` | Electron utilities | Electron helper utilities. | Yes. |
| `@orama/orama` | Search UX | In-memory Commander search. | Yes. |
| `@tanstack/react-query` | Async state | Future async state/cache when real IPC returns. | Keep if used deliberately. |
| `zustand` | UI state | Local UI state support. | Keep if used deliberately. |
| `cmdk` | Commander | Command palette primitives. | Yes. |
| `motion` | Motion | React animations. | Yes, aligned with `DESIGN.md`. |
| `sonner` | Feedback | Toast notifications. | Yes. |
| `radix-ui` | UI primitives | Accessible primitives. | Yes, with product-specific styling. |
| `shadcn` | UI workflow | Component scaffolding and design-system workflow. | Yes. |
| `lucide-react` | Icons | Iconography. | Yes. |
| `react-resizable-panels` | Layout | Split-pane layouts. | Yes. |
| `@dnd-kit/core`, `@dnd-kit/sortable` | Interaction | Drag and drop for builders or ordered lists. | Yes when useful. |
| `@icons-pack/react-simple-icons` | Icons | Tool/service logos. | Use sparingly. |
| `@base-ui/react` | UI primitives | Lower-level UI primitives. | Keep only with clear use. |
| `@fontsource-variable/inter` | Typography | Local Inter Variable font. | Yes. |
| `date-fns` | Dates | Date formatting. | Yes. |
| `next-themes` | Theme | Theme switching support. | Keep if integrated cleanly. |
| `tailwindcss`, `@tailwindcss/vite` | Styling | Utility CSS and Vite integration. | Yes. |
| `tailwind-merge` | Styling utilities | Class merging. | Yes. |
| `class-variance-authority` | Styling utilities | Component variants. | Yes. |
| `vitest` | Tests | Unit and component tests. | Yes. |
| `@testing-library/react` | Tests | React test rendering helpers. | Yes. |
| `jsdom` | Tests | DOM environment for tests. | Yes. |

## Candidate: Process And Terminal

| Package | Priority | Why it helps | Risks / cost | Decision |
| --- | --- | --- | --- | --- |
| `node-pty` | Recommended when real runtime returns | Real PTY behavior for interactive commands and terminal sessions. | Native binary and cross-platform packaging complexity. | Add only when Processes moves beyond mock/execa flows. |
| `@xterm/xterm` | Recommended with PTY | Mature terminal output/input surface. | Can make the product feel like an unrestricted terminal if poorly scoped. | Use as output/session surface, not as the product model. |
| `p-queue` | Candidate | Richer queue lifecycle than `p-limit` for paused, prioritized, and observable execution. | Another queue abstraction to maintain. | Add when process scheduling needs it. |
| `pidusage` | Later | CPU/memory per process. | OS variation and polling overhead. | Add when resource UI exists. |
| `systeminformation` | Candidate | Machine inventory: OS, CPU, memory, network, processes. | Can be heavy with aggressive polling. | Add when Machine status becomes real. |

## Candidate: Ports And Dev Servers

| Package | Priority | Why it helps | Risks / cost | Decision |
| --- | --- | --- | --- | --- |
| `portless` | Experimental | Stable localhost URLs, dev-server proxy behavior, injected `PORT`, and LAN mode. | Pre-1.0 and focused on web/dev-server commands. | Use only as a Port/URL adapter. |
| `get-port` | Candidate | Simple free-port allocation. | Race conditions are still possible. | Use as a simple fallback if needed. |

### Decision On `portless`

`portless` may fit Polter, but the boundary should stay clear:

```text
Polter Process Manager = owned by Polter
Polter Port/URL Adapter = may use portless
```

Do not use `portless` as a universal process manager. Many commands do not expose ports: `git status`, `psql`, tests, migrations, `docker logs`, and one-shot scripts. Polter still needs its own process lifecycle, logs, approval, retry, and audit model.

## Candidate: Storage And Search

| Package | Priority | Why it helps | Risks / cost | Decision |
| --- | --- | --- | --- | --- |
| `better-sqlite3` | Future durable storage | Local durable storage for registry, audit, history, machines, and usage. | Native binary and Electron packaging care. | Strong candidate when durable data is approved. |
| `drizzle-orm` | With SQLite | Typed schema and predictable SQLite queries. | Requires migration discipline. | Pair with SQLite if adopted. |
| `drizzle-kit` | With Drizzle | Migration tooling. | More tooling and workflow overhead. | Add only with schema ownership. |
| SQLite FTS5 | With SQLite search | Durable text search for command registry. | Ranking and sync model needed. | Use after durable command registry exists. |

Current code does not use a database. See [Storage And Persistence](database.md).

## Candidate: Desktop UX

| Package | Priority | Why it helps | Risks / cost | Decision |
| --- | --- | --- | --- | --- |
| `@tanstack/react-table` | Candidate | Dense tables for Machines, Commands, Processes, History, and Approvals. | Headless and requires careful design. | Add when table complexity justifies it. |
| `@tanstack/virtual` | Candidate | Virtualization for logs and large lists. | Scroll synchronization complexity. | Add when large data sets exist. |
| `codemirror` | Later | Structured editor for scripts, command templates, pipelines, or policies. | Overkill before real editing workflows mature. | Add later if needed. |

## Candidate: Remote, Gateway, And Relay

| Package | Priority | Why it helps | Risks / cost | Decision |
| --- | --- | --- | --- | --- |
| `ssh2` | Future remote bootstrap | SSH bootstrap for remote machines. | Auth, host keys, and error UX must be handled carefully. | Candidate for `machine add --ssh`. |
| `ws` | Future gateway | WebSocket transport for gateway/node streams. | Requires protocol, reconnect, heartbeat, and auth design. | Candidate for first local gateway. |
| `fastify` | Candidate | Robust Node HTTP API if gateway needs one. | More structure than a small gateway may need. | Choose only if HTTP gateway becomes real. |
| `hono` | Candidate | Small portable HTTP layer. | Less opinionated for traditional Node services. | Choose instead of Fastify, not alongside it by default. |

Suggested sequence:

- `ws` first for a minimal gateway and streams.
- `fastify` if the gateway becomes a fuller Node service.
- `hono` if portability and a very small API are more important.

Do not add both Fastify and Hono without a clear reason.

## Candidate: Security And Auth

| Package | Priority | Why it helps | Risks / cost | Decision |
| --- | --- | --- | --- | --- |
| `jose` | Future auth | JWT/JWK/JWS for client, machine, or relay tokens. | Crypto still requires correct modeling. | Candidate when gateway or relay auth exists. |
| `@noble/ed25519` | Later | Machine identity signatures. | Lower-level and may duplicate token strategy early. | Consider after identity model is designed. |

## Candidate: Logs, Telemetry, And Audit

| Package | Priority | Why it helps | Risks / cost | Decision |
| --- | --- | --- | --- | --- |
| `pino` | Candidate | Structured logs for core, node, gateway, and future audit. | Requires redaction and sink policy. | Strong candidate for real runtime. |
| `@opentelemetry/api` | Later | Tracing and metrics API. | Conceptual overhead too early. | Wait for gateway/cloud. |
| `@opentelemetry/sdk-node` | Later | Node telemetry SDK. | Exporter and config complexity. | Wait for real service deployment. |

## Candidate: Schema And Testing

| Package | Priority | Why it helps | Risks / cost | Decision |
| --- | --- | --- | --- | --- |
| `zod-to-json-schema` | Candidate | Generate MCP/tool schemas from Zod contracts. | May need schema-shape tuning. | Add when MCP tools are formalized. |
| `@playwright/test` | Candidate | UI verification and screenshots. | Requires setup and careful use with no-build/no-run agent rules. | Add when automated UI verification is approved. |
| `msw` | Later | Mock HTTP/gateway/MCP APIs in renderer tests. | May be unnecessary with adapter mocks. | Add only when real HTTP/gateway surfaces exist. |

## Avoid For Now

Avoid adding these too early:

- `langchain` or `llamaindex` as core dependencies. Polter should not become the agent brain.
- Vector databases before lexical/ranked search is solid.
- Docker or Kubernetes SDKs before container/orchestrator use cases are real.
- Rust sidecar before TypeScript runtime limits are proven.
- `portless` as a required runtime foundation.
- Large cloud provider SDKs before cloud product boundaries exist.
- New chart libraries; charts are not central to the current product.

## Recommended First Runtime Wave

If the next phase moves from UI/mock to real runtime, keep the first wave small and layered:

```text
Process/Terminal:
  node-pty
  @xterm/xterm
  p-queue
  systeminformation

Storage/Search:
  better-sqlite3
  drizzle-orm
  drizzle-kit

Remote/Gateway:
  ssh2
  ws

Logs/Auth:
  pino
  jose
```

`portless` should come when the first real dev-server URL workflow exists:

```text
Command starts web process
  -> Polter assigns or receives PORT
  -> portless exposes stable localhost URL
  -> Polter links URL to process, logs, and audit
```

## Ownership By Package

Suggested future ownership:

```text
packages/core
  process manager
  command registry
  storage model
  machine model
  MCP contracts
  audit model
  SSH bootstrap primitives

apps/desktop
  terminal/log UI
  tables
  virtualization
  Commander UX
  approval surfaces

future packages/gateway or packages/node
  websocket gateway
  relay protocol
  machine auth
  structured logs
```

## Final Recommendation

The ideal stack is not "many modern libraries". The ideal stack is:

```text
Polter owns the product model.
Libraries provide focused leverage.
```

Add dependencies only when the current architecture needs them and when they strengthen the operational chain from context to audit.
