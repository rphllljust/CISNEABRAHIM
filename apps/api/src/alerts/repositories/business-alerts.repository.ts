import { Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import type { ScopeSqlPredicate } from '../../authorization/services/scope-enforcement.service';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { buildAlertDeduplicationKey } from '../domain/alert-deduplication';
import type {
  BusinessAlertAggregateType,
  BusinessAlertListItem,
  BusinessAlertRecord,
  BusinessAlertSeverity,
  BusinessAlertStatus,
  BusinessAlertType,
} from '../domain/business-alert';
import type { AlertEvaluationResult } from '../domain/alert-evaluation.engine';

type AlertRow = {
  id: string;
  alert_type: BusinessAlertType;
  severity: BusinessAlertSeverity;
  status: BusinessAlertStatus;
  aggregate_type: BusinessAlertAggregateType;
  aggregate_id: string;
  policy_window: string;
  deduplication_key: string;
  condition_phase: string;
  title: string;
  message: string;
  entity_href: string;
  unit_id: string | null;
  client_id: string | null;
  metadata: Record<string, unknown>;
  triggered_at: string;
  resolved_at: string | null;
  last_seen_at: string;
};

@Injectable()
export class BusinessAlertsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_NOT_CONFIGURED');
    }
    return connection.pool;
  }

  async findActiveByDeduplicationKey(deduplicationKey: string): Promise<BusinessAlertRecord | null> {
    const result = await this.pool().query<AlertRow>(
      `SELECT *
       FROM alt.business_alerts
       WHERE deduplication_key = $1
         AND status = 'ACTIVE'
       LIMIT 1`,
      [deduplicationKey],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  }

  async listActiveByAggregate(
    aggregateType: BusinessAlertAggregateType,
    aggregateId: string,
    alertType?: BusinessAlertType,
  ): Promise<BusinessAlertRecord[]> {
    const params: unknown[] = [aggregateType, aggregateId];
    let typeClause = '';
    if (alertType) {
      params.push(alertType);
      typeClause = ` AND alert_type = $${params.length}`;
    }
    const result = await this.pool().query<AlertRow>(
      `SELECT *
       FROM alt.business_alerts
       WHERE aggregate_type = $1
         AND aggregate_id = $2
         AND status = 'ACTIVE'${typeClause}
       ORDER BY triggered_at DESC`,
      params,
    );
    return result.rows.map(mapRow);
  }

  async createAlert(input: {
    evaluation: AlertEvaluationResult;
    aggregateType: BusinessAlertAggregateType;
    aggregateId: string;
    unitId: string | null;
    clientId: string | null;
    now: Date;
  }): Promise<BusinessAlertRecord | null> {
    const deduplicationKey = buildAlertDeduplicationKey({
      alertType: input.evaluation.alertType as BusinessAlertType,
      aggregateId: input.aggregateId,
      policyWindow: input.evaluation.policyWindow,
    });
    const nowIso = input.now.toISOString();
    const result = await this.pool().query<AlertRow>(
      `INSERT INTO alt.business_alerts (
         alert_type, severity, status, aggregate_type, aggregate_id,
         policy_window, deduplication_key, condition_phase,
         title, message, entity_href, unit_id, client_id, metadata,
         triggered_at, last_seen_at, updated_at
       ) VALUES (
         $1, $2, 'ACTIVE', $3, $4,
         $5, $6, $7,
         $8, $9, $10, $11, $12, $13::jsonb,
         $14, $14, $14
       )
       ON CONFLICT (deduplication_key) WHERE status = 'ACTIVE' DO NOTHING
       RETURNING *`,
      [
        input.evaluation.alertType,
        input.evaluation.severity,
        input.aggregateType,
        input.aggregateId,
        input.evaluation.policyWindow,
        deduplicationKey,
        input.evaluation.conditionPhase,
        input.evaluation.title,
        input.evaluation.message,
        input.evaluation.entityHref,
        input.unitId,
        input.clientId,
        JSON.stringify(input.evaluation.metadata),
        nowIso,
      ],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  }

  async touchAlert(alertId: string, now: Date): Promise<void> {
    const nowIso = now.toISOString();
    await this.pool().query(
      `UPDATE alt.business_alerts
       SET last_seen_at = $2, updated_at = $2
       WHERE id = $1 AND status = 'ACTIVE'`,
      [alertId, nowIso],
    );
  }

  async resolveAlert(alertId: string, now: Date): Promise<void> {
    const nowIso = now.toISOString();
    await this.pool().query(
      `UPDATE alt.business_alerts
       SET status = 'RESOLVED',
           resolved_at = $2,
           updated_at = $2
       WHERE id = $1 AND status = 'ACTIVE'`,
      [alertId, nowIso],
    );
  }

  async resolveActiveByAggregateAndType(
    aggregateType: BusinessAlertAggregateType,
    aggregateId: string,
    alertType: BusinessAlertType,
    now: Date,
  ): Promise<void> {
    const nowIso = now.toISOString();
    await this.pool().query(
      `UPDATE alt.business_alerts
       SET status = 'RESOLVED',
           resolved_at = $3,
           updated_at = $3
       WHERE aggregate_type = $1
         AND aggregate_id = $2
         AND alert_type = $4
         AND status = 'ACTIVE'`,
      [aggregateType, aggregateId, nowIso, alertType],
    );
  }

  async listAlerts(input: {
    scope: ScopeSqlPredicate | null;
    status?: BusinessAlertStatus;
    alertType?: BusinessAlertType;
    severity?: BusinessAlertSeverity;
    limit: number;
  }): Promise<BusinessAlertListItem[]> {
    if (!input.scope || input.scope.clause === 'FALSE') {
      return [];
    }
    const params: unknown[] = [];
    let unitClause = 'TRUE';
    if (input.scope.clause !== 'TRUE') {
      const mappedClause = input.scope.clause.replace(/\bunit_id\b/g, 'ba.unit_id');
      params.push(...input.scope.params);
      unitClause = mappedClause;
    }
    let filterClause = '';
    if (input.status) {
      params.push(input.status);
      filterClause += ` AND ba.status = $${params.length}`;
    }
    if (input.alertType) {
      params.push(input.alertType);
      filterClause += ` AND ba.alert_type = $${params.length}`;
    }
    if (input.severity) {
      params.push(input.severity);
      filterClause += ` AND ba.severity = $${params.length}`;
    }
    params.push(input.limit);
    const limitParam = `$${params.length}`;

    const result = await this.pool().query<AlertRow>(
      `SELECT ba.*
       FROM alt.business_alerts ba
       WHERE ${unitClause}${filterClause}
       ORDER BY
         CASE ba.severity WHEN 'CRITICAL' THEN 0 ELSE 1 END,
         ba.triggered_at DESC
       LIMIT ${limitParam}`,
      params,
    );
    return result.rows.map((row) => ({
      id: row.id,
      alertType: row.alert_type,
      severity: row.severity,
      status: row.status,
      title: row.title,
      message: row.message,
      entityHref: row.entity_href,
      unitId: row.unit_id,
      triggeredAt: row.triggered_at,
      resolvedAt: row.resolved_at,
      lastSeenAt: row.last_seen_at,
    }));
  }

  async resolveTerminalServiceOrderAlerts(now: Date): Promise<number> {
    const nowIso = now.toISOString();
    const result = await this.pool().query<{ count: number }>(
      `WITH resolved AS (
         UPDATE alt.business_alerts ba
         SET status = 'RESOLVED',
             resolved_at = $1,
             updated_at = $1
         WHERE ba.status = 'ACTIVE'
           AND ba.aggregate_type = 'SERVICE_ORDER'
           AND EXISTS (
             SELECT 1
             FROM rpt.read_service_orders so
             WHERE so.id = ba.aggregate_id
               AND so.status IN ('COMPLETED', 'CANCELLED')
           )
         RETURNING ba.id
       )
       SELECT COUNT(*)::int AS count FROM resolved`,
      [nowIso],
    );
    return result.rows[0]?.count ?? 0;
  }

  async countActive(scope: ScopeSqlPredicate | null): Promise<number> {
    if (!scope || scope.clause === 'FALSE') {
      return 0;
    }
    if (scope.clause === 'TRUE') {
      const result = await this.pool().query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM alt.business_alerts WHERE status = 'ACTIVE'`,
      );
      return result.rows[0]?.count ?? 0;
    }
    const mappedClause = scope.clause.replace(/\bunit_id\b/g, 'ba.unit_id');
    const result = await this.pool().query<{ count: number }>(
      `SELECT COUNT(*)::int AS count
       FROM alt.business_alerts ba
       WHERE ba.status = 'ACTIVE' AND ${mappedClause}`,
      scope.params,
    );
    return result.rows[0]?.count ?? 0;
  }
}

function mapRow(row: AlertRow): BusinessAlertRecord {
  return {
    id: row.id,
    alertType: row.alert_type,
    severity: row.severity,
    status: row.status,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    policyWindow: row.policy_window,
    deduplicationKey: row.deduplication_key,
    conditionPhase: row.condition_phase as BusinessAlertRecord['conditionPhase'],
    title: row.title,
    message: row.message,
    entityHref: row.entity_href,
    unitId: row.unit_id,
    clientId: row.client_id,
    metadata: row.metadata ?? {},
    triggeredAt: row.triggered_at,
    resolvedAt: row.resolved_at,
    lastSeenAt: row.last_seen_at,
  };
}
