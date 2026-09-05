# SRC-008 — Autoridade operacional máxima, OS, medição, PO e faturamento interno

## 1. Identificação da fonte

| Campo | Valor |
| ----- | ----- |
| SOURCE-ID | SRC-008 |
| Título | Autoridade operacional máxima da Cisne Rondônia (OS, solicitação, medição, PO e faturamento interno) |
| Tipo | Declaração empresarial do responsável pelo projeto |
| Origem | Instrução normativa no chat de engenharia, 2026-09-03 |
| Empresa relacionada | CISNE RONDÔNIA COMÉRCIO E SERVIÇOS LTDA |
| Data de recebimento | 2026-09-03 |
| Received at | 2026-09-03T02:22:00-04:00 |
| Location | docs/inputs/SRC-008-autoridade-operacional-os-medicao-po-faturamento.md |
| Confiabilidade | Alta para o recorte declarado (mesmo responsável que aprovou SRC-002) |
| Status | REGISTERED |
| Classification | SPONSOR_DECLARED_OPERATIONAL_POLICY / BUSINESS_DECISION |
| Integrity | Texto digitado no chat; sem documento formal anexo |
| Personal / sensitive data | Sim — identifica Abrahim e Mônica como administradores máximos equivalentes |
| Pode confirmar regra operacional isoladamente? | **Sim** — somente o recorte de autoridade operacional, solicitação e OS, máquina de estados da OS, PO, medição e desacoplamento de faturamento interno |
| Precisa ser confrontada com documentos reais? | Sim para contratos comerciais específicos, POs de cliente e políticas por tipo de serviço; não substitui Documento Mestre nem legislação fiscal |
| Substitui fontes primárias? | **Não** |

## 2. Advertência

Este arquivo registra a declaração do responsável. Não é contrato social, não é Documento Mestre e **não autoriza go-live**.

Ele **não** decide, sozinho:

- alíquota, CFOP, NCM, código de serviço, ISS, ICMS ou retenções;
- tipo legal NF-e vs NFS-e (residual de DDP-023 permanece OPEN);
- ativação de FEATURE_MODULE_FISCAL em produção;
- integração API de WhatsApp, SEFAZ, banco ou rastreador;
- papéis operacionais além da autoridade máxima (não inventar organograma);
- exit do piloto (PILOT_OBSERVATION_WINDOW_NOT_COMPLETED).

SRC-002 continua a proibir hardcode de nomes no motor de autorização: Abrahim e Mônica são as **pessoas** que detêm a autoridade máxima equivalente; o sistema atribui **capabilities** a identidades, não compara strings de nome.

## 3. Texto recebido (síntese normativa)

O responsável ordenou estabelecer e implementar, no Sistema Cisne Rondônia, sem simplificações perigosas e sem alterar fluxos já funcionais fora deste escopo:

1. Abrahim e Mônica são os dois **administradores máximos** equivalentes. Somente eles podem criar rascunho de OS, liberar OS para execução, cancelar, reabrir, registrar ou aprovar medições, autorizar exceções comerciais e liberar valores para faturamento interno.
2. A mesma pessoa pode criar e liberar a própria OS. **Não** exigir segregação obrigatória entre Abrahim e Mônica. Auditoria separada: createdBy, 
eleasedBy, pprovedBy, cancelledBy, 
eopenedBy, timestamps e justificativas.
3. Todas as restrições existem **obrigatoriamente no backend**. Ocultar botão no frontend não é controle. Nenhum outro usuário, papel operacional, cliente, motorista ou funcionário executa ações administrativas por API direta.
4. Solicitação e OS são entidades distintas. Não transformar toda solicitação automaticamente em OS. Conversão em uma ou mais OS somente pelos administradores máximos. Cliente ou usuário operacional não abre nem libera OS diretamente.
5. Máquina de estados da OS validada no backend: ao menos rascunho, liberada, em execução, concluída, cancelada e estados necessários a medição/faturamento. Transição inválida recusada. Cancelamento **nunca apaga**. Reabertura excepcional, exclusiva da autoridade máxima, com justificativa obrigatória e trilha (estado anterior, novo estado, usuário, data/hora, motivo).
6. PO do cliente **não** é obrigatório globalmente. Obrigatoriedade configurável por cliente, contrato ou regra comercial: antes da execução, antes do faturamento, ou não exigido. Preferir relação 1 PO para N OS sem impedir alocações futuras mais complexas.
7. Saldo de PO: distinguir total, comprometido, executado/medido, aprovado, faturado e disponível. Estouro bloqueado por padrão. Override administrativo só quando a regra permitir, com justificativa, auditoria e registro do excedente. **Nunca** estouro silencioso.
8. Medição representa o **executado**, não cópia da proposta. Unidades conforme o serviço (hora de máquina, diária, km, viagem, tonelagem, mão de obra, locação, quantidade, valor fixo ou critério contratual).
9. Na R1, Abrahim e Mônica podem registrar, enviar, aprovar ou recusar medições. Quem registrou **pode** ser quem aprovou; campos de auditoria permanecem separados para segregação futura. Medição recusada não é apagada; permite correção/reenvio.
10. Serviços faturados por medição: somente medição **aprovada** gera direito a faturamento interno. Execução concluída isoladamente **não** torna o serviço faturável. Preço fixo, mensalidade, locação fixa ou marco contratual podem ser faturáveis sem medição quantitativa artificial. Políticas por tipo de serviço ou contrato.
11. Separar **direito a faturar**, **faturamento interno** e **emissão fiscal**. Estar apto a faturar não significa que uma nota fiscal foi emitida.
12. WhatsApp pode continuar como canal real de entrada na R1, tratado como **ORIGEM** da solicitação, não como fonte oficial do workflow. Após o registro no Cisne, o Cisne é a fonte oficial.
13. RBAC explícito e centralizado. Capabilities (criar/liberar/cancelar/reabrir OS, aprovar medição, autorizar excedente de PO, liberar faturamento) atribuídas inicialmente somente a Abrahim e Mônica. Evitar isAdmin=true espalhado.
14. Transações, idempotência, concorrência, integridade, auditoria e histórico imutável das ações críticas.
15. Abrahim e Mônica **não** são usuários comuns com botões extras. Nenhuma automação, cliente ou usuário operacional substitui essa autoridade sem alteração explícita futura das regras.

## 4. Fatos / decisões extraídos

| Campo | Valor informado | Classificação |
| ----- | --------------- | ------------- |
| Autoridade máxima equivalente | duas pessoas, mesma autoridade operacional | Decisão empresarial |
| Segregação Abrahim x Mônica | **não** obrigatória; auditoria de atores permanece separada | Decisão empresarial |
| Boundary de segurança | backend / capabilities; frontend insuficiente | Decisão empresarial / engenharia |
| Solicitação vs OS | entidades distintas; conversão 1 para N só pela autoridade máxima | Decisão empresarial |
| Reabertura de OS | excepcional, justificativa obrigatória, nunca apaga o cancelamento | Decisão empresarial |
| PO | não obrigatório globalmente; configurável; 1 para N preferencial | Decisão empresarial |
| Estouro de PO | bloqueado por padrão; override auditado | Decisão empresarial |
| Medição | executado real; recusa preservada; R1 sem SoD obrigatório registrar x aprovar | Decisão empresarial |
| Direito a faturar | medição aprovada **ou** política contratual (preço fixo / periódico / marco) | Decisão empresarial |
| Emissão fiscal | desacoplada do faturamento interno | Decisão empresarial (não fecha DDP-023 residual) |
| WhatsApp | origem da solicitação; Cisne = SoT do processo após registro | Decisão empresarial |

## 5. Relação com fontes anteriores

| Fonte | Relação |
| ----- | ------- |
| SRC-002 | Proíbe hardcode de nomes no PDP; Perfil de Controle por capability. SRC-008 nomeia as pessoas da autoridade máxima e exige o mesmo modelo de capability. |
| SRC-004 / BR-042 | Cisne permanece SoT interno. WhatsApp não vira SoT. |
| SRC-007 / BR-043..045 | Emissão fiscal oficial continua gated. SRC-008 reforça o desacoplamento; não liga FEATURE_MODULE_FISCAL. |
| BR-025 | Já confirmava que solicitar não equivale a autorizar. SRC-008 detalha conversão e liberação. |

Nenhum SC-* aberto. Não contradiz SRC-002 (capabilities) nem SRC-007 (fiscal).

## 6. O que esta fonte **não** cobre

- Tipos de OS (DDP-001 permanece OPEN).
- Folha, equipamentos, veículos, pagamento, retenção, volume, offline.
- Tributação substantiva e tipo legal de nota.
- Mapeamento completo de papéis de motorista/funcionário além da negação de autoridade máxima.
- Buckets persistidos de saldo PO além do que o sistema já registra (total, faturado/consumido, excedente autorizado, disponível). Comprometido/medido/aprovado como ledger separado permanece interpretação de engenharia até modelagem futura, sem inventar saldos.
