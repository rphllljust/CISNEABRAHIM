# Risk register

| Campo | Valor |
| --- | --- |
| Document ID | RISK-REG-001 |
| Source of identification | SRC-000 (riscos iniciais de engenharia/domínio — **ainda não ocorreram**) |
| Note | Probabilidade `UNKNOWN` na ausência de evidência empírica |

Status: `OPEN`, `MITIGATING`, `ACCEPTED`, `CLOSED`, `SUPERSEDED`.

Template: [`../templates/risk-template.md`](../templates/risk-template.md).

Impacto qualitativo preliminar (`HIGH`/`MEDIUM`/`LOW`) é julgamento de engenharia, **não** medição.

## RISK-001 — Regra inventada

| Campo | Valor |
| --- | --- |
| Title | Implementar ou documentar regra operacional como se fosse do cliente |
| Probability | `UNKNOWN` |
| Impact (engineering judgment) | HIGH |
| Status | `OPEN` |
| Nearby controls | DoR; status `CANDIDATE`; SRC-000 não prova regra operacional |

## RISK-002 — Escopo incorreto

| Campo | Valor |
| --- | --- |
| Title | Tratar contexto preliminar como MVP/contratado |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Nearby controls | scope-register; carta `DISCOVERY_NOT_STARTED` |

## RISK-003 — Lost update

| Campo | Valor |
| --- | --- |
| Title | Atualização concorrente perde estado autorizado |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Nearby controls | EP-005; DoR concorrência; ainda sem implementação |

## RISK-004 — Duplicidade

| Campo | Valor |
| --- | --- |
| Title | OS, medição, fatura ou pagamento duplicados por reenvio |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Nearby controls | EP-006 |

## RISK-005 — Cobrança sem origem

| Campo | Valor |
| --- | --- |
| Title | Faturar ou cobrar sem vínculo rastreável a medição/contrato/PO (quando esses vínculos forem exigidos) |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |

## RISK-006 — Dupla alocação

| Campo | Valor |
| --- | --- |
| Title | Mesmo veículo, equipamento ou pessoa alocado em conflitos de tempo/uso |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |

## RISK-007 — Acesso indevido

| Campo | Valor |
| --- | --- |
| Title | Leitura ou alteração por ator não autorizado no contexto |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Nearby controls | EP-002, EP-003; DDP-015 aberto |

## RISK-008 — Perda documental

| Campo | Valor |
| --- | --- |
| Title | Perda de arquivo, versão ou documento lógico |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |

## RISK-009 — PO excedido

| Campo | Valor |
| --- | --- |
| Title | Consumo acima do PO sem controle (se PO for aplicável) |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Nearby controls | DDP-009 aberto; não assumir que PO sempre existe |

## RISK-010 — Integração inconsistente

| Campo | Valor |
| --- | --- |
| Title | Sistemas divergem e o local declara sucesso indevido |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Nearby controls | EP-018; DDP-014, DDP-020 |

## RISK-011 — Backup não restaurável

| Campo | Valor |
| --- | --- |
| Title | Backup existe mas restore não foi testado ou falha |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Nearby controls | EP-020 |

## RISK-012 — Requisito fiscal inventado

| Campo | Valor |
| --- | --- |
| Title | Implementar CFOP, imposto, NF-e ou obrigação sem fonte jurídica/fiscal |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Nearby controls | fontes `NOT_PROVIDED`; proibição SRC-000 |

## RISK-013 — Permissão excessiva

| Campo | Valor |
| --- | --- |
| Title | Papéis amplos demais (admin universal) |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |

## RISK-014 — Migração destrutiva

| Campo | Valor |
| --- | --- |
| Title | Migration irreversível com perda de dados |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Nearby controls | EP-019; ainda sem migrations |

## RISK-015 — Segredo exposto

| Campo | Valor |
| --- | --- |
| Title | Credencial, `.env` ou chave no Git ou logs |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Nearby controls | `.gitignore`; change-governance |

## RISK-016 — Upload malicioso

| Campo | Valor |
| --- | --- |
| Title | Arquivo enviado como documento operacional com conteúdo nocivo |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Nearby controls | inputs/ README (não executar binários); implementação futura TBD |

## RISK-017 — Over-trust em fonte reconstruída

| Campo | Valor |
| --- | --- |
| Title | Promover afirmações de SRC-001 a regras CONFIRMED sem validação cruzada |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Source | SRC-001 EV-084 |
| Nearby controls | status CANDIDATE; source-gaps-and-requests |

## RISK-018 — WhatsApp como Source of Truth

| Campo | Valor |
| --- | --- |
| Title | Tratar conversa de WhatsApp como registro autoritativo de solicitação ou OS |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Source | SRC-001 EV-027, EV-033 |
| Nearby controls | DDP-021, DDP-033 |

## RISK-019 — Conflação de quantidades

| Campo | Valor |
| --- | --- |
| Title | Usar propriedade única `quantity` para fases ITEM_PLANNED…ITEM_PAID |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Source | SRC-001 EV-065 |
| Nearby controls | BR-010; quantity-semantics.md |

## RISK-020 — Margem e custo expostos indevidamente

| Campo | Valor |
| --- | --- |
| Title | Exibir custo interno ou margem a atores não autorizados |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Source | SRC-001 EV-060 |
| Nearby controls | DDP-030, DDP-015 |

## RISK-021 — Escopo de locação antecipado

| Campo | Valor |
| --- | --- |
| Title | Implementar vertical de locação como escopo confirmado só por prioridade candidata |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Source | SRC-001 EV-080, EV-082 |
| Nearby controls | BR-020, DDP-026, scope-register |

## RISK-022 — Confusão rascunho/liberação

| Campo | Valor |
| --- | --- |
| Title | Mesma pessoa ou fluxo confunde rascunho com OS liberada ou solicitação com autorização |
| Probability | `UNKNOWN` |
| Impact | HIGH |
| Status | `OPEN` |
| Source | SRC-001 EV-041, EV-042, EV-043 |
| Nearby controls | BR-007, BR-025, DDP-022 |

## Próximo ID

`RISK-023`.
