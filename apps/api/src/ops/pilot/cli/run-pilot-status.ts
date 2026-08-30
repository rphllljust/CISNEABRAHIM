#!/usr/bin/env node
import { runPilotStatusCheck } from '../pilot-runner';

const report = runPilotStatusCheck({
  metrics: {
    httpRequests: Number(process.env['PILOT_HTTP_REQUESTS'] ?? 0),
    httpErrors: Number(process.env['PILOT_HTTP_ERRORS'] ?? 0),
    httpLatencyP95Ms: Number(process.env['PILOT_HTTP_LATENCY_P95_MS'] ?? 0),
    dbQueries: Number(process.env['PILOT_DB_QUERIES'] ?? 0),
    dbErrors: Number(process.env['PILOT_DB_ERRORS'] ?? 0),
    dbPoolWaiting: Number(process.env['PILOT_DB_POOL_WAITING'] ?? 0),
    workerPending: Number(process.env['PILOT_WORKER_PENDING'] ?? 0),
    outboxFailed: Number(process.env['PILOT_OUTBOX_FAILED'] ?? 0),
    serviceOrdersOverdue: Number(process.env['PILOT_OS_OVERDUE'] ?? 0),
    billingAgingRecords: Number(process.env['PILOT_BILLING_AGING'] ?? 0),
    openSupportTickets: Number(process.env['PILOT_SUPPORT_OPEN'] ?? 0),
  },
  pilotStartedAt: process.env['PILOT_STARTED_AT'],
});

console.log(JSON.stringify(report, null, 2));
if (report.phase === 'BLOCKED') {
  process.exitCode = 1;
}
