import type { UatScenarioId } from './uat-types';

export type UatFictionalClient = {
  legalName: string;
  tradeName: string;
  taxId: string;
  contactName: string;
  city: string;
};

export type UatScenarioDefinition = {
  id: UatScenarioId;
  title: string;
  portfolioReference: string;
  archetype: 'RENTAL' | 'TRANSPORT' | 'CIVIL_WORK';
  measurementMode: 'BY_PERIOD' | 'BY_QUANTITY' | 'BY_EVENT';
  measurementBasis: 'TIME' | 'TRIP' | 'GLOBAL_COMPLETION';
  defaultUnitCode: string;
  resourceTypeCodes: string[];
  serviceName: string;
  proposalTitle: string;
  requestDescription: string;
  executionObservation: string;
  quantityValue: string;
};

export const UAT_SCENARIOS: UatScenarioDefinition[] = [
  {
    id: 'locacao',
    title: 'Locação de equipamento (escavadeira)',
    portfolioReference: '77.39-0-99 — Aluguel de máquinas e equipamentos industriais',
    archetype: 'RENTAL',
    measurementMode: 'BY_PERIOD',
    measurementBasis: 'TIME',
    defaultUnitCode: 'DAY',
    resourceTypeCodes: ['EXCAVATOR'],
    serviceName: 'Locação diária de escavadeira hidráulica',
    proposalTitle: 'Proposta locação escavadeira — obra de acesso',
    requestDescription: 'Locação de escavadeira por 3 dias para abertura de via interna.',
    executionObservation: 'Equipamento entregue e operado conforme janela contratada.',
    quantityValue: '3',
  },
  {
    id: 'transporte',
    title: 'Transporte de carga municipal',
    portfolioReference: '49.30-2-01 — Transporte de carga municipal',
    archetype: 'TRANSPORT',
    measurementMode: 'BY_EVENT',
    measurementBasis: 'TRIP',
    defaultUnitCode: 'TRIP',
    resourceTypeCodes: ['TRUCK'],
    serviceName: 'Transporte de insumos — trecho urbano',
    proposalTitle: 'Proposta transporte de fertilizantes',
    requestDescription: 'Duas viagens com caminhão truck para entrega em silo cliente.',
    executionObservation: 'Viagens concluídas com ticket de pesagem anexado.',
    quantityValue: '2',
  },
  {
    id: 'obra_composto',
    title: 'Obra/serviço composto (terraplenagem + apoio)',
    portfolioReference: '43.99-1-99 — Serviços especializados para construção',
    archetype: 'CIVIL_WORK',
    measurementMode: 'BY_EVENT',
    measurementBasis: 'GLOBAL_COMPLETION',
    defaultUnitCode: 'SERVICE',
    resourceTypeCodes: ['EXCAVATOR', 'WATER_TRUCK'],
    serviceName: 'Terraplenagem com compactação e umidificação',
    proposalTitle: 'Proposta obra composta — pátio logístico',
    requestDescription: 'Serviço composto com escavadeira e caminhão pipa para umidificação.',
    executionObservation: 'Frente de serviço concluída com evidências fotográficas.',
    quantityValue: '1',
  },
];

export function getUatScenario(id: UatScenarioId): UatScenarioDefinition {
  const scenario = UAT_SCENARIOS.find((entry) => entry.id === id);
  if (!scenario) {
    throw new Error(`Unknown UAT scenario: ${id}`);
  }
  return scenario;
}
