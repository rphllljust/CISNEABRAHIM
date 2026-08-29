# SEC-ENV-001

| Campo       | Valor                  |
| ----------- | ---------------------- |
| Document ID | Segurança de ambientes |
| Prompt      | 14                     |

## Ambientes

| Env     | Dados                                        | Acesso       |
| ------- | -------------------------------------------- | ------------ |
| dev     | Sintéticos / anonimizados                    | Dev team     |
| staging | Subset mascarado — **não prod copy default** | Dev + QA     |
| prod    | Reais                                        | Restrito ops |

## Separação

| Recurso | Regra                      |
| ------- | -------------------------- |
| DB      | Instância separada por env |
| Buckets | Prefixo env isolado        |
| Secrets | Namespace por env          |
| IdP     | App registration separada  |

## SEC-CTL-026

**Proibido** restaurar backup prod em dev sem mascaramento — SEC-THR-029.

## Network candidata

| Zona  | Acesso                      |
| ----- | --------------------------- |
| PG    | Private subnet; não público |
| API   | LB público TLS              |
| Admin | VPN ou bastion              |

## Config drift

Infra as code candidato — Terraform/Pulumi TBD Prompt 17.

## Debug

`NODE_ENV=production` — sem debug endpoints, stack traces genéricos.

## Dados teste

Sem CPF/NF reais em seed — Prompt 19.
