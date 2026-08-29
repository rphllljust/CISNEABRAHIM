# UL-DISC-001

| Campo | Valor |
| --- | --- |
| Document ID | Termos desencorajados e proibidos |
| Prompt | 04 |

## PROHIBITED (não usar em documentação futura sem revisão)

| Termo | Motivo | Usar em vez de |
| --- | --- | --- |
| Usuário (como ator de negócio) | Confunde login técnico com papel empresarial | Ator nomeado (Solicitante, Executor, etc.) |
| Admin | Role técnica não definida | Autorizador empresarial (TERM-007) |
| CRUD | Jargão técnico prematuro | Verbo empresarial do FR |
| Tabela / entidade / enum | Antecipação de implementação | TERM-* |
| CONFIRMED (regra) | Sem fonte primária | CANDIDATE / PENDING_VALIDATION |
| MVP fechado | Escopo não confirmado | Primeiro release (DDP-026) |
| NF-e emitida pelo sistema | Não afirmado em SRC-001 | TERM-018 |

## DISCOURAGED (usar com cautela)

| Termo | Motivo | Preferência |
| --- | --- | --- |
| Gestão | Ator vago (EV-080) | Cargo ou TERM-007 |
| Pedido (sozinho) | Homônimo | TERM-001 ou TERM-012 |
| Fatura / Nota (sozinho) | Fiscal ambíguo | TERM-018 |
| Serviço (sozinho) | Escopo amplo | TERM-003 com qualificador |
| Draft | Inglês | TERM-009 Rascunho de OS |
| Ticket | Não usado na fonte | TERM-001 |
| Job / Task (negócio) | Antecipação técnica | TERM-002 / item de OS |
