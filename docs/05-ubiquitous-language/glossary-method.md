# UL-METHOD-001

| Campo | Valor |
| --- | --- |
| Document ID | Método do glossário |
| Fonte | SRC-001, SRC-000 |
| Prompt | 04 |

## Princípios

1. **Proveniência:** cada termo aponta para fonte (SRC-001) e evidência (EV-*).
2. **Fronteira semântica:** `significado empresarial` e `significado excluído` explícitos.
3. **Sem dicionário genérico:** definições de uso comum não substituem fonte.
4. **Candidato, não confirmado:** status `CANDIDATE` ou `PENDING_VALIDATION` até fonte primária.
5. **Negócio ≠ técnico:** termos de engenharia (log, sessão, API) em arquivo separado.

## Identificador

`TERM-NNN` — imutável após criação. Não renomear IDs históricos.

## Status de termo

| Status | Significado |
| --- | --- |
| CANDIDATE | Uso preliminar suportado por SRC-001 |
| PENDING_VALIDATION | Aguarda validação empresarial |
| PENDING_DISAMBIGUATION | Ambiguidade registrada; DDP aberto |
| CONFIRMED | **Proibido** nesta fase sem fonte primária |
| DEPRECATED | Substituído por outro termo (com referência) |
| PROHIBITED | Não usar em documentação futura |

## Nível de confiança

`HIGH` (citação direta em SRC-001) · `MEDIUM` (consolidação Prompt 01–03) · `LOW` (inferência mínima com EV)

## Campos obrigatórios por termo

Term ID, termo preferencial, definição candidata, significado empresarial, significado excluído, contexto, fontes, evidências, BRs, FRs, atores, sinônimos, aliases, termos confundidos, exemplos válidos, exemplos inválidos, status, confiança, DDPs relacionados.

## Proibições

- Inventar definição empresarial.
- Resolver ambiguidade sem fonte ou decisão.
- Criar enums, classes, tabelas ou nomes de API definitivos.
- Traduzir termo preferencial para inglês.
