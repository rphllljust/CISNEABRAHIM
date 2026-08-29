# UL-BVT-001

| Campo | Valor |
| --- | --- |
| Document ID | Linguagem empresarial vs técnica |
| Prompt | 04 |

## Empresarial (usar em requisitos e glossário)

| Categoria | Exemplos TERM / atores |
| --- | --- |
| Artefatos | TERM-001, TERM-002, TERM-031 |
| Ações | Liberar, Converter, Medir, Alocar |
| Atores | Solicitante, Autorizador empresarial, Executor |
| Valores | Custo interno, Preço comercial, Margem |
| Auditoria | Histórico da OS, Trilha de auditoria |

## Técnico (não pertence ao glossário empresarial)

| Termo técnico | Uso | Nota |
| --- | --- | --- |
| requestId | Identificador de requisição HTTP | Suporte técnico futuro |
| correlationId | Correlação distribuída | NFR-030; ≠ identificador empresarial |
| idempotencyKey | Deduplicação de comando | NFR-002..003; não termo de negócio |
| storageKey | Localização de blob | TERM-033 adjacente |
| outbox | Padrão de integração | Não introduzir como conceito de domínio |
| retry | Retentativa técnica | NFR integração |
| lock | Exclusão técnica | Classificado em NFR; não no glossário |
| cache | Performance | NFR-032 adjacente |
| traceId | TECHNICAL_LOG / TRACE | NFR-030 |

Estes termos **não** são sinônimos empresariais. Documentar apenas em notas de engenharia (Prompt 09+).

## Técnico legado (tabela anterior)

| Termo técnico | Equivalente empresarial quando aplicável |
| --- | --- |
| Usuário / login | Ator empresarial (papel) |
| Sessão | TERM-007 contexto futuro |
| Endpoint / API | Não documentar nesta fase |
| Log / stdout | TECHNICAL_LOG (NFR) |
| RBAC / role técnica | Autorização empresarial (AUTH-REQ) |
| UUID / PK | Identificador interno (DR-001, DR-005) |
| Upload | Anexar evidência / arquivo associado |
| Cache / fila | Não introduzir |
| Enum / tabela | Proibido nesta fase |

## Regra de escrita

Documentos em `05-ubiquitous-language/` e requisitos futuros devem priorizar coluna esquerda. Termos técnicos só em notas de engenharia com referência a prompt autorizado (09+).
