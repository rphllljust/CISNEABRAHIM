# SRC-004 — Sistema centralizado; sem conexão com ERP

## 1. Identificação da fonte

| Campo | Valor |
| ----- | ----- |
| SOURCE-ID | SRC-004 |
| Título | Sistema empresarial centralizado; rejeição de conexão com ERP |
| Tipo | Declaração empresarial do responsável pelo projeto |
| Origem | Observação do responsável no chat de engenharia |
| Empresa relacionada | CISNE RONDÔNIA COMÉRCIO E SERVIÇOS LTDA |
| Data de recebimento | 2026-09-03 |
| Received at | 2026-09-03T01:14:00-04:00 |
| Location | `docs/inputs/SRC-004-sistema-centralizado-sem-erp.md` |
| Confiabilidade | Alta para o recorte declarado (mesmo responsável que aprovou SRC-002) |
| Status | `REGISTERED` |
| Classification | `SPONSOR_DECLARED_ARCHITECTURE` / `BUSINESS_DECISION` |
| Integrity | Texto digitado no chat; sem documento formal anexo |
| Personal / sensitive data | Não |
| Pode confirmar regra operacional isoladamente? | **Sim** — somente o recorte sem conexão ERP e sistema centralizado |
| Precisa ser confrontada com documentos reais? | Não para este recorte; não substitui Documento Mestre nem requisitos fiscais |
| Substitui fontes primárias? | **Não** |

## 2. Advertência

Este arquivo registra a declaração do responsável. Não é contrato de integração, não é Documento Mestre e não autoriza go-live.

Ele **não** decide, sozinho:

- emissão oficial NF-e/NFS-e nem gateway SEFAZ/prefeitura (DDP-023 residual permanece);
- rastreamento de frota;
- conciliação bancária / Open Banking;
- canal WhatsApp (DDP-021);
- quais módulos nativos entram em cada release;
- exit do piloto (`PILOT_OBSERVATION_WINDOW_NOT_COMPLETED`).

SEFAZ, prefeitura, banco e rastreador **não** são ERP. Ausência de ERP não implica ausência desses canais.

## 3. Texto recebido (verbatim)

```text
observação: eu não vou conectar um erp e sim esse sistem a aqui vai ser todo centralizado
```

Ortografia do original preservada (`sistem a`). Interpretação de engenharia do recorte: sistema aqui = SISTEMA CISNE RONDÔNIA.

## 4. Fatos extraídos

| Campo | Valor informado | Classificação |
| ----- | --------------- | ------------- |
| Conexão com ERP externo | Não haverá | Fato empresarial / decisão |
| Papel do SISTEMA CISNE RONDÔNIA | Sistema empresarial centralizado (SoT interno único) | Fato empresarial / decisão |

## 5. Relação com SRC-002 e DDP-020

| Fonte | Claim |
| ----- | ----- |
| SRC-002 Q04 (2026-08-29) | SoT híbrido: CISNE master operacional; ERP opcional futuro via `externalErpId` |
| Realinhamento 2026-09-01 (DDP-020) | CISNE = sistema principal; ERP externo não é autoridade necessária |
| SRC-004 (2026-09-03) | Não haverá conexão com ERP; o sistema CISNE será todo centralizado |

Abre `SC-001` (resolvido): a parte ERP opcional futuro / conexão de SRC-002 Q04 fica **substituída** por SRC-004. Permanecem vigentes:

- BR-030 — CISNE é autoridade da identidade operacional interna do Cliente;
- BR-031 — `externalErpId` (ou equivalente) nunca é PK interna;
- BR-026 — módulo Clientes do Release 1 não é CRM/ERP.

`externalErpId` permanece campo defensivo opcional, sem uso como pré-requisito de cadastro.

## 6. O que esta fonte **não** autoriza

- Ligar adapter/ACL de ERP, sync ou importação de ERP.
- Tratar módulos nativos (FINANCE, FISCAL, ACCOUNTING, INVENTORY, PAYROLL) como já liberados em produção.
- Inventar alíquota, CFOP, NCM, ISS, ICMS ou tipo legal de nota.
- Encerrar a janela do piloto ou o gate de produção.
- Remover código de ACL já existente sem prompt específico — adapters podem permanecer desligados.

## 7. Decisões de domínio afetadas

| ID | Efeito |
| -- | ------ |
| DDP-014 | Recorte ERP = `ANSWERED` (`REJECTED` conexão). Demais integrações permanecem `OPEN`. |
| DDP-020 | Evidência empresarial do SoT centralizado no CISNE; reforça o realinhamento 2026-09-01. |
| DDP-023 | **Não** fecha residual fiscal. Integração ERP deixa de ser opção; SEFAZ/prefeitura não são ERP. |
