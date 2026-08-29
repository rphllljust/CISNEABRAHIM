import type { ServiceDefinitionVersion } from '../types/service-catalog.types';

export type VersionFieldDiff = {
  field: string;
  left: string;
  right: string;
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value, null, 2);
}

function pushDiff(
  diffs: VersionFieldDiff[],
  field: string,
  left: unknown,
  right: unknown,
): void {
  const leftText = formatValue(left);
  const rightText = formatValue(right);
  if (leftText !== rightText) {
    diffs.push({ field, left: leftText, right: rightText });
  }
}

export function compareServiceDefinitionVersions(
  left: ServiceDefinitionVersion,
  right: ServiceDefinitionVersion,
): VersionFieldDiff[] {
  const diffs: VersionFieldDiff[] = [];

  pushDiff(diffs, 'Nome', left.name, right.name);
  pushDiff(diffs, 'Descrição', left.description, right.description);
  pushDiff(diffs, 'Categoria (ID)', left.categoryId, right.categoryId);
  pushDiff(diffs, 'Arquétipo', left.archetype, right.archetype);
  pushDiff(diffs, 'Modo de medição', left.measurementMode, right.measurementMode);
  pushDiff(diffs, 'Base de medição', left.measurementBasis, right.measurementBasis);
  pushDiff(diffs, 'Unidade padrão', left.defaultUnitCode, right.defaultUnitCode);
  pushDiff(diffs, 'Status', left.status, right.status);
  pushDiff(diffs, 'Publicado em', left.publishedAt, right.publishedAt);
  pushDiff(
    diffs,
    'Unidades permitidas',
    left.allowedUnits,
    right.allowedUnits,
  );
  pushDiff(
    diffs,
    'Modelos de preço',
    left.pricingModels,
    right.pricingModels,
  );
  pushDiff(
    diffs,
    'Requisitos de recurso',
    left.resourceRequirements,
    right.resourceRequirements,
  );
  pushDiff(
    diffs,
    'Requisitos de mão de obra',
    left.laborRequirements,
    right.laborRequirements,
  );
  pushDiff(
    diffs,
    'Requisitos de evidência',
    left.executionRequirements,
    right.executionRequirements,
  );

  return diffs;
}
