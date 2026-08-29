# UL-METHOD-002

| Campo | Valor |
| --- | --- |
| Document ID | Método de linguagem ubíqua |
| Fonte | SRC-001, SRC-000 |
| Prompt | 04 (revisão estrutural) |
| Supersedes | `glossary-method.md` (histórico preservado no Git) |

## Princípios

1. **Proveniência:** cada termo aponta para fonte (SRC-001) e evidência (EV-*).
2. **Fronteira semântica:** definição precisa, exemplos válidos e contraexemplos explícitos.
3. **Sem dicionário genérico:** definições de uso comum não substituem fonte.
4. **Candidato, não confirmado:** `ACCEPTED_FOR_DOCUMENTATION` **não** significa regra empresarial confirmada.
5. **Negócio ≠ técnico:** termos de engenharia em arquivo separado ([technical-versus-domain-language.md](./technical-versus-domain-language.md)).
6. **Estado ≠ evento ≠ comando:** classificar antes de modelar (Prompt 07).

## Identificador

`TERM-NNN` — imutável após criação.

## Status de termo

| Status | Significado |
| --- | --- |
| CANDIDATE | Uso preliminar; campos incompletos ou baixa confiança |
| PENDING_SOURCE_VALIDATION | Aguarda fonte primária ou evidência adicional |
| PENDING_BUSINESS_DECISION | Aguarda decisão empresarial (DDP) |
| ACCEPTED_FOR_DOCUMENTATION | Termo documentado para uso em artefatos; **não** confirmado |
| AMBIGUOUS | Colisão ou múltiplos significados; não resolver sem fonte |
| REJECTED | Termo descartado para documentação futura |
| SUPERSEDED | Substituído por outro TERM-* |

**Proibido nesta fase:** promover termo a regra confirmada sem fonte primária.

## Classes semânticas

`BUSINESS_ENTITY` · `VALUE_CONCEPT` · `BUSINESS_ACTOR` · `BUSINESS_ROLE` · `COMMAND_VERB` · `DOMAIN_EVENT` · `DOMAIN_STATE` · `TIMESTAMP` · `METRIC` · `DOCUMENT` · `EXTERNAL_IDENTIFIER` · `TECHNICAL_TERM` · `UNKNOWN`

Não forçar classificação quando a fonte não permitir — usar `UNKNOWN` e DDP.

## Nível de confiança

`HIGH` (citação direta em SRC-001) · `MEDIUM` (consolidação Prompt 01–03) · `LOW` (inferência mínima com EV)

## Campos obrigatórios por termo

Termo preferencial candidato; definição precisa; fonte e evidências; domínio de uso; exemplos válidos; contraexemplos; sinônimos; termos proibidos ou desaconselhados; possíveis homônimos; relação com BR, FR, UC, NFR e DDP; classe semântica; confiança; status.

## Proibições

- Inventar definição empresarial definitiva.
- Resolver ambiguidade sem fonte ou decisão.
- Criar entidade, aggregate, enum, schema, classe ou bounded context.
- Traduzir termo preferencial automaticamente para nome de código.
- Confundir estado, evento, comando e atributo.

## Catálogos complementares

- Verbos: [business-verbs-catalog.md](./business-verbs-catalog.md)
- Substantivos: [business-nouns-catalog.md](./business-nouns-catalog.md)
- Termos desaconselhados: [naming-policy.md](./naming-policy.md)
