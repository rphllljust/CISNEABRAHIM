import type { Pool } from 'pg';

export type ExplainPlanRow = {
  'QUERY PLAN': string;
};

export type DbQueryAnalysis = {
  queryName: string;
  plan: string[];
  usesSeqScan: boolean;
  estimatedCost: number | null;
};

function parseEstimatedCost(planLines: string[]): number | null {
  const root = planLines[0];
  if (!root) {
    return null;
  }
  const match = root.match(/cost=\s*([0-9.]+)\.\.([0-9.]+)/);
  if (!match) {
    return null;
  }
  return Number.parseFloat(match[2] ?? match[1] ?? '');
}

export async function analyzeQueryPlan(
  pool: Pool,
  queryName: string,
  sql: string,
  params: unknown[] = [],
): Promise<DbQueryAnalysis> {
  const result = await pool.query<ExplainPlanRow>(`EXPLAIN (FORMAT TEXT) ${sql}`, params);
  const plan = result.rows.map((row) => row['QUERY PLAN']);
  return {
    queryName,
    plan,
    usesSeqScan: plan.some((line) => /Seq Scan/i.test(line)),
    estimatedCost: parseEstimatedCost(plan),
  };
}

export function detectDbAnalysisIssues(analyses: DbQueryAnalysis[]): string[] {
  const issues: string[] = [];
  for (const analysis of analyses) {
    if (analysis.usesSeqScan) {
      issues.push(`${analysis.queryName}: sequential scan detected`);
    }
  }
  return issues;
}
