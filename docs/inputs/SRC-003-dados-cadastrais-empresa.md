# SRC-003 — Dados cadastrais da empresa operadora

## 1. Identificação da fonte

| Campo | Valor |
| ----- | ----- |
| SOURCE-ID | SRC-003 |
| Título | Dados cadastrais da empresa operadora |
| Tipo | Declaração cadastral do responsável pelo projeto |
| Origem | Texto colado pelo responsável no chat de engenharia |
| Empresa relacionada | Cisne Rondônia Comércio e Serviços LTDA |
| Data de recebimento | 2026-09-03 |
| Received at | 2026-09-03T01:08:00-04:00 |
| Location | `docs/inputs/SRC-003-dados-cadastrais-empresa.md` |
| Confiabilidade | Média |
| Status | `REGISTERED` · fatos cadastrais `CORROBORATED_BY_SRC-005_SRC-006` |
| Classification | `SPONSOR_DECLARED_CADASTRE` |
| Integrity | Declaração original sem hash; conteúdo posteriormente confrontado com SRC-005 e SRC-006, cujos PDFs recebidos têm SHA-256 registrado |
| Personal / sensitive data | **Sim** — e-mail e telefone comerciais informados |
| Pode confirmar regra operacional isoladamente? | **Não** |
| Precisa ser confrontada com documentos reais? | **Atendido parcialmente** por SRC-005 (RFB) e SRC-006 (SEFIN); contrato social/QSA permanece não fornecido |
| Substitui fontes primárias? | **Não** |

## 2. Advertência

Este arquivo registra o texto entregue pelo responsável. Ele próprio não é extrato da Receita Federal, certificado digital nem autorização de emissão fiscal. Em 03/09/2026, os fatos cadastrais foram confrontados com SRC-005 e SRC-006; o histórico desta origem declaratória permanece preservado.

Ele **não** substitui:

- contrato social / QSA;
- inscrição municipal;
- certificado A1/A3;
- credenciais SEFAZ / prefeitura;
- Documento Mestre;
- requisitos fiscais (`NOT_PROVIDED` no registro de fontes).

Nenhuma alíquota, CFOP, NCM, ISS, ICMS, retenção ou tipo legal NF-e/NFS-e é confirmada por esta fonte.

## 3. Texto recebido (verbatim)

```text
Dados Cadastrais da Empresa
Razão Social: Cisne Rondônia Comércio e Serviços LTDA - EPP
CNPJ: 11.897.171/0001-81
Situação Cadastral: Ativa
Data de Abertura: 05/05/2010
Localização: Porto Velho - RO
E-mail registrado: cisneltda@hotmail.com
Telefone registrado: (69) 9976-7888
```

## 4. Fatos extraídos

| Campo | Valor informado | Classificação | Confrontação |
| ----- | --------------- | ------------- | ------------ |
| Razão social | Cisne Rondônia Comércio e Serviços LTDA - EPP | Fato empresarial declarado | SRC-002 registra a mesma operadora sem o sufixo `EPP` (ver seção 5) |
| CNPJ | 11.897.171/0001-81 | Fato empresarial declarado | Confirma SRC-002 (operadora; **não** Client) |
| Situação cadastral | Ativa | Fato declarado | Corroborado por SRC-005, páginas 1–3 |
| Data de abertura | 05/05/2010 | Fato declarado | Corroborado por SRC-005, páginas 1–3 |
| Localização | Porto Velho - RO | Fato empresarial declarado | Confirma SRC-001 EV-001 / SRC-000 (sede Porto Velho, Rondônia) |
| E-mail | cisneltda@hotmail.com | Fato declarado + PII comercial | Corroborado por SRC-005/SRC-006; DDP-019 permanece `OPEN` |
| Telefone | (69) 9976-7888 | Fato declarado + PII comercial | Corroborado por SRC-005/SRC-006; DDP-019 permanece `OPEN` |

O CNPJ informado normaliza para `11897171000181` (14 dígitos). Interpretação de engenharia: é o mesmo identificador já usado como emitente interno de faturamento, não como Client.

## 5. Relação com SRC-002 (não é conflito)

| Fonte | Razão social registrada |
| ----- | ----------------------- |
| SRC-002 | CISNE RONDÔNIA COMÉRCIO E SERVIÇOS LTDA |
| SRC-003 | Cisne Rondônia Comércio e Serviços LTDA - EPP |

Não abre `SC-*`. O CNPJ é idêntico. O sufixo `EPP` é declarado nesta fonte como qualificador de porte; **não** foi tratado como razão social distinta nem como confirmação de regime tributário (Simples Nacional, Lucro Presumido ou outro).

SRC-005 registra o nome empresarial sem acentos e confirma `EPP` como porte, não como sufixo necessário da razão social. O nome operacional canônico de SRC-002 permanece para apresentação; qualquer exigência de reprodução legal literal deve usar o cadastro aplicável e passar por validação fiscal/jurídica.

## 6. O que esta fonte **não** autoriza

- go-live / `PRODUCTION READINESS = GO`;
- exit do piloto (`EXIT_READY`);
- ligar `FEATURE_MODULE_FISCAL`;
- implementar adapter SEFAZ / prefeitura;
- emitir NF-e, NFS-e ou qualquer documento fiscal oficial;
- inventar inscrição estadual, inscrição municipal, CNAE, IE, IM ou alíquota;
- cadastrar a operadora como Client.

## 7. Artefatos ainda ausentes para emissão oficial

Status uniforme: `NOT_PROVIDED` (sem SOURCE-ID).

| Artefato | Status |
| -------- | ------ |
| Consulta RFB fornecida | `ANALYZED` — SRC-005; cópia sem reconsulta on-line |
| Inscrição estadual | `PROVIDED_IN_SNAPSHOT` — SRC-006: 00000003050866 |
| Inscrição municipal | `NOT_PROVIDED` |
| CNAE | `PROVIDED_IN_SNAPSHOTS` — SRC-005/SRC-006; não equivale a código municipal de serviço |
| Regime cadastral estadual | `PROVIDED_IN_SNAPSHOT` — SRC-006: 017-SIMPLES NACIONAL; sem regras de cálculo |
| Código municipal de serviço / regras tributárias | `NOT_PROVIDED` |
| Certificado A1/A3 | `NOT_PROVIDED` |
| Credencial / convênio SEFAZ ou prefeitura | `NOT_PROVIDED` |
| Tipo legal do documento (NF-e vs NFS-e) | `OPEN` (DDP-023) |
