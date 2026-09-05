# PILOT EXIT READINESS snapshot — 2026-09-03

Classification: interpretacao de engenharia (SRE). Nao e aceite empresarial.

Recorded at: 2026-09-03T08:48:54.530Z in readiness-evidence.json (PILOT_OPERATIONAL_SNAPSHOT_RECORDED).

PILOT_STATUS = OBSERVATION
ENGINEERING READY: YES
PILOT COMPLETE: NO
EXIT READY: NO

startedAt: 2026-08-30T22:28:40.517Z (unchanged)
observationEndsAt: 2026-09-13T22:28:40.517Z (unchanged)
observationWaiver: null

Gate pnpm readiness:gate at 2026-09-03T08:51:09.412Z: engineering READY, production NO-GO, official productionBlocker PILOT_OBSERVATION_WINDOW_NOT_COMPLETED.

Indicators:

- HTTP EXIT metrics missing (Prompt 82 not copied; HML in-process 5 requests, 0 errors, p95 130ms)
- Outbox FAILED 0; worker PENDING 51; worker FAILED/DEAD 0
- Allocation conflicts 0; billing aging 7d PREPARED 0
- Unbalanced journals 0; duplicate POSTED 0
- Incidents BLOCKER/CRITICAL 0
- UAT PASSED; sign-off APPROVED; DDP-016 conservative APPROVED
- Backup status ok 2026-09-03T05:25:40.209Z (lab 38-byte postgres artifact)
- DR latest.json absent; Prompt 85 tests PASS
- HML health 200; cisne_hml schema public only
- HML DB counters 55653 errors / 55655 queries
- HML metrics HTTP 200 with invalid Bearer
- HML alerts firing 0

Not done: no EXIT_READY, no authorizePilotExit, no waiver, no Prompt 93, HML migrations not applied.

## Follow-up 2026-09-03T15:47:50.565Z

Classification: interpretacao de engenharia. Nao encerra o piloto. Nao fabrica serie HTTP de 14 dias.

- HML `cisne_hml` recebeu o journal de migrations (29 schemas de dominio; `plt.background_jobs` = 0).
- Bootstrap sintetico `hml-admin@cisne.invalid` criado sem papeis operacionais.
- Smoke HML `PASS` (health 200, login 200, metrics 200; listas 403 por falta de grant).
- Snapshot apontou `PILOT_DATABASE_URL` para HML, nao `cisne_local_dev`.
- HTTP live: n=14, errorRate=0.571 (403 de identidade sem grant operacional), p95=345ms. Amostra de uptime do processo; nao substitui observacao de 14 dias.
- 51 PENDING `NOTIFICATION` permanecem em `cisne_local_dev` (lab local, fora do HML).
- DR `application_host_loss` PASS em `apps/api/.backup/dr-drill-validate/status/latest.json` (artefato gitignored). Restore postgres completo nao foi o cenario.
- Fase/datas/waiver inalterados. EXIT READY: NO. Prompt 93 nao executado.

## Follow-up 2026-09-03T16:46:03.644Z

Classification: interpretacao de engenharia. Nao encerra o piloto.

- Identidade sintetica HML recebeu grants `control_admin` + `platform:diagnostics:read` via `hml:grant-pilot-operator` (77 grants; idempotente; so CISNE_ENV=hml).
- Smoke HML passou a exigir HTTP 200 nas listagens. Resultado live: health/login/metrics/clients/requests/OS/documents = 200; execution/measurements/billing = 404 (sem OS).
- Snapshot HML: n=31, errorRate=0.355, p95=251ms, worker_pending=0, outbox_failed=0. A taxa ainda inclui 4xx acumulados do processo antes do grant; nao e serie de 14 dias.
- Fase/datas/waiver inalterados. EXIT READY: NO. Prompt 93 nao executado.

## Follow-up 2026-09-03T19:07:16.475Z

Classification: interpretacao de engenharia. Nao encerra o piloto. Nao fabrica serie HTTP de 14 dias.

- Seed sintetico HML `cisne-synthetic-dev-v1`: 15/15 cenarios presentes (`medicao-pendente` created; demais already_present). Contagens: clients 15, OS 9, measurements 5, billing_records 3, billing_documents 3.
- Smoke HML live 11/11 PASS. Nested execution/measurements/billing passaram a 200 (primeira OS da listagem agora tem massa).
- Snapshot HML: n=46, errorRate≈0.239, p95=191ms, outbox_failed=0, worker_pending=47 (`NOTIFICATION` PENDING; worker HML nao esta consumindo a fila). FAILED/DEAD=0. A taxa HTTP ainda inclui 4xx acumulados do processo; nao e serie de 14 dias.
- Fase/datas/waiver inalterados. EXIT READY: NO. Prompt 93 nao executado.
