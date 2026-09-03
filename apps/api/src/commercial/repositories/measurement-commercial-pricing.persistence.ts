import type { Pool } from 'pg';

export type MeasurementCommercialPricingLine = {
  modelCode: string;
  salePrice: string | null;
  internalCost: string | null;
  currencyCode: string;
  unitCode?: string | null;
  serviceDefinitionVersionId?: string | null;
};

export async function loadProposalMeasurementPricing(
  pool: Pool,
  proposalId: string,
  serviceDefinitionVersionId: string,
): Promise<MeasurementCommercialPricingLine[] | null> {
  const version = await pool.query<{
    pricing_structure: string;
    currency_code: string;
    global_sale_price_amount: string | null;
    global_internal_cost_amount: string | null;
  }>(
    `SELECT pv.pricing_structure::text AS pricing_structure,
            pv.currency_code,
            pv.global_sale_price_amount::text AS global_sale_price_amount,
            pv.global_internal_cost_amount::text AS global_internal_cost_amount
     FROM com.proposals p
     INNER JOIN com.proposal_versions pv
       ON pv.proposal_id = p.id
      AND pv.version_number = p.current_version_number
     WHERE p.id = $1`,
    [proposalId],
  );
  const row = version.rows[0];
  if (!row) {
    return null;
  }

  if (row.pricing_structure === 'GLOBAL_PRICE') {
    return [
      {
        modelCode: 'GLOBAL_PRICE',
        salePrice: row.global_sale_price_amount,
        internalCost: row.global_internal_cost_amount,
        currencyCode: row.currency_code ?? 'BRL',
        serviceDefinitionVersionId,
      },
    ];
  }

  const items = await pool.query<{
    unit_code: string | null;
    unit_sale_price_amount: string | null;
    unit_internal_cost_amount: string | null;
    line_sale_amount: string | null;
    line_internal_cost_amount: string | null;
    service_definition_version_id: string | null;
  }>(
    `SELECT unit_code,
            unit_sale_price_amount::text AS unit_sale_price_amount,
            unit_internal_cost_amount::text AS unit_internal_cost_amount,
            line_sale_amount::text AS line_sale_amount,
            line_internal_cost_amount::text AS line_internal_cost_amount,
            service_definition_version_id
     FROM com.proposal_items pi
     INNER JOIN com.proposal_versions pv ON pv.id = pi.proposal_version_id
     INNER JOIN com.proposals p ON p.id = pv.proposal_id
     WHERE p.id = $1
       AND pv.version_number = p.current_version_number
       AND (pi.service_definition_version_id = $2 OR pi.service_definition_version_id IS NULL)
     ORDER BY pi.line_number ASC`,
    [proposalId, serviceDefinitionVersionId],
  );

  if (items.rows.length === 0) {
    return null;
  }

  return items.rows.map((item) => ({
    modelCode: 'PROPOSAL_ITEM',
    salePrice: item.unit_sale_price_amount ?? item.line_sale_amount,
    internalCost: item.unit_internal_cost_amount ?? item.line_internal_cost_amount,
    currencyCode: row.currency_code ?? 'BRL',
    unitCode: item.unit_code,
    serviceDefinitionVersionId: item.service_definition_version_id,
  }));
}

export async function loadPurchaseOrderMeasurementPricing(
  pool: Pool,
  purchaseOrderId: string,
  serviceDefinitionVersionId: string,
): Promise<MeasurementCommercialPricingLine[] | null> {
  const header = await pool.query<{
    pricing_structure: string;
    currency_code: string;
    total_amount: string | null;
  }>(
    `SELECT pricing_structure::text AS pricing_structure,
            currency_code,
            total_amount::text AS total_amount
     FROM com.purchase_orders
     WHERE id = $1`,
    [purchaseOrderId],
  );
  const row = header.rows[0];
  if (!row) {
    return null;
  }

  if (row.pricing_structure === 'HEADER_TOTAL') {
    return [
      {
        modelCode: 'HEADER_TOTAL',
        salePrice: row.total_amount,
        internalCost: null,
        currencyCode: row.currency_code ?? 'BRL',
        serviceDefinitionVersionId,
      },
    ];
  }

  const items = await pool.query<{
    unit_code: string | null;
    unit_price_amount: string | null;
    line_total_amount: string | null;
    service_definition_version_id: string | null;
  }>(
    `SELECT unit_code,
            unit_price_amount::text AS unit_price_amount,
            line_total_amount::text AS line_total_amount,
            service_definition_version_id
     FROM com.purchase_order_items
     WHERE purchase_order_id = $1
       AND (service_definition_version_id = $2 OR service_definition_version_id IS NULL)
     ORDER BY line_number ASC`,
    [purchaseOrderId, serviceDefinitionVersionId],
  );

  if (items.rows.length === 0) {
    return null;
  }

  return items.rows.map((item) => ({
    modelCode: 'PURCHASE_ORDER_ITEM',
    salePrice: item.unit_price_amount ?? item.line_total_amount,
    internalCost: null,
    currencyCode: row.currency_code ?? 'BRL',
    unitCode: item.unit_code,
    serviceDefinitionVersionId: item.service_definition_version_id,
  }));
}