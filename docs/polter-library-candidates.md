# Polter Library Candidates

Este documento cataloga as bibliotecas atuais e candidatas para o Polter. Ele nao instala nada e nao deve ser lido como lock-in tecnico. A funcao dele e ajudar a decidir dependencias futuras com criterio, mantendo a missao do Polter como um control plane seguro para comandos, processos, logs, maquinas e agentes.

Principio de decisao:

```txt
Adicionar libs somente quando elas fortalecem Process, Terminal UX, Command Registry, Machine Gateway, Security, Logs ou Audit.
```

## Current Baseline

O projeto ja tem uma base moderna:

- `apps/desktop`: Electron, React, Vite, shadcn/Radix, Commander, renderer UI.
- `packages/core`: logica nao visual para comandos, pipelines, processos, config, MCP, skills e desktop service.
- `docs/polter-product-architecture.md`: missao e arquitetura.
- `docs/polter-interface-ux.md`: UX ideal para Desktop, CLI e MCP.

Este documento separa:

- **Installed**: ja esta no repo.
- **Candidate**: ainda nao esta instalado.
- **Recommended now**: candidato forte para o proximo ciclo.
- **Later**: util, mas deve esperar maturidade do produto.
- **Avoid for now**: complica cedo demais.

## Dependency Decision Rules

Antes de adicionar qualquer lib, responder:

- Ela ajuda diretamente `Machine -> Command -> Stage -> Approval -> Execution -> Logs -> Audit`?
- Ela pertence ao `packages/core`, ao `apps/desktop` ou a um futuro pacote de gateway/node?
- Ela roda bem em macOS, Windows e Linux?
- Ela exige binario nativo, permissao especial ou empacotamento complicado?
- Ela melhora seguranca, auditabilidade ou previsibilidade?
- Ela substitui algo que ja temos ou complementa uma lacuna real?

Se a resposta for "so parece moderna", nao adicionar.

## Installed: Core And Platform

| Package | Link | Layer | What It Covers | Keep Using |
| --- | --- | --- | --- | --- |
| `@modelcontextprotocol/sdk` | [npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk) | MCP | Base para expor ferramentas MCP do Polter para agentes. | Sim. E central para `Polter MCP`. |
| `conf` | [npm](https://www.npmjs.com/package/conf) | Config | Settings locais pequenos, repositorios salvos, preferencias simples. | Sim, mas nao usar para indice grande. |
| `eventemitter3` | [npm](https://www.npmjs.com/package/eventemitter3) | Events | Eventos internos leves. | Sim, util para processos e runtime local. |
| `execa` | [npm](https://www.npmjs.com/package/execa) | Process | Execucao de comandos nao interativos com stdout/stderr. | Sim, manter para comandos simples. |
| `p-limit` | [npm](https://www.npmjs.com/package/p-limit) | Concurrency | Limitar concorrencia de tarefas assíncronas. | Sim, mas considerar `p-queue` para filas mais ricas. |
| `p-retry` | [npm](https://www.npmjs.com/package/p-retry) | Reliability | Retry controlado para operacoes falhaveis. | Sim, util para rede/gateway. |
| `semver` | [npm](https://www.npmjs.com/package/semver) | Versioning | Comparacao de versoes. | Sim. |
| `signal-exit` | [npm](https://www.npmjs.com/package/signal-exit) | Process lifecycle | Cleanup quando processo encerra. | Sim, importante para supervisor. |
| `which` | [npm](https://www.npmjs.com/package/which) | Command discovery | Resolver executaveis no `PATH`. | Sim, central para command registry. |
| `zod` | [npm](https://www.npmjs.com/package/zod) | Contracts | Validacao e contratos tipados. | Sim, deve ser base de IPC/MCP/config. |
| `ms` | [npm](https://www.npmjs.com/package/ms) | Utilities | Parsing/formatacao de duracao. | Sim, suporte. |
| `picocolors` | [npm](https://www.npmjs.com/package/picocolors) | CLI output | Cores para CLI. | Sim, suporte leve. |

## Installed: Desktop And UI

| Package | Link | Layer | What It Covers | Keep Using |
| --- | --- | --- | --- | --- |
| `electron` | [npm](https://www.npmjs.com/package/electron) | Desktop runtime | App desktop principal. | Sim. |
| `electron-vite` | [npm](https://www.npmjs.com/package/electron-vite) | Desktop build workflow | Build de main/preload/renderer. | Sim. |
| `electron-builder` | [npm](https://www.npmjs.com/package/electron-builder) | Packaging | Empacotamento unsigned. | Sim. |
| `electron-log` | [npm](https://www.npmjs.com/package/electron-log) | Desktop logging | Logs do processo main. | Sim. |
| `@electron-toolkit/utils` | [npm](https://www.npmjs.com/package/@electron-toolkit/utils) | Electron utilities | Helpers para Electron moderno. | Sim. |
| `@orama/orama` | [npm](https://www.npmjs.com/package/@orama/orama) | Search UX | Busca em memoria no Commander. | Sim, como hot index/UX, nao banco principal. |
| `@tanstack/react-query` | [npm](https://www.npmjs.com/package/@tanstack/react-query) | Async state | Estado assíncrono/cache da UI. | Sim, util quando IPC real voltar. |
| `zustand` | [npm](https://www.npmjs.com/package/zustand) | UI state | Estado local de UI/workbench. | Sim. |
| `cmdk` | [npm](https://www.npmjs.com/package/cmdk) | Commander | Command palette. | Sim, central para Commander. |
| `motion` | [npm](https://www.npmjs.com/package/motion) | Motion | Animacoes React. | Sim, alinhado ao `DESIGN.md`. |
| `sonner` | [npm](https://www.npmjs.com/package/sonner) | Feedback | Toasts transientes. | Sim. |
| `radix-ui` | [npm](https://www.npmjs.com/package/radix-ui) | UI primitives | Primitivos acessiveis. | Sim, com styling contido. |
| `shadcn` | [npm](https://www.npmjs.com/package/shadcn) | UI scaffolding | Primitivos e workflow shadcn. | Sim, sem deixar o default dominar. |
| `lucide-react` | [npm](https://www.npmjs.com/package/lucide-react) | Icons | Iconografia. | Sim. |
| `react-resizable-panels` | [npm](https://www.npmjs.com/package/react-resizable-panels) | Layout | Split panes. | Sim, combina com workbench. |
| `@dnd-kit/core` / `@dnd-kit/sortable` | [npm](https://www.npmjs.com/package/@dnd-kit/core) | Interaction | Drag and drop para builders/listas ordenaveis. | Sim, especialmente pipelines. |
| `@icons-pack/react-simple-icons` | [npm](https://www.npmjs.com/package/@icons-pack/react-simple-icons) | Icons | Logos de ferramentas. | Sim, com parcimonia. |
| `@base-ui/react` | [npm](https://www.npmjs.com/package/@base-ui/react) | UI primitives | Primitivos de baixo nivel. | Manter se ja houver uso claro. |
| `@fontsource-variable/inter` | [npm](https://www.npmjs.com/package/@fontsource-variable/inter) | Typography | Inter Variable local. | Sim. |
| `date-fns` | [npm](https://www.npmjs.com/package/date-fns) | Dates | Formatacao de datas. | Sim. |
| `next-themes` | [npm](https://www.npmjs.com/package/next-themes) | Theme | Theme switching. | Sim se estiver integrado sem atrito. |
| `tailwindcss` / `@tailwindcss/vite` | [npm](https://www.npmjs.com/package/tailwindcss) | Styling | CSS utility/theme. | Sim. |
| `tailwind-merge` | [npm](https://www.npmjs.com/package/tailwind-merge) | Styling utilities | Merge de classes. | Sim. |
| `class-variance-authority` | [npm](https://www.npmjs.com/package/class-variance-authority) | Styling utilities | Variants de componentes. | Sim. |
| `vitest` | [npm](https://www.npmjs.com/package/vitest) | Tests | Testes unitarios. | Sim. |
| `@testing-library/react` | [npm](https://www.npmjs.com/package/@testing-library/react) | Tests | Testes de componentes. | Sim. |
| `jsdom` | [npm](https://www.npmjs.com/package/jsdom) | Tests | DOM em testes. | Sim. |

## Candidate: Process And Terminal

| Package | Link | Priority | Why It Helps | Risks / Cost | Decision |
| --- | --- | --- | --- | --- | --- |
| `node-pty` | [npm](https://www.npmjs.com/package/node-pty) | Recommended now | PTY real para comandos interativos, shells, terminal embutido e comportamento mais proximo do terminal. | Binario nativo; empacotamento cross-platform precisa cuidado. | Adicionar quando Processes sair de mock para runtime real. |
| `@xterm/xterm` | [npm](https://www.npmjs.com/package/@xterm/xterm) | Recommended now | UI de terminal madura para logs interativos e sessoes PTY. | Pode virar "terminal livre" se o produto nao limitar bem. | Usar como surface de output/terminal, nao como modelo de produto. |
| `p-queue` | [npm](https://www.npmjs.com/package/p-queue) | Recommended now | Fila com concorrencia, pause, priority e lifecycle melhor que `p-limit` para varias execucoes. | Mais uma abstracao de fila para manter. | Usar no Process Manager. |
| `pidusage` | [npm](https://www.npmjs.com/package/pidusage) | Later | CPU/memoria por processo para Processes view. | Variacoes por OS; pode ser util so depois. | Adicionar quando UI de recursos por processo existir. |
| `systeminformation` | [npm](https://www.npmjs.com/package/systeminformation) | Recommended now | Inventario de maquina: OS, CPU, memoria, rede, processos, ambiente. | Pode ser pesado se usado em polling agressivo. | Usar para Machine status com cache/intervalos. |

## Candidate: Ports And Dev Servers

| Package | Link | Priority | Why It Helps | Risks / Cost | Decision |
| --- | --- | --- | --- | --- | --- |
| `portless` | [GitHub](https://github.com/vercel-labs/portless) | Experimental | URLs `.localhost`, proxy, injecao de `PORT`, LAN mode e menos colisao para dev servers. | Pre-1.0; focado em comandos web/dev-server, nao em processos gerais. | Usar como adapter experimental para comandos que expõem HTTP. |
| `get-port` | [npm](https://www.npmjs.com/package/get-port) | Recommended now | Alocacao simples de porta livre quando nao precisa de proxy/nome estavel. | Resolver porta livre nao garante ausencia de race em todos os casos. | Usar como fallback simples no Port Manager. |

### Decision On `portless`

`portless` faz sentido para Polter, mas com fronteira clara:

```txt
Polter Process Manager = nosso
Polter Port/URL Adapter = pode usar portless
```

Nao usar `portless` como gerenciador universal de processos. Muitos comandos nao abrem porta: `git status`, `psql`, `pytest`, `systemctl`, `docker logs`, migrations e scripts one-shot. Para esses casos, Polter precisa do seu proprio Process Manager, logs, approvals, status, retry e audit.

## Candidate: Storage And Search

| Package | Link | Priority | Why It Helps | Risks / Cost | Decision |
| --- | --- | --- | --- | --- | --- |
| `better-sqlite3` | [npm](https://www.npmjs.com/package/better-sqlite3) | Recommended now | SQLite local duravel para command registry, audit, history, machines e usage. | Binario nativo; empacotamento Electron precisa cuidado. | Melhor candidato para storage local. |
| `drizzle-orm` | [npm](https://www.npmjs.com/package/drizzle-orm) | Recommended now | Schema tipado e queries previsiveis para SQLite. | Requer disciplina com migrations. | Usar junto com SQLite. |
| `drizzle-kit` | [npm](https://www.npmjs.com/package/drizzle-kit) | Recommended now | Migrations e tooling do Drizzle. | Tooling adicional. | Usar quando schema persistente nascer. |
| SQLite FTS5 | [docs](https://sqlite.org/fts5.html) | Recommended now | Busca textual persistente para command registry. | Precisa modelar ranking/sync com tabelas base. | Usar como fonte de busca duravel; Orama pode ficar como hot index. |

## Candidate: Desktop UX

| Package | Link | Priority | Why It Helps | Risks / Cost | Decision |
| --- | --- | --- | --- | --- | --- |
| `@tanstack/react-table` | [npm](https://www.npmjs.com/package/@tanstack/react-table) | Recommended now | Tabelas densas para Machines, Commands, Processes, History e Approvals. | Headless; exige design cuidadoso. | Boa adicao para workbench serio. |
| `@tanstack/virtual` | [npm](https://www.npmjs.com/package/@tanstack/virtual) | Recommended now | Virtualizacao para logs e listas grandes. | Complexidade em scroll sync. | Usar em logs/process lists. |
| `codemirror` | [npm](https://www.npmjs.com/package/codemirror) | Later | Editor para scripts, command templates, pipelines e policies. | Pode ser overkill antes de edicao real. | Adicionar quando houver editor estruturado. |

## Candidate: Remote, Gateway And Relay

| Package | Link | Priority | Why It Helps | Risks / Cost | Decision |
| --- | --- | --- | --- | --- | --- |
| `ssh2` | [npm](https://www.npmjs.com/package/ssh2) | Recommended now | SSH bootstrap: instalar/iniciar node em maquinas remotas. | Auth, host keys e UX de erro precisam ser tratados com seriedade. | Melhor candidato para `machine add --ssh`. |
| `ws` | [npm](https://www.npmjs.com/package/ws) | Recommended now | WebSocket simples para gateway local, node outbound e stream de logs. | Precisa protocolo proprio, reconnect, heartbeat e auth. | Bom para MVP de gateway. |
| `fastify` | [npm](https://www.npmjs.com/package/fastify) | Candidate | API HTTP robusta para gateway/self-host relay. | Mais estrutura que `ws` puro. | Escolher se gateway precisar HTTP API forte. |
| `hono` | [npm](https://www.npmjs.com/package/hono) | Candidate | API leve e moderna para HTTP/gateway. | Menos opinativo para runtime Node tradicional. | Escolher se preferirmos camada minimalista. |

### Fastify vs Hono

Escolha sugerida:

- `ws` para o primeiro gateway local e streams.
- `fastify` se o gateway virar um servico Node mais robusto com rotas, plugins e observabilidade.
- `hono` se a prioridade for leveza, portabilidade e uma API bem pequena.

Nao adicionar `fastify` e `hono` ao mesmo tempo sem necessidade real.

## Candidate: Security And Auth

| Package | Link | Priority | Why It Helps | Risks / Cost | Decision |
| --- | --- | --- | --- | --- | --- |
| `jose` | [npm](https://www.npmjs.com/package/jose) | Recommended now | JWT/JWK/JWS para tokens, machine auth, client auth e relay. | Criptografia exige modelagem correta, nao so biblioteca. | Usar para tokens assinados quando gateway nascer. |
| `@noble/ed25519` | [npm](https://www.npmjs.com/package/@noble/ed25519) | Later | Identidade de maquina por assinatura Ed25519. | Mais baixo nivel; pode duplicar com `jose` no inicio. | Usar quando machine identity precisar assinatura propria. |

## Candidate: Logs, Telemetry And Audit

| Package | Link | Priority | Why It Helps | Risks / Cost | Decision |
| --- | --- | --- | --- | --- | --- |
| `pino` | [npm](https://www.npmjs.com/package/pino) | Recommended now | Logs estruturados no node, gateway e core. | Precisa padronizar redaction e sinks. | Boa base para audit/diagnostico. |
| `@opentelemetry/api` | [npm](https://www.npmjs.com/package/@opentelemetry/api) | Later | API de tracing/metrics. | Overhead conceitual cedo demais. | Adicionar quando relay/cloud existir. |
| `@opentelemetry/sdk-node` | [npm](https://www.npmjs.com/package/@opentelemetry/sdk-node) | Later | SDK Node para telemetry real. | Configuracao e exportadores. | Esperar gateway/cloud. |

## Candidate: Schema And Testing

| Package | Link | Priority | Why It Helps | Risks / Cost | Decision |
| --- | --- | --- | --- | --- | --- |
| `zod-to-json-schema` | [npm](https://www.npmjs.com/package/zod-to-json-schema) | Recommended now | Gerar schemas para MCP/tools a partir de contratos Zod. | Pode exigir ajustes para formatos esperados por clients. | Usar quando tools MCP ficarem mais formais. |
| `@playwright/test` | [npm](https://www.npmjs.com/package/@playwright/test) | Recommended now | E2E e screenshots da UI desktop/browser preview. | Testes podem exigir setup cuidadoso sem quebrar regra de build/run. | Usar para verificacao de UX quando permitido. |
| `msw` | [npm](https://www.npmjs.com/package/msw) | Later | Mock de APIs/gateway/MCP em testes da UI. | Pode ser desnecessario se adapter mock atual bastar. | Adicionar quando houver HTTP/gateway real. |

## Do Not Add Yet

Evitar por enquanto:

- `langchain` / `llamaindex` como core: Polter nao deve virar o cerebro do agente.
- Vector database: busca lexica, ranking e FTS primeiro.
- Docker/Kubernetes SDKs: so quando houver caso real de container/orchestrator.
- Rust sidecar: esperar dor real em PTY, supervisao, watchers ou isolamento.
- `portless` como runtime obrigatorio: deve ser adapter de dev-server, nao espinha dorsal.
- Cloud provider SDKs grandes: evitar AWS/GCP/Azure SDK antes de definir produto cloud.
- UI chart libraries novas: ja existe `recharts`; graficos nao sao centro do produto agora.

## Recommended First Additions

Se o proximo passo for sair de UI/mock para runtime real, a primeira onda deveria ser pequena:

```txt
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

`portless` entraria logo depois, quando houver o primeiro fluxo real de dev server com porta:

```txt
Command starts web process
  -> Polter assigns/receives PORT
  -> portless exposes stable localhost URL
  -> Polter links URL to process/logs/audit
```

## Ownership By Package

Sugestao de onde cada familia deveria viver:

```txt
packages/core
  process manager
  command registry
  SQLite/storage
  machine model
  MCP contracts
  audit model
  ssh bootstrap primitives

apps/desktop
  xterm UI
  tables
  virtualization
  Commander UX
  approval surfaces

future packages/gateway or packages/node
  ws gateway
  relay protocol
  machine auth
  structured logs
```

## Final Recommendation

A pilha ideal nao e "adicionar muitas libs modernas". A pilha ideal e:

```txt
Polter owns the product model.
Libraries provide focused leverage.
```

Use `portless` para portas e URLs de dev servers. Use `node-pty`, `p-queue`, SQLite/Drizzle, `ssh2`, `ws`, `pino` e `jose` para construir a base real de maquinas, processos, logs, gateway e auditoria.
