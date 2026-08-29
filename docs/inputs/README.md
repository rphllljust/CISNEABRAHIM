# Área segura de fontes empresariais (`docs/inputs/`)

Esta pasta destina-se **apenas** a originais, exportações e cópias de trabalho fornecidas pela empresa.

## Estado atual

Nenhuma fonte empresarial foi depositada. Os tipos esperados estão em [`../01-foundation/source-registry.md`](../01-foundation/source-registry.md) como `NOT_PROVIDED`.

## Regras

1. Não inventar arquivos “de exemplo” tratados como reais.
2. Não colocar segredos (senhas, chaves, dumps com PII desnecessário) sem classificação e autorização.
3. Não executar binários recebidos como “documento”.
4. Cada artefato real deve receber `SOURCE-ID` no registro **antes** de ser usado como evidência.
5. Preferir subpastas por data de recebimento, por exemplo `YYYY-MM-DD-<origem>/`, quando a ingestão for autorizada.
6. Registrar hash ou nome original no template de fonte, quando disponível.
7. Esta pasta é versionável com cuidado: documentos com dado pessoal podem exigir política de retenção ainda `OPEN` (DDP-019).

## Relação com o Prompt 01

A ingestão atômica e a análise das fontes pertencem ao **Prompt 01**, que **não** é executado neste Prompt 00.

## Placeholder

Não criar arquivos fictícios de PO, contrato ou planilha neste diretório.
