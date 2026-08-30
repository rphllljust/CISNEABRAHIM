import type { Pool } from 'pg';

export type IntegrityViolation = {
  check: string;
  count: number;
  sample?: string;
};

export async function assertPostStressIntegrity(pool: Pool): Promise<IntegrityViolation[]> {
  const violations: IntegrityViolation[] = [];

  const checks: Array<{ name: string; sql: string; params?: unknown[] }> = [
    {
      name: 'duplicate_clients_by_tax_id',
      sql: `SELECT normalized_tax_id, COUNT(*)::text AS count
            FROM pty.clients
            GROUP BY normalized_tax_id
            HAVING COUNT(*) > 1
            LIMIT 5`,
    },
    {
      name: 'duplicate_service_orders_by_order_number',
      sql: `SELECT order_number, COUNT(*)::text AS count
            FROM so.service_orders
            GROUP BY order_number
            HAVING COUNT(*) > 1
            LIMIT 5`,
    },
    {
      name: 'asset_overbooking_active_overlap',
      sql: `SELECT a.physical_asset_id::text, COUNT(*)::text AS count
            FROM res.resource_allocations a
            JOIN res.resource_allocations b
              ON a.physical_asset_id = b.physical_asset_id
             AND a.id <> b.id
             AND a.status = 'ACTIVE'
             AND b.status = 'ACTIVE'
             AND a.operational_start < b.operational_end
             AND b.operational_start < a.operational_end
            GROUP BY a.physical_asset_id
            HAVING COUNT(*) > 0
            LIMIT 5`,
    },
    {
      name: 'billing_document_number_collision',
      sql: `SELECT document_number, COUNT(*)::text AS count
            FROM bil.billing_documents
            GROUP BY document_number
            HAVING COUNT(*) > 1
            LIMIT 5`,
    },
    {
      name: 'orphan_measurement_items',
      sql: `SELECT mi.id::text
            FROM msr.measurement_items mi
            LEFT JOIN msr.measurements m ON m.id = mi.measurement_id
            WHERE m.id IS NULL
            LIMIT 5`,
    },
    {
      name: 'orphan_billing_items',
      sql: `SELECT bi.id::text
            FROM bil.billing_items bi
            LEFT JOIN bil.billing_records br ON br.id = bi.billing_record_id
            WHERE br.id IS NULL
            LIMIT 5`,
    },
  ];

  for (const check of checks) {
    const result = await pool.query<{ count?: string; normalized_tax_id?: string; order_number?: string; document_number?: string; id?: string; physical_asset_id?: string }>(
      check.sql,
      check.params,
    );
    if (result.rowCount && result.rowCount > 0) {
      const first = result.rows[0];
      violations.push({
        check: check.name,
        count: result.rowCount,
        sample: JSON.stringify(first),
      });
    }
  }

  return violations;
}
