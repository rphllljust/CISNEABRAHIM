# UL-NAMING-001

| Campo | Valor |
| --- | --- |
| Document ID | Convenções de nomenclatura candidatas |
| Prompt | 04 |
| Status | CANDIDATE — **não** congela API |

> Nomes em inglês abaixo são **candidatos** herdados de Prompt 01. Não são termos preferenciais do glossário.

## Prefixos de identificador (já em uso — preservados)

| Prefixo | Domínio |
| --- | --- |
| FR- | Requisito funcional |
| NFR- | Requisito não funcional |
| TERM- | Termo de glossário |
| EV- | Evidência atômica |
| BR- | Regra de negócio candidata |
| DDP- | Decisão pendente |
| UC- / AC- | Caso de uso / critério de aceite |

## Candidatos de comando (referência apenas)

Ver [`../02-source-analysis/command-candidates.md`](../02-source-analysis/command-candidates.md). Ex.: `ReleaseServiceOrder` — **não** promover a nome de API.

## Candidatos de evento (referência apenas)

Ver [`../02-source-analysis/domain-event-candidates.md`](../02-source-analysis/domain-event-candidates.md).

## Convenções textuais empresariais

| Regra | Exemplo |
| --- | --- |
| Primeira menção: termo + TERM-ID opcional em docs formais | Ordem de Serviço (OS) |
| Siglas OS e PO sempre disambiguadas | Não usar "ordem" sozinho |
| Português preferencial em definições | Rascunho de OS, não Draft |
| Verbos no infinitivo em FRs | Registrar, Liberar, Converter |

## Proibição

Não criar nomes de tabela, coluna, classe ou endpoint neste prompt.
