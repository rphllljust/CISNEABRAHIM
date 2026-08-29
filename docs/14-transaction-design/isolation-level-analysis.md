# TXN-ISO-001

| Campo | Valor |
| --- | --- |
| Document ID | Análise de níveis de isolamento PostgreSQL |
| Default candidato | **Read Committed** |
| Prompt | 13 |

## Níveis PostgreSQL

| Nível | Phantom | Lost update | Uso candidato |
| --- | --- | --- | --- |
| Read Committed | Possível | Possível sem lock/version | Maioria dos comandos |
| Repeatable Read | Não | Possível sem version | CMD-019 leitura medição |
| Serializable | Não | Não | PO saldo se PESS insuficiente |

## Decisão: não usar Serializable globalmente

Serializable aumenta aborts e latência. Reservar para corridas financeiras onde pessimistic lock não basta.

## Por cenário

| Cenário | Nível | Complemento |
| --- | --- | --- |
| CMD-001 registrar solicitação | RC | UNQ idempotency_key |
| CMD-003 conversão | RC | UNQ service_request_id |
| CMD-005 liberar OS | RC | row_version OS |
| PO consumo saldo | RC + **PESS FOR UPDATE** | Preferir lock a SER |
| CMD-013 alterar OS | RC | row_version INV-019 |
| CMD-015 alocar recurso | RC + **PESS** ou **SER** pontual | TXN-DEC-003 |
| CMD-019 faturamento | **RR** candidato | Leitura estável medição |
| CMD-020/021 financeiro | RC | UNQ keys |
| CMD-022 nova versão doc | RC | FOR UPDATE última versão |
| Reporting BC-016 | RC | Snapshot export — não TX escrita |

## Lost update — mitigação obrigatória

| Mecanismo | Onde |
| --- | --- |
| row_version OPT | service_order, measurement, commercial_reference, purchase_order |
| SELECT FOR UPDATE | PO root, resource slot, document version head |
| UNQ constraint | Conversão, NF, pagamento |

**Nenhum lost update silencioso aceito** — zero rows em UPDATE → `ConcurrencyConflict` empresarial.

## Anomalias aceitas (com mitigação)

| Anomalia | Aceita? | Mitigação |
| --- | --- | --- |
| Non-repeatable read em listagem | Sim | UI refresh |
| Phantom em dashboard | Sim | BC-016 eventual |
| Dirty read | Não | RC default PG |
| Lost update em OS | **Não** | row_version |

## Drizzle / NestJS (futuro)

```text
db.transaction(async (tx) => {
  await tx.execute(sql`SET LOCAL TRANSACTION ISOLATION LEVEL ...`)
})
```

Somente `SET LOCAL` dentro da transação — não alterar sessão global.

## Pendente

Benchmark SER vs PESS em alocação — decisão na implementação com testes TXN-TEST.
