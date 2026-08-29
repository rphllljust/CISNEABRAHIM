# TECH-RUN-001

| Campo | Valor |
| --- | --- |
| Document ID | Avaliação runtime e linguagem |
| Prompt | 10 |

## Opções

| Opção | Descrição |
| --- | --- |
| A | **TypeScript + Node.js** |
| B | Go |
| C | Deno + TypeScript |
| D | .NET / C# |

## TypeScript + Node.js — selecionado

| Aspecto | Avaliação |
| --- | --- |
| Integridade | Tipagem estática; strict mode reduz erros |
| Segurança | Ecossistema maduro; depende de disciplina |
| Transações | Adequado com PostgreSQL drivers |
| Produtividade | Stack unificada FE+BE |
| Testabilidade | Vitest, ferramentas maduras |
| Arquitetura | NestJS modular monolith natural |
| Operação | Node 24 LTS — suporte até 2028-04-30 |

**Versão Node recomendada:** 24.x Active LTS (fonte: [nodejs/Release](https://github.com/nodejs/release), verificado 2026-08-28).

**Versão TypeScript:** 5.x estável (pin na implementação; política em version-policy.md).

## Alternativas rejeitadas

| Opção | Motivo |
| --- | --- |
| Go | Duas linguagens; equipe UNKNOWN; menos alinhamento React |
| Deno | Ecossistema Nest/ORM menor; lock-in runtime |
| .NET | Sem evidência de equipe; split stack |

## Node 26

Current em ago/2026; LTS out/2026 — candidato para CI; produção inicial em **24 LTS** (menor risco).

## Riscos

TECH-RISK-001 (runtime EOL), TECH-RISK-002 (tipagem frouxa se não strict).
