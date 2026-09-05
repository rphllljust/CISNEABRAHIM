# SRC-006 — Consulta pública à REDESIM de Rondônia (SEFIN/CRE)

## 1. Identificação da fonte

| Campo | Valor |
| ----- | ----- |
| SOURCE-ID | SRC-006 |
| Título | Consulta Pública à REDESIM de Rondônia |
| Tipo | `PUBLIC_STATE_TAX_REGISTRY_EXTRACT_COPY` |
| Origem declarada no documento | SEFIN/CRE — Portal do Contribuinte / SINTEGRA |
| Entregue por | Responsável pelo projeto, como arquivo PDF local |
| Empresa relacionada | CISNE RONDÔNIA COMÉRCIO E SERVIÇOS LTDA |
| Data de recebimento | 2026-09-03 |
| Received at | 2026-09-03T01:46:52-04:00 |
| Location | `docs/inputs/SRC-006-consulta-publica-sefin-redesim.md` (registro e transcrição controlada) |
| Nome do original | `Bem vindo ao Portal de Informações - SEFIN_CRE.pdf` |
| Custódia do original | Arquivo fornecido fora do repositório; não copiado enquanto DDP-019 permanecer `OPEN` |
| Integridade | SHA-256 `BFF474E552B92289679E2D80641C60CDB174CA9770AEFD5A5486B864D10A8F30`; 122324 bytes; 2 páginas |
| Consulta declarada | 03/09/2026; impressão às 01:18 (America/Cuiaba) |
| Status | `ANALYZED` |
| Confiabilidade | Alta para o snapshot cadastral exibido; autenticidade não reconsultada on-line |
| Personal / sensitive data | **Sim** — contato comercial e identificação contábil mascarada; retenção permanece `OPEN` (DDP-019) |
| Pode confirmar regra operacional isoladamente? | **Não** — confirma fatos cadastrais estaduais e status temporal; não contém requisitos de emissão |

## 2. Fatos cadastrais extraídos

| Localizador | Campo | Valor exibido | Classificação |
| ----------- | ----- | ------------- | ------------- |
| página 1, Identificação | CNPJ | 11.897.171/0001-81 | Fato cadastral estadual no extrato fornecido |
| página 1, Identificação | Inscrição estadual | 00000003050866 | Fato cadastral estadual no extrato fornecido |
| página 1, Identificação | NIRE | 11200541730 | Fato cadastral estadual no extrato fornecido |
| página 1, Endereço de correspondência | Endereço | RUA DOS FARRAPOS, 5000, SAO FRANCISCO, PORTO VELHO/RO, CEP 76813284 | Fato cadastral estadual no extrato fornecido |
| página 1, Informações complementares | Regime de pagamento | 017 — SIMPLES NACIONAL | Snapshot cadastral; não fornece regras de cálculo |
| página 1, Informações complementares | Situação cadastral vigente | HABILITADO desde 29/07/2025 | Snapshot cadastral estadual |
| página 1, Informações complementares | Situação do contribuinte | ATIVO | Snapshot cadastral estadual |
| página 1, Informações complementares | Data de início da atividade | 14/10/2013 | Data estadual; não conflita com abertura federal em 05/05/2010 |
| página 1, Informações complementares | CNAE principal | 4619200 | Mesmo CNAE 46.19-2-00 de SRC-005 |
| página 1, Informações complementares | Usuário de PED | Não | Fato exibido no snapshot |
| página 1, Informações complementares | Regime de apuração do ICMS | Documentos fiscais emitidos não geram crédito ao destinatário | Texto cadastral do portal; não convertido em regra do motor tributário |
| página 1, Informações complementares | Situação da NF-e | NÃO CREDENCIADO | Fato temporal; impede presumir credenciamento NF-e |
| páginas 1–2 | Atividades secundárias | 48 CNAEs, coincidentes com SRC-005 | Classificações CNAE; não definem escopo de produto |

## 3. Qualidade e reconciliação

- A razão social aparece visualmente como `CISNE RONDÃ”NIA COMERCIO E SERVICOS LTDA`, artefato de codificação do PDF. CNPJ e SRC-005 identificam a mesma pessoa jurídica; isso não abre conflito de fonte.
- O campo principal de logradouro aparece truncado como `-DOS FARRAPOS`. O endereço de correspondência na mesma página e SRC-005 registram `RUA/R DOS FARRAPOS, 5000`; isso é tratado como defeito de apresentação, não divergência empresarial.
- Abertura federal em 05/05/2010 (SRC-005) e início estadual em 14/10/2013 (SRC-006) são conceitos distintos.
- Campos municipais/licenças vazios não comprovam ausência de inscrição, alvará ou licença.

## 4. Limites da evidência

- `NÃO CREDENCIADO` refere-se à NF-e no snapshot estadual. Não prova a situação de NFS-e municipal ou de todos os documentos fiscais. SRC-007 / BR-043 aplicam este snapshot: transmissão de NF-e permanece `BLOCKED` até credenciamento aprovado e revalidado.
- O documento não fornece certificado A1/A3, CSC, credencial, endpoint, convênio, série, ambiente, alíquota, CFOP, NCM, código de serviço, retenções ou requisitos jurídicos de emissão.
- O status cadastral pode mudar depois da consulta; produção deve validar novamente no processo de credenciamento fiscal, se autorizado.
- Não autoriza ativar o gateway fiscal, `FEATURE_MODULE_FISCAL`, exit do piloto ou go-live.

