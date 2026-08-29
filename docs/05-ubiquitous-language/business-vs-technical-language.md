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

## Técnico (não misturar como sinônimo empresarial)

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
