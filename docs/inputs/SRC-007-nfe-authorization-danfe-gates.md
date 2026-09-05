# SRC-007 — Gates de transmissão NF-e, autorização SEFAZ e legendas DANFE

## 1. Identificação da fonte

| Campo | Valor |
| ----- | ----- |
| SOURCE-ID | SRC-007 |
| Título | Gates de credenciamento, protocolo SEFAZ e legendas de validade fiscal |
| Tipo | Declaração empresarial do responsável pelo projeto |
| Origem | Observação do responsável no chat de engenharia |
| Empresa relacionada | CISNE RONDÔNIA COMÉRCIO E SERVIÇOS LTDA |
| Data de recebimento | 2026-09-03 |
| Received at | 2026-09-03T01:51:00-04:00 |
| Location | `docs/inputs/SRC-007-nfe-authorization-danfe-gates.md` |
| Confiabilidade | Alta para o recorte declarado (mesmo responsável que aprovou SRC-002) |
| Status | `REGISTERED` |
| Classification | `SPONSOR_DECLARED_FISCAL_POLICY` / `BUSINESS_DECISION` |
| Integrity | Texto digitado no chat; sem documento formal anexo |
| Personal / sensitive data | Não |
| Pode confirmar regra operacional isoladamente? | **Sim** — somente os gates de transmissão, autorização e legendas |
| Precisa ser confrontada com documentos reais? | Sim para credenciamento vigente e protocolo oficial; não substitui extrato SEFIN, certificado nem legislação tributária |
| Substitui fontes primárias? | **Não** |

## 2. Advertência

Este arquivo registra a declaração do responsável. Não é credenciamento, não é protocolo da SEFAZ, não é certificado digital e não autoriza go-live.

Ele **não** decide, sozinho:

- alíquota, CFOP, NCM, código de serviço, ISS, ICMS ou retenções;
- tipo legal NF-e vs NFS-e (DDP-023 residual permanece);
- ativação de `FEATURE_MODULE_FISCAL` em produção;
- endpoint, CSC, certificado A1/A3 ou credencial de transmissão;
- situação de NFS-e municipal;
- exit do piloto (`PILOT_OBSERVATION_WINDOW_NOT_COMPLETED`).

SRC-006 (consulta SEFIN de 03/09/2026) registra NF-e `NÃO CREDENCIADO`. Aplicar esta fonte **não** inverte esse fato temporal.

## 3. Texto recebido (verbatim)

```text
if (!credentialing.approved) {
    NF-e transmission = BLOCKED
}

if (!sefazAuthorizationProtocol) {
    fiscalStatus != AUTHORIZED
    DANFE_OFICIAL = BLOCKED
}

DRAFT:
"SEM VALIDADE FISCAL"

HOMOLOGAÇÃO:
"AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL"

PRODUÇÃO:
somente após autorização oficial
```

## 4. Fatos / decisões extraídos

| Campo | Valor informado | Classificação |
| ----- | --------------- | ------------- |
| Transmissão de NF-e sem credenciamento aprovado | `BLOCKED` | Decisão empresarial / regra operacional |
| `fiscalStatus` sem protocolo de autorização SEFAZ | não pode ser `AUTHORIZED` | Decisão empresarial / regra operacional |
| DANFE oficial sem protocolo de autorização SEFAZ | `BLOCKED` | Decisão empresarial / regra operacional |
| Legenda de rascunho | `SEM VALIDADE FISCAL` | Decisão empresarial / regra operacional |
| Legenda de homologação | `AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL` | Decisão empresarial / regra operacional |
| Documento oficial em produção | somente após autorização oficial | Decisão empresarial / regra operacional |

## 5. Relação com SRC-006 e DDP-023

| Fonte | Claim |
| ----- | ----- |
| SRC-006, página 1 (03/09/2026) | Situação da NF-e `NÃO CREDENCIADO` |
| SRC-007 (2026-09-03) | Sem credenciamento aprovado, transmissão de NF-e = `BLOCKED` |

Não abre `SC-*`. O snapshot estadual e a regra de gate são complementares: o fato temporal de SRC-006 implica, por SRC-007, que a transmissão permanece bloqueada até credenciamento aprovado e revalidado.

DDP-023 permanece `PARTIALLY_ANSWERED`. Este recorte confirma os gates de validade fiscal. Tributação substantiva, tipo legal NF-e/NFS-e, certificado e credenciais continuam `OPEN`.

## 6. O que esta fonte **não** autoriza

- Ligar `FEATURE_MODULE_FISCAL` em produção ou o gateway SEFAZ/prefeitura.
- Tratar rascunho, preview, DANFE de homologação ou `BillingDocument` interno como documento fiscal autorizado.
- Inventar alíquota, CFOP, NCM, ISS, ICMS, série, ambiente oficial ou credencial.
- Marcar `fiscalStatus = AUTHORIZED` sem protocolo de autorização da SEFAZ.
- Encerrar a janela do piloto ou o gate de produção.
- Inferir a situação de NFS-e a partir desta declaração.

## 7. Decisões de domínio afetadas

| ID | Efeito |
| -- | ------ |
| DDP-023 | Gates de credenciamento, protocolo e legendas `CONFIRMED` neste recorte. Residual tributário e tipo legal permanecem `OPEN`. |
| RISK-025 | Controle próximo reforçado: transmissão bloqueada sem credenciamento aprovado. Risco permanece `OPEN` enquanto SRC-006 for `NÃO CREDENCIADO`. |
