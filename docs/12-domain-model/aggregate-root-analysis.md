# DM-ROOT-001

| Campo | Valor |
| --- | --- |
| Document ID | Análise de aggregate roots |
| Prompt | 11 |

## Critérios de root

1. Único ponto de mutação via comandos.
2. Garante invariantes do cluster.
3. Identidade estável exposta externamente.
4. Tamanho transacional razoável.

## Por aggregate

| AGG | Root | Por que não outro membro |
| --- | --- | --- |
| 001 | Solicitação | Decisão pertence ao ciclo solicitação |
| 002 | OS | Itens planejados não vivem sem OS |
| 003 | Alocação | Cada alocação ciclo próprio SM-003 |
| 004 | Execução | Progresso subordinado à execução |
| 005 | Vínculo evidência | Liga execução↔doc sem absorver doc |
| 006 | Medição | Linhas subordinadas |
| 007 | Preparação faturamento | Itens faturáveis owned aqui |
| 008 | Nota informada | Registro fiscal independente |
| 009 | Pagamento | SoT pendente — root provisório |
| 010 | PO | Itens e consumo subordinados ao PO |
| 011 | Referência comercial | Preço/custo anchor |
| 012 | Party | Cadastro mínimo cliente |
| 013 | Documento lógico | Versões filhas |
| 014 | Entrega notificação | Instância por envio |

## Debates abertos

| Debate | Opções | MDDP |
| --- | --- | --- |
| Histórico OS | Root OS vs BC-017 | MDDP-001 |
| Responsável OS | Entidade filha vs atributo+evento | MDDP-002 |
| Consumo PO | Entidade PO vs evento | MDDP-004 |
| Uma vs N execuções por OS | 1:1 vs 1:N | CARD-DDP-003 |

## Anti-padrão

Root que referencia 10 aggregates mutáveis inline — usar apenas IDs.
