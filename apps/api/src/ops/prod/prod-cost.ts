export type CostControlPolicy = {
  budgetAlertsEnabled: boolean;
  monthlyBudgetUsd: number | null;
};

export function deriveCostControlPolicy(env: NodeJS.ProcessEnv = process.env): CostControlPolicy {
  const rawBudget = env['PROD_MONTHLY_BUDGET_USD']?.trim();
  const monthlyBudgetUsd = rawBudget ? Number.parseFloat(rawBudget) : null;

  return {
    budgetAlertsEnabled: env['PROD_COST_ALERTS_ENABLED'] === 'true',
    monthlyBudgetUsd: Number.isFinite(monthlyBudgetUsd) ? monthlyBudgetUsd : null,
  };
}

export function assertCostControlPolicy(policy: CostControlPolicy): void {
  if (!policy.budgetAlertsEnabled) {
    throw new Error('Production cost budget alerts must be enabled (PROD_COST_ALERTS_ENABLED=true)');
  }
  if (policy.monthlyBudgetUsd === null || policy.monthlyBudgetUsd <= 0) {
    throw new Error('PROD_MONTHLY_BUDGET_USD must be set when cost alerts are enabled');
  }
}
