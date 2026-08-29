# SISTEMA CISNE RONDÔNIA

Repositório de governança e engenharia do **SISTEMA CISNE RONDÔNIA**, sistema a ser desenvolvido para empresa privada sediada em Porto Velho, Rondônia.

## Estágio atual

```text
PROJECT PHASE: FOUNDATION → TECHNICAL BOOTSTRAP
FUNCTIONAL CODE: NOT STARTED (domínio empresarial)
TECHNICAL SCAFFOLD: STARTED (Prompt 16)
DATABASE: STARTED (Prompt 17 — local Docker PG 18 + Drizzle técnico)
BACKEND SHELL: @cisne/api — health check only
FRONTEND SHELL: @cisne/web — bootstrap UI only
AUTHENTICATION: NOT STARTED
DOMAIN MODEL: NOT FINALIZED
BUSINESS SOURCES: PENDING
```

O monorepo técnico (`apps/`, `packages/`) existe desde o Prompt 16. **Não** há módulos empresariais, CRUD, autenticação nem banco de domínio.

Documentação de execução local: [`docs/17-bootstrap/local-development.md`](docs/17-bootstrap/local-development.md).

PostgreSQL local e migrations: [`docs/18-database-foundation/README.md`](docs/18-database-foundation/README.md).

## Objetivo geral

Estabelecer uma baseline documental segura para descoberta, rastreabilidade e implementação futura de um sistema transacional crítico de gestão operacional, **somente após** requisitos mínimos, fontes empresariais e decisões bloqueantes estarem tratados.

O contexto empresarial preliminar inclui atividades como representação comercial, logística, transportes, locações e gestão de serviços com veículos, equipamentos e mão de obra. Esse contexto **não** é escopo contratado, MVP ou lista de módulos do primeiro release.

## Aviso

Este repositório, nesta fase, contém apenas governança, registros e templates. Qualquer afirmação de que o sistema “já funciona” é falsa.

O processo de prompts incrementais **não promete ausência total de erros**. Ele reduz risco por validação, rastreabilidade, classificação explícita de incerteza, testes futuros proporcionais ao risco e quality gates. Erros, omissões e conflitos devem permanecer visíveis.

## Princípios do desenvolvimento incremental

- Um prompt por vez. O prompt seguinte não é executado automaticamente.
- Revisão humana (ou aceite explícito do responsável) antes de avançar.
- Documentação e proveniência antes de código.
- Fato, hipótese, desejo, interpretação e decisão pendente não se misturam.
- Regras empresariais não são confirmadas sem fonte.
- Commits pequenos e rastreáveis, quando o Git permitir.
- Implementação bloqueada enquanto faltar informação crítica (`NOT_READY_FOR_IMPLEMENTATION`).

Detalhes: [`docs/00-governance/engineering-principles.md`](docs/00-governance/engineering-principles.md), [`docs/00-governance/execution-protocol.md`](docs/00-governance/execution-protocol.md).

## Estrutura documental

| Caminho                                      | Função                                                          |
| -------------------------------------------- | --------------------------------------------------------------- |
| [`AGENTS.md`](AGENTS.md)                     | Instruções vinculantes para agentes                             |
| [`docs/README.md`](docs/README.md)           | Índice da documentação                                          |
| [`docs/00-governance/`](docs/00-governance/) | Carta, protocolo, DoR, DoD, gates, roadmap                      |
| [`docs/01-foundation/`](docs/01-foundation/) | Fontes, escopo, regras, decisões, riscos, rastreabilidade       |
| [`docs/inputs/`](docs/inputs/)               | Área segura para fontes empresariais futuras                    |
| [`docs/templates/`](docs/templates/)         | Modelos de registro                                             |
| [`apps/`](apps/)                             | Aplicações (`api`, `web`) — Prompt 16                           |
| [`packages/`](packages/)                     | Tooling compartilhado (`tsconfig`, `eslint-config`, `database`) |
| [`docker/`](docker/)                         | Compose PostgreSQL local (Prompt 17)                            |

Existem pastas `apps/`, `packages/` e `docker/` desde os Prompts 16–17. Não há módulos de domínio empresarial.

## Como adicionar fontes empresariais

1. Depositar originais ou cópias de trabalho em `docs/inputs/`, seguindo [`docs/inputs/README.md`](docs/inputs/README.md).
2. Registrar a fonte em [`docs/01-foundation/source-registry.md`](docs/01-foundation/source-registry.md) com identificador novo (não reutilizar IDs).
3. Preencher o template [`docs/templates/source-template.md`](docs/templates/source-template.md) quando a ingestão for autorizada (Prompt 01 ou posterior).
4. Não tratar arquivo não registrado como evidência.
5. Não inventar `SOURCE-ID` para documento inexistente.

Enquanto as fontes não forem fornecidas, o registro permanece `NOT_PROVIDED`.

## Como executar a sequência de prompts

1. Ler `AGENTS.md`, este `README.md` e `docs/README.md`.
2. Consultar [`docs/00-governance/prompt-execution-log.md`](docs/00-governance/prompt-execution-log.md) e [`docs/00-governance/prompt-roadmap.md`](docs/00-governance/prompt-roadmap.md).
3. Confirmar pré-condições do protocolo em [`docs/00-governance/execution-protocol.md`](docs/00-governance/execution-protocol.md).
4. Executar **somente** o prompt solicitado.
5. Validar quality gates em [`docs/00-governance/quality-gates.md`](docs/00-governance/quality-gates.md).
6. Atualizar rastreabilidade e o registro de execução.
7. Parar. Aguardar revisão antes do próximo prompt.

### Regra de um prompt por vez

É proibido encadear Prompt N+1 ao concluir Prompt N, salvo ordem explícita nova do responsável pelo projeto.

### Regra de revisão antes do próximo prompt

O próximo prompt só deve iniciar após revisão do relatório, do registro de execução e dos gates. Status `PASS_WITH_RESTRICTIONS`, `FAIL` ou `BLOCKED` impede avanço até tratamento documentado.

## Referências de prontidão

- Definition of Ready: [`docs/00-governance/definition-of-ready.md`](docs/00-governance/definition-of-ready.md)
- Definition of Done: [`docs/00-governance/definition-of-done.md`](docs/00-governance/definition-of-done.md)
- Carta do projeto: [`docs/00-governance/project-charter.md`](docs/00-governance/project-charter.md)
