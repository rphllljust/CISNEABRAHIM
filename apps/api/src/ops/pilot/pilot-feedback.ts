import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { PilotFeedbackCategory, PilotFeedbackItem, PilotFeedbackSeverity, PilotFeedbackStatus } from './pilot-types';
import { blocksPilotExit } from './pilot-types';

export type PilotFeedbackRegistry = {
  items: PilotFeedbackItem[];
};

export function createFeedbackItem(input: {
  category: PilotFeedbackCategory;
  severity: PilotFeedbackSeverity;
  summary: string;
  reporter?: string;
}): PilotFeedbackItem {
  return {
    id: `PILOT-FB-${crypto.randomUUID().slice(0, 8)}`,
    category: input.category,
    severity: input.severity,
    status: 'OPEN',
    summary: input.summary,
    reportedAt: new Date().toISOString(),
    reporter: input.reporter,
  };
}

export function registerFeedback(
  registry: PilotFeedbackRegistry,
  item: PilotFeedbackItem,
): PilotFeedbackRegistry {
  return { items: [...registry.items, item] };
}

export function summarizeFeedbackByCategory(
  registry: PilotFeedbackRegistry,
): Record<PilotFeedbackCategory, number> {
  return registry.items.reduce(
    (acc, item) => {
      if (item.status === 'OPEN') {
        acc[item.category] += 1;
      }
      return acc;
    },
    {
      bug: 0,
      ux_improvement: 0,
      new_feature: 0,
      business_rule_change: 0,
    } as Record<PilotFeedbackCategory, number>,
  );
}

export function openPilotBlockers(registry: PilotFeedbackRegistry): PilotFeedbackItem[] {
  return registry.items.filter(
    (item) => item.status === 'OPEN' && blocksPilotExit(item.severity),
  );
}

export function loadFeedbackRegistry(path: string): PilotFeedbackRegistry {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as PilotFeedbackRegistry;
  } catch {
    return { items: [] };
  }
}

export function saveFeedbackRegistry(path: string, registry: PilotFeedbackRegistry): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

export function resolveFeedback(
  registry: PilotFeedbackRegistry,
  id: string,
  status: Exclude<PilotFeedbackStatus, 'OPEN'> = 'RESOLVED',
): PilotFeedbackRegistry {
  return {
    items: registry.items.map((item) => (item.id === id ? { ...item, status } : item)),
  };
}
