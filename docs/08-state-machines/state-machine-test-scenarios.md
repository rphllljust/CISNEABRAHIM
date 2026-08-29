# SM-TEST-001

| Campo | Valor |
| --- | --- |
| Document ID | Cenários de teste conceituais (futuros) |
| Prompt | 07 |
| Implementação | **Nenhuma** — apenas especificação |

## Cenários por categoria

### Transição válida

| ID | Cenário | Máquina | Transição | Resultado esperado |
| --- | --- | --- | --- | --- |
| TSC-001 | Liberar OS preparada | SM-CAND-002 | TR-CAND-007 | STATE-CAND-008, DE-004 |
| TSC-002 | Submeter medição | SM-CAND-005 | TR-CAND-025 | STATE-CAND-022, DE-014 |
| TSC-003 | Registrar nota | SM-CAND-008 | TR-CAND-040 | STATE-CAND-036, DE-017 |

### Transição inválida

| ID | Cenário | Referência |
| --- | --- | --- |
| TSC-004 | Liberar rascunho | INV-TR-004 |
| TSC-005 | Concluir sem execução | INV-TR-006 |
| TSC-006 | Dupla liberação | INV-TR-010 |

### Repetição / idempotência

| ID | Cenário | Comportamento esperado |
| --- | --- | --- |
| TSC-007 | Segundo CMD-005 mesma OS | Rejeição REJ-002 |
| TSC-008 | Segundo CMD-020 mesma chave | Idempotência — sem duplicata |
| TSC-009 | CMD-009 progresso repetido | UNIQUE_BUSINESS_OPERATION |

### Concorrência

| ID | Cenário | Comportamento esperado |
| --- | --- | --- |
| TSC-010 | Dois CMD-008 simultâneos | Um sucesso, outro REJ-004 |
| TSC-011 | Duas alocações mesmo recurso | DE-008 ou REJ-005 |

### Ator sem autorização

| ID | Cenário | Rejeição |
| --- | --- | --- |
| TSC-012 | Liberar sem alçada | REJ-003, REJ-011 |
| TSC-013 | Registrar pagamento não autorizado | GUARD-019 |

### Guarda não atendida

| ID | Cenário | Guarda |
| --- | --- | --- |
| TSC-014 | Medição sem OS concluída | GUARD-015 |
| TSC-015 | Faturamento sem medição | GUARD-016 |

### Cancelamento

| ID | Cenário | Notas |
| --- | --- | --- |
| TSC-016 | Cancelar OS em execução | TR-CAND-011, efeitos XLC-012 |
| TSC-017 | Cancelar solicitação com OS | INV-TR-002 / compensação |

### Reabertura

| ID | Cenário | Notas |
| --- | --- | --- |
| TSC-018 | Reabrir OS concluída | DDP-005 — expectativa indefinida até decisão |

### Efeito externo falho

| ID | Cenário | Notas |
| --- | --- | --- |
| TSC-019 | Notificação FALHOU após ENVIADA | SDD-006 retry |
| TSC-020 | Integração referência comercial falha | DE-020 não bloqueia OS local |

### Histórico preservado

| ID | Cenário | Notas |
| --- | --- | --- |
| TSC-021 | Alterar OS liberada | TR-CAND-015, DOMAIN_HISTORY |
| TSC-022 | Substituir documento | DE-019, versão anterior preservada |
