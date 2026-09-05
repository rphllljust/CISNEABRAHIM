# Source conflicts

| Campo                | Valor      |
| -------------------- | ---------- |
| Document ID          | SC-REG-001 |
| Conflicts registered | **1** (`SC-001` `RESOLVED`) |

## Instruções

Usar [`../templates/source-conflict-template.md`](../templates/source-conflict-template.md).

Identificadores: `SC-001`, `SC-002`, …

Enquanto houver apenas SRC-000 e SRC-001 sem contradição documentada, não há segundo polo para conflito operacional.

**Prompt 01 (2026-08-28):** Análise de 84 evidências de SRC-001 — **nenhum conflito** identificado entre SRC-000 e SRC-001 nem internamente em SRC-001.

Não fabricar conflito fictício.

**2026-09-03 (SRC-003):** razão social com sufixo `EPP` vs SRC-002 sem sufixo **não** abre `SC-*`. Mesmo CNPJ; `EPP` é porte declarado, não identidade distinta nem regime tributário confirmado.

**2026-09-03 (SRC-004):** abre `SC-001` e resolve no mesmo registro — “ERP opcional futuro” (SRC-002 Q04) vs “não vou conectar um ERP / sistema centralizado” (SRC-004).

**2026-09-03 (SRC-005/SRC-006):** nenhum novo conflito. O extrato federal e a consulta estadual coincidem em CNPJ, endereço, contato e CNAEs. Abertura federal em 05/05/2010 e início estadual em 14/10/2013 são campos distintos. `RONDÃ”NIA` e `-DOS FARRAPOS` em SRC-006 são anomalias de renderização/truncamento resolvidas pelo próprio endereço de correspondência e por SRC-005.

**2026-09-03 (SRC-007):** nenhum novo conflito. A regra de transmissão `BLOCKED` sem credenciamento aprovado complementa o snapshot SRC-006 (`NÃO CREDENCIADO`). Não inverte o fato temporal nem autoriza gateway.

**2026-09-03 (SRC-008):** nenhum novo conflito. Complementa SRC-002 (capabilities, sem hardcode de nomes) e SRC-007 (emissão fiscal desacoplada). Não abre `SC-*`.

## Registro

### SC-001

| Campo | Valor |
| ----- | ----- |
| ID | SC-001 |
| Title | Conexão futura com ERP vs sistema CISNE centralizado sem ERP |
| SOURCE-ID A | SRC-002 |
| Claim A + localizador | Q04 / §19 — SoT híbrido; ERP opcional futuro via `externalErpId` |
| SOURCE-ID B | SRC-004 |
| Claim B + localizador | Texto verbatim — não haverá conexão com ERP; o sistema CISNE será todo centralizado |
| Status | `RESOLVED` |
| Date opened | 2026-09-03 |
| Date resolved | 2026-09-03 |
| Impacted BR / DDP / FR | BR-030 permanece; BR-031 permanece (defensivo); BR-042 `CONFIRMED`; DDP-014 recorte ERP; DDP-020 |
| Resolution | Polo B prevalece. A parte “conexão / ERP opcional futuro” de SRC-002 Q04 fica substituída. CISNE permanece autoridade da identidade operacional (BR-030). `externalErpId` nunca é PK (BR-031). |
| Authority that resolved | Responsável pelo projeto (mesma autoridade de SRC-002), via SRC-004 |

Próximo ID: `SC-002`.
