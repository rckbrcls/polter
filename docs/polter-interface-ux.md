# Polter Interface UX

Este documento descreve a interface ideal do Polter para Desktop, CLI e MCP. Ele complementa `docs/polter-product-architecture.md` e deve orientar produto, design e implementação futura.

O padrão central é:

```txt
Machine -> Command -> Stage -> Approval -> Execution -> Logs -> Audit
```

O Polter deve ser uma interface operacional para humanos e agentes, não um dashboard genérico e não um terminal livre disfarçado.

## UX Mission

Polter deve transformar comandos e processos reais em operações compreensíveis, auditáveis e seguras.

O usuário deve sempre entender:

- onde a ação vai acontecer,
- o que será executado,
- quem pediu,
- qual é o risco,
- qual aprovação é necessária,
- o que aconteceu depois da execução.

Frase guia:

> Polter is a machine-first command workbench for safe human and agent operations.

## Mental Model

Polter é `machine-first`.

O usuário não começa pela ferramenta, pelo processo ou pelo agente. Ele começa pela máquina:

- `This Mac`
- `Windows PC`
- `prod-api`
- `staging-worker`
- `customer-demo`

Ao trocar a máquina ativa, a interface troca o contexto de:

- comandos disponíveis,
- workspaces,
- processos,
- logs,
- pipelines,
- histórico,
- políticas,
- aprovações,
- agentes com acesso.

O usuário deve sentir que está operando uma máquina específica, não uma lista abstrata de comandos.

## Shared Product Language

CLI, Desktop e MCP devem usar os mesmos conceitos.

Vocabulário principal:

- `Machine`: ambiente operável.
- `Command`: operação descoberta, curada ou escrita pelo usuário.
- `Stage`: preparação de execução antes de rodar.
- `Approval`: decisão humana ou política explícita.
- `Execution`: comando ou pipeline em andamento/concluído.
- `Process`: execução long-running ou monitorável.
- `Log`: saída e eventos estruturados.
- `Audit`: registro final de quem pediu, aprovou e executou.
- `Agent`: consumidor MCP com permissões controladas.

Vocabulário secundário:

- `Node`: serviço local em uma máquina. Deve ficar em diagnóstico/configuração.
- `Gateway`: roteador de sessões. Deve ficar em configuração avançada.
- `Relay`: transporte self-hosted/cloud. Deve ficar em configuração avançada.

Na navegação principal, preferir `Machines`, não `Nodes`.

## Desktop UX

O Desktop é o cockpit humano. Ele deve ser visual, inspecionável, denso e orientado a aprovação.

Ele deve seguir o contrato de `apps/desktop/DESIGN.md`: workbench sério, maduro, keyboard-friendly, com tabelas, split panes, logs, status strips e Commander. Não deve parecer landing page, dashboard de SaaS genérico ou tela decorativa.

### App Shell

Estrutura ideal:

```txt
Sidebar
  Machines
  Workspaces
  Primary views

Header
  Machine switcher
  Current workspace
  Commander
  Agent/approval status

Main area
  Active view

Inspector
  Selected item details
  Risk
  Approval
  Logs
  Actions
```

A interface deve deixar o contexto ativo visível em todos os momentos:

```txt
Machine: prod-api
Workspace: /srv/api
Connection: Online
Agent access: Limited
Pending approvals: 2
```

### Navigation

Views ideais:

- `Machines`
- `Commands`
- `Processes`
- `Logs`
- `Pipelines`
- `Approvals`
- `Agents`
- `History`
- `Settings`

`Node`, `Gateway` e `Relay` não devem aparecer como views principais. Eles pertencem a detalhes de máquina, diagnóstico ou settings.

### Machines View

Objetivo: gerenciar e alternar ambientes operáveis.

Cada máquina deve mostrar:

- nome,
- tipo (`Local`, `Windows`, `EC2`, `VPS`, `Managed`),
- OS/arch,
- conexão,
- último heartbeat,
- workspaces,
- processos ativos,
- aprovações pendentes,
- agentes permitidos.

Estados importantes:

- `Online`
- `Offline`
- `Connecting`
- `Needs setup`
- `Update available`
- `Policy required`

A ação primária deve ser `Open machine`.

Ações secundárias:

- `Add machine`
- `Connect via SSH`
- `Copy bootstrap command`
- `View diagnostics`
- `Remove machine`

### Commands View

Objetivo: encontrar operações disponíveis naquela máquina.

Comandos devem ser objetos estruturados, não só strings.

Um command row deve mostrar:

```txt
Public IP
curl ifconfig.me
Recipe · Network · This Mac
Risk: Network
```

Fontes:

- `System`
- `Package Manager`
- `Workspace Script`
- `Recipe`
- `Pipeline`
- `History`

Filtros:

- source,
- risk,
- workspace,
- recently used,
- pinned,
- agent-safe,
- requires approval.

Ação primária: `Stage`.

Nada deve rodar direto da lista sem passar por staging, exceto comandos explicitamente marcados como seguros e ainda assim com feedback claro.

### Command Detail

O detalhe do comando deve responder:

- o que este comando faz,
- qual comando final será rodado,
- em qual máquina,
- em qual diretório,
- qual é a fonte,
- qual é o risco,
- se usa rede,
- se pode destruir dados,
- quais argumentos faltam,
- quais aprovações são necessárias.

Layout sugerido:

```txt
Command header
  title, source, risk, machine

Invocation
  command preview
  editable args
  cwd selector

Policy
  safety classification
  approval requirement

Recent results
  last runs
  last exit codes
```

### Stage Surface

Staging é uma etapa de produto, não uma confirmação genérica.

Deve mostrar:

- `Machine`
- `Workspace`
- `Command`
- `Requester`
- `Risk`
- `Required approval`
- `Expected output`

Exemplo:

```txt
Machine: prod-api
Workspace: /srv/api
Command: systemctl restart api
Requester: Codex
Risk: Privileged
Approval: Required
```

Ações:

- `Approve and run`
- `Edit command`
- `Deny`
- `Save as recipe`
- `Copy command`

### Processes View

Objetivo: acompanhar execuções em andamento e processos iniciados pelo Polter.

Process table:

- process id,
- command,
- machine,
- workspace/cwd,
- status,
- pid,
- uptime,
- last output,
- exit code,
- requester.

Status:

- `Running`
- `Exited`
- `Failed`
- `Stopping`
- `Needs attention`

Detalhe de processo:

- command invocation,
- stdout/stderr tabs,
- structured events,
- timeline,
- stop/remove actions,
- save output,
- create recipe/pipeline from command.

### Logs View

Objetivo: leitura operacional, não dashboard genérico.

Logs devem ser:

- monospace,
- filtráveis,
- copy-friendly,
- estáveis em altura,
- agrupados por machine/process/service,
- capazes de virar eventos estruturados.

Filtros:

- machine,
- workspace,
- process,
- stream (`stdout`, `stderr`, `system`),
- severity,
- time range,
- error pattern.

O Polter deve destacar erros comuns sem esconder o log bruto:

- port already in use,
- command not found,
- permission denied,
- auth failed,
- missing env,
- migration failed,
- connection refused.

### Pipelines View

Objetivo: transformar comandos repetidos em workflows reutilizáveis.

Pipeline step deve sempre ter:

- machine policy,
- command source,
- cwd,
- args,
- approval rule,
- continue-on-error rule,
- output/log behavior.

Pipelines podem ser:

- local-only,
- machine-specific,
- multi-machine no futuro.

Para v1, preferir pipelines por máquina. Multi-machine aumenta complexidade de rollback, permissões e logs.

### Approvals View

Objetivo: ser a caixa de entrada de decisões humanas.

Approval row:

```txt
Codex wants to run
systemctl restart api
prod-api · /srv/api · Privileged
```

Campos:

- requester,
- agent/user,
- machine,
- workspace,
- command,
- risk,
- reason,
- created at,
- timeout,
- status.

Status:

- `Pending`
- `Approved`
- `Denied`
- `Expired`
- `Executed`
- `Failed`

Approvals devem ser fáceis de comparar e revisar. A UI deve evitar popups caóticos para tudo. Toasts podem avisar, mas a inbox de approvals deve ser a fonte de verdade.

### Agents View

Objetivo: mostrar quem pode pedir ações.

Deve mostrar:

- agent name,
- client type (`Codex`, `OpenClaw`, `Claude Code`, `Custom MCP`),
- connection status,
- allowed machines,
- allowed tools,
- approval policy,
- last requests.

Ferramentas de agente devem ser apresentadas de forma humana:

- `List machines`
- `Search commands`
- `Read logs`
- `Stage command`
- `Run approved command`
- `Run pipeline`

Evitar apresentar `run_shell` como ferramenta padrão. Se existir, deve aparecer como perigosa e desabilitada por padrão.

### History View

Objetivo: memória operacional.

History deve responder:

- o que foi pedido,
- por quem,
- em qual máquina,
- quem aprovou,
- o que rodou,
- qual foi o resultado,
- quais logs relevantes saíram,
- se virou recipe ou pipeline.

Tipos:

- command run,
- pipeline run,
- approval decision,
- agent request,
- machine connection event,
- policy change.

### Settings View

Settings deve ser separada por:

- account,
- machines,
- relay/cloud,
- MCP,
- policies,
- storage,
- diagnostics,
- appearance.

Configuração técnica de `Node`, `Gateway` e `Relay` pertence aqui ou ao detalhe da máquina.

## Commander UX

Commander é o centro operacional do Desktop.

Ele deve responder a intenção, não só buscar texto exato.

Exemplos:

```txt
public ip
logs api
restart service
add machine
show windows processes
approve pending command
```

Resultados devem sempre mostrar:

- tipo,
- título,
- comando/ação,
- máquina,
- fonte,
- risco.

Exemplo:

```txt
[Recipe] Public IP        curl ifconfig.me        This Mac · Network
[Process] api-server      Running                 prod-api · 2h uptime
[Command] ping            System                  Windows PC · Read-only
[Approval] Restart API    Pending                 prod-api · Privileged
```

Commander deve ter planos:

- list plane,
- command detail plane,
- approval plane,
- machine quick actions,
- process/log jump.

Ele não deve virar um formulário gigante. Quando a ação exige edição longa, Commander deve encaminhar para uma view ou inspector dedicado.

## CLI UX

A CLI é para operação headless, automação e servidores. Ela deve ser explícita, previsível e scriptável.

Princípios:

- comandos remotos devem declarar a máquina,
- ações perigosas não devem depender de estado invisível,
- stdout deve ser útil para humanos,
- `--json` deve existir para automação,
- erros devem sugerir próximo passo,
- comandos de setup devem explicar o que vão instalar ou iniciar.

### Command Groups

Grupos principais:

```bash
polter machine ...
polter command ...
polter run ...
polter process ...
polter logs ...
polter pipeline ...
polter approval ...
polter mcp ...
polter node ...
```

### Machine Commands

```bash
polter machine list
polter machine add windows --ssh erick@192.168.0.20
polter machine add prod-api --ssh ubuntu@ec2-host
polter machine status prod-api
polter machine open prod-api
polter machine remove prod-api
```

`machine add` deve ser o comando de produto. Ele pode instalar/iniciar node por baixo, mas o usuário não deve precisar pensar nisso primeiro.

### Command Search And Staging

```bash
polter command search "public ip" --machine this-mac
polter command search "process port" --machine windows
polter command inspect public-ip --machine this-mac
polter command stage "curl ifconfig.me" --machine this-mac
```

`stage` deve criar uma execução pendente ou um preview claro, dependendo da política.

### Run

Forma explícita:

```bash
polter run this-mac -- git status
polter run windows -- powershell Get-Process
polter run prod-api -- systemctl status api
```

Para máquina local, pode existir atalho:

```bash
polter run -- git status
```

Para máquina remota, exigir o alvo:

```bash
polter run prod-api -- git status
```

Não usar estado implícito para produção ou máquina remota.

### Processes And Logs

```bash
polter process list --machine prod-api
polter process inspect <process-id> --machine prod-api
polter process stop <process-id> --machine prod-api

polter logs --machine prod-api --service api
polter logs --machine prod-api --process <process-id>
polter logs --machine prod-api --tail 200
```

### Pipelines

```bash
polter pipeline list --machine prod-api
polter pipeline inspect deploy-staging --machine prod-api
polter pipeline run deploy-staging --machine prod-api
```

Pipeline run deve exibir steps, riscos e aprovações antes de executar quando necessário.

### Approvals

```bash
polter approval list
polter approval inspect <approval-id>
polter approval approve <approval-id>
polter approval deny <approval-id>
```

Approvals devem mostrar máquina, comando, requester e risco antes da decisão.

### MCP

```bash
polter mcp install
polter mcp status
polter mcp tools
polter mcp disconnect <client-id>
```

MCP CLI deve ajudar o usuário a entender quais agentes têm acesso e quais ferramentas estão expostas.

### Node Diagnostics

```bash
polter node start
polter node stop
polter node status
polter node logs
```

`node` é diagnóstico/infra. Não deve ser a primeira palavra na experiência normal.

## MCP UX

MCP é a interface dos agentes, mas a experiência deve continuar controlada pelo Polter.

Ferramentas recomendadas:

```txt
list_machines
get_machine_status
search_commands
stage_command
request_approval
run_approved_command
list_processes
read_process_logs
read_recent_errors
run_pipeline
explain_command
```

Fluxo ideal:

```txt
Agent asks for machine context
  -> Polter returns machines and permissions
Agent searches or stages command
  -> Polter classifies risk
Agent requests execution
  -> Polter creates approval if needed
Human approves
  -> Polter executes through the node
Agent receives structured result
  -> Audit event is stored
```

O agente nunca deve precisar saber se a máquina usa SSH, local gateway, self-host relay ou cloud relay. Ele opera por `machineId`.

## Approval UX

Approval é o freio de segurança do produto.

Uma aprovação deve ser clara o bastante para o usuário decidir em segundos.

Modelo:

```txt
Requester: Codex
Machine: prod-api
Workspace: /srv/api
Command: systemctl restart api
Risk: Privileged
Reason: Restart API after config change
```

Decisões:

- `Approve once`
- `Deny`
- `Edit and stage`
- `Save policy`

`Save policy` só deve aparecer quando o produto já tiver maturidade para regras persistentes. Para v1, approval manual é mais seguro.

## Risk Language

O produto deve usar uma taxonomia simples:

- `Read-only`
- `Normal`
- `Network`
- `Destructive`
- `Privileged`

O risco deve aparecer em command rows, stage surface, approvals, history e agent tools.

Exemplos:

```txt
git status -> Read-only
curl ifconfig.me -> Network
rm -rf ./dist -> Destructive
systemctl restart api -> Privileged
```

## Empty States

Empty states devem ser úteis, curtos e operacionais.

Exemplos:

```txt
No machines connected.
Add your first machine to start routing commands.

No commands indexed.
Run a scan or add a workspace.

No approvals pending.
Agent requests that need review will appear here.
```

Nada de textos longos explicando o produto inteiro dentro da interface.

## Error UX

Erros devem ter contexto e próximo passo.

Formato:

```txt
Connection failed
Windows PC did not respond to the gateway heartbeat.

Action:
Check whether Polter Node is running on Windows PC.
```

Para command errors:

```txt
Command failed
Exit code: 127
Reason: command not found
Next: search for installed package managers on this machine.
```

Logs brutos devem continuar acessíveis.

## Cross-Surface Consistency

As três superfícies devem se complementar:

```txt
Desktop
  inspection, approval, visual operation

CLI
  headless operation, bootstrap, automation

MCP
  agent access, structured tools, policy-controlled execution
```

Todas devem compartilhar:

- machine ids,
- command ids,
- process ids,
- approval ids,
- pipeline ids,
- audit ids.

## Design Principles

Do:

- manter a interface densa e operacional,
- usar split panes, tabelas, inspectors, logs e status strips,
- priorizar teclado,
- mostrar máquina e risco perto da ação,
- stagear antes de executar,
- registrar tudo em history/audit,
- deixar agentes operarem por ferramentas estruturadas.

Do not:

- criar dashboard genérico de cards grandes,
- usar hero/marketing dentro do app,
- esconder a máquina alvo,
- deixar produção depender de estado implícito,
- expor shell livre para agente por padrão,
- tratar `Node`, `Gateway` e `Relay` como conceitos principais da UI,
- rodar ação destrutiva sem contexto e aprovação.

## Ideal First Experience

Primeiro uso no Desktop:

```txt
1. Open Polter
2. See This Mac as the default machine
3. Search "public ip" in Commander
4. Stage the recipe
5. Approve and run
6. See output and audit event
7. Add Windows PC
8. Search Windows commands
9. Stage remote command
10. Approve and run through the gateway
```

Primeiro uso na CLI:

```bash
polter machine list
polter command search "public ip" --machine this-mac
polter run this-mac -- hostname
polter machine add windows --ssh erick@192.168.0.20
polter run windows -- hostname
```

Primeiro uso com agente:

```txt
1. User installs Polter MCP locally
2. Agent lists machines
3. Agent reads logs from a selected machine
4. Agent stages a suggested command
5. Desktop shows approval
6. User approves
7. Agent receives structured execution result
```

## Final Interface Sentence

Polter's interface is a machine-first command cockpit where humans and agents search, stage, approve, run, observe, and audit operations across local and remote machines.
