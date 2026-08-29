# SEC-SC-001

| Campo       | Valor                 |
| ----------- | --------------------- |
| Document ID | Supply chain security |
| Prompt      | 14                    |

## Superfície

| Vetor                  | Controle candidato                    |
| ---------------------- | ------------------------------------- |
| npm registry typosquat | Lockfile + review new deps            |
| Compromised package    | audit + integrity checksums pnpm      |
| CI pipeline            | OIDC deploy; sem secrets long-lived   |
| Git hooks              | Pre-commit secret scan                |
| Docker base image      | Pin digest; scan Trivy candidato      |
| GitHub Actions         | Pin action SHA; least privilege token |

## CI/CD gates candidatos

```text
lint → test → pnpm audit → build → container scan → deploy
```

## Artefatos

| Artefato        | Proteção                     |
| --------------- | ---------------------------- |
| Container image | Sign cosign candidato        |
| SBOM            | CycloneDX generate candidato |
| Source          | Signed tags                  |

## Terceiros

| Serviço        | Risco                                 |
| -------------- | ------------------------------------- |
| IdP            | Availability + trust                  |
| Cloud PG       | Provider SOC — não certificar projeto |
| Object storage | IAM misconfig                         |

## Resposta incidente supply chain

Revogar tokens CI, rotate secrets, rebuild clean, notify — incident-response-baseline.md.

## Não afirmar

SOC2/ISO do fornecedor como conformidade do CISNE.
