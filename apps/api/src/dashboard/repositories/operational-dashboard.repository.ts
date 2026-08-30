import { Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import type { ScopeSqlPredicate } from '../../authorization/services/scope-enforcement.service';
import type { DashboardVisibility } from '../domain/operational-dashboard';

export type OperationalDashboardCounts = {
  pendingServiceRequests: number;
  ordersAwaitingRelease: number;
  ordersAwaitingConfirmation: number;
  ordersInProgress: number;
  overdueServiceOrders: number;
  resourcesInUse: number;
  pendingMeasurements: number;
  pendingBilling: number;
  divergences: number;
  pendingDocuments: number;
};

export type OperationalDashboardScopeFilters = {
  serviceRequestScope: ScopeSqlPredicate | null;
  serviceOrderScope: ScopeSqlPredicate | null;
  measurementScope: ScopeSqlPredicate | null;
  billingScope: ScopeSqlPredicate | null;
  documentScope: ScopeSqlPredicate | null;
  resourceScope: ScopeSqlPredicate | null;
};

function remapScope(scope: ScopeSqlPredicate, paramOffset: number): { clause: string; params: unknown[] } {
  const clause = scope.clause.replace(/\$(\d+)/g, (_, index) => `$${paramOffset + Number(index)}`);
  return { clause, params: scope.params };
}

@Injectable()
export class OperationalDashboardRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_NOT_CONFIGURED');
    }
    return connection.pool;
  }

  async countOperationalMetrics(
    visibility: DashboardVisibility,
    scopes: OperationalDashboardScopeFilters,
  ): Promise<OperationalDashboardCounts> {
    const tasks: Array<Promise<number>> = [];

    tasks.push(
      visibility.serviceRequests && scopes.serviceRequestScope
        ? this.countScoped(
            `SELECT COUNT(*)::text AS count
             FROM sr.service_requests sr
             WHERE ${remapScope(scopes.serviceRequestScope, 0).clause}
               AND sr.status IN ('SUBMITTED', 'UNDER_REVIEW')`,
            remapScope(scopes.serviceRequestScope, 0).params,
          )
        : Promise.resolve(0),
    );

    tasks.push(
      visibility.serviceOrders && scopes.serviceOrderScope
        ? this.countScoped(
            `SELECT COUNT(*)::text AS count
             FROM so.service_orders so
             WHERE ${remapScope(scopes.serviceOrderScope, 0).clause}
               AND so.status = 'PREPARED'`,
            remapScope(scopes.serviceOrderScope, 0).params,
          )
        : Promise.resolve(0),
    );

    tasks.push(
      visibility.serviceOrders && scopes.serviceOrderScope
        ? this.countScoped(
            `SELECT COUNT(*)::text AS count
             FROM so.service_orders so
             WHERE ${remapScope(scopes.serviceOrderScope, 0).clause}
               AND so.status = 'RELEASED'`,
            remapScope(scopes.serviceOrderScope, 0).params,
          )
        : Promise.resolve(0),
    );

    tasks.push(
      visibility.serviceOrders && scopes.serviceOrderScope
        ? this.countScoped(
            `SELECT COUNT(*)::text AS count
             FROM so.service_orders so
             WHERE ${remapScope(scopes.serviceOrderScope, 0).clause}
               AND so.status IN ('IN_EXECUTION', 'PAUSED')`,
            remapScope(scopes.serviceOrderScope, 0).params,
          )
        : Promise.resolve(0),
    );

    tasks.push(
      visibility.serviceOrders && scopes.serviceOrderScope
        ? this.countScoped(
            `SELECT COUNT(DISTINCT so.id)::text AS count
             FROM so.service_orders so
             WHERE ${remapScope(scopes.serviceOrderScope, 0).clause}
               AND so.status IN ('RELEASED', 'IN_EXECUTION', 'PAUSED')
               AND (
                 EXISTS (
                   SELECT 1
                   FROM so.planned_resources pr
                   WHERE pr.service_order_id = so.id
                     AND pr.status = 'PLANNED'
                     AND pr.operational_end IS NOT NULL
                     AND pr.operational_end < NOW()
                 )
                 OR EXISTS (
                   SELECT 1
                   FROM res.resource_allocations ra
                   WHERE ra.service_order_id = so.id
                     AND ra.status = 'ACTIVE'
                     AND ra.operational_end < NOW()
                 )
               )`,
            remapScope(scopes.serviceOrderScope, 0).params,
          )
        : Promise.resolve(0),
    );

    tasks.push(
      visibility.resources && scopes.resourceScope
        ? this.countScoped(
            `SELECT COUNT(*)::text AS count
             FROM res.resource_allocations ra
             INNER JOIN so.service_orders so ON so.id = ra.service_order_id
             WHERE ra.status = 'ACTIVE'
               AND ${remapScope(scopes.resourceScope, 0).clause}`,
            remapScope(scopes.resourceScope, 0).params,
          )
        : Promise.resolve(0),
    );

    tasks.push(
      visibility.measurements && scopes.measurementScope
        ? this.countScoped(
            `SELECT COUNT(*)::text AS count
             FROM msr.measurements m
             INNER JOIN so.service_orders so ON so.id = m.service_order_id
             WHERE m.status IN ('SUBMITTED', 'UNDER_REVIEW')
               AND ${remapScope(scopes.measurementScope, 0).clause}`,
            remapScope(scopes.measurementScope, 0).params,
          )
        : Promise.resolve(0),
    );

    tasks.push(
      visibility.billing && scopes.serviceOrderScope
        ? this.countScoped(
            `SELECT COUNT(DISTINCT so.id)::text AS count
             FROM so.service_orders so
             LEFT JOIN bil.billing_records br ON br.service_order_id = so.id AND br.status = 'PREPARED'
             LEFT JOIN bil.billing_documents bd ON bd.billing_record_id = br.id AND bd.status = 'FINALIZED'
             WHERE so.status = 'COMPLETED'
               AND ${remapScope(scopes.serviceOrderScope, 0).clause}
               AND (br.id IS NULL OR bd.id IS NULL)`,
            remapScope(scopes.serviceOrderScope, 0).params,
          )
        : Promise.resolve(0),
    );

    tasks.push(this.countDivergences(visibility, scopes));

    tasks.push(
      visibility.documents && scopes.documentScope
        ? this.countScoped(
            `SELECT COUNT(*)::text AS count
             FROM doc.documents d
             WHERE d.status = 'ACTIVE'
               AND (d.current_version_number IS NULL OR d.current_version_number < 1)
               AND ${remapScope(scopes.documentScope, 0).clause}`,
            remapScope(scopes.documentScope, 0).params,
          )
        : Promise.resolve(0),
    );

    const results = await Promise.all(tasks);

    return {
      pendingServiceRequests: results[0] ?? 0,
      ordersAwaitingRelease: results[1] ?? 0,
      ordersAwaitingConfirmation: results[2] ?? 0,
      ordersInProgress: results[3] ?? 0,
      overdueServiceOrders: results[4] ?? 0,
      resourcesInUse: results[5] ?? 0,
      pendingMeasurements: results[6] ?? 0,
      pendingBilling: results[7] ?? 0,
      divergences: results[8] ?? 0,
      pendingDocuments: results[9] ?? 0,
    };
  }

  private async countDivergences(
    visibility: DashboardVisibility,
    scopes: OperationalDashboardScopeFilters,
  ): Promise<number> {
    const tasks: Promise<number>[] = [];

    if (visibility.measurements && scopes.measurementScope) {
      const mapped = remapScope(scopes.measurementScope, 0);
      tasks.push(
        this.countScoped(
          `SELECT COUNT(*)::text AS count
           FROM msr.measurements m
           INNER JOIN so.service_orders so ON so.id = m.service_order_id
           WHERE m.status = 'REJECTED' AND ${mapped.clause}`,
          mapped.params,
        ),
      );
    }

    if (visibility.billing && scopes.billingScope) {
      const mapped = remapScope(scopes.billingScope, 0);
      tasks.push(
        this.countScoped(
          `SELECT COUNT(*)::text AS count
           FROM bil.billing_records br
           WHERE br.status = 'VOIDED' AND ${mapped.clause}`,
          mapped.params,
        ),
      );
    }

    if (tasks.length === 0) {
      return 0;
    }

    const counts = await Promise.all(tasks);
    return counts.reduce((sum, value) => sum + value, 0);
  }

  private async countScoped(sql: string, params: unknown[]): Promise<number> {
    const result = await this.pool().query<{ count: string }>(sql, params);
    return Number.parseInt(result.rows[0]?.count ?? '0', 10);
  }
}
