export const CISNE_PORTFOLIO_CATEGORY_CODE = 'CISNE-PORTFOLIO';
export const CISNE_PORTFOLIO_CATEGORY_NAME = 'Portfólio CISNE Rondônia';

export const PORTFOLIO_OPERATIONAL_ARCHETYPES = [
  'RENTAL',
  'TRANSPORT',
  'CIVIL_WORK',
  'INSTALLATION',
  'MAINTENANCE',
  'INDUSTRIAL_SERVICE',
  'FACILITY_SERVICE',
  'COMMERCIAL_REPRESENTATION',
  'GOODS_TRADE',
  'LABOR_SERVICE',
  'WASTE_SERVICE',
  'MARITIME_SUPPORT',
] as const;

export type PortfolioOperationalArchetype = (typeof PORTFOLIO_OPERATIONAL_ARCHETYPES)[number];

export type CisnePortfolioEntry = {
  cnaeDisplay: string;
  name: string;
  archetype: PortfolioOperationalArchetype;
};

/**
 * Canonical CISNE Rondônia service portfolio (Prompt 41).
 * CNAE is legal classification reference — not workflow identity.
 */
export const CISNE_SERVICE_PORTFOLIO = [
  {
    cnaeDisplay: '46.19-2-00',
    name: 'Representação comercial de mercadorias em geral',
    archetype: 'COMMERCIAL_REPRESENTATION',
  },
  {
    cnaeDisplay: '43.21-5-00',
    name: 'Instalação e manutenção elétrica',
    archetype: 'INSTALLATION',
  },
  {
    cnaeDisplay: '77.11-0-00',
    name: 'Locação de automóveis sem condutor',
    archetype: 'RENTAL',
  },
  {
    cnaeDisplay: '77.39-0-99',
    name: 'Aluguel de máquinas e equipamentos industriais',
    archetype: 'RENTAL',
  },
  {
    cnaeDisplay: '33.21-0-00',
    name: 'Instalação de máquinas e equipamentos industriais',
    archetype: 'INSTALLATION',
  },
  {
    cnaeDisplay: '81.11-7-00',
    name: 'Serviços combinados de apoio a edifícios',
    archetype: 'FACILITY_SERVICE',
  },
  {
    cnaeDisplay: '41.20-4-00',
    name: 'Construção de edifícios',
    archetype: 'CIVIL_WORK',
  },
  {
    cnaeDisplay: '45.30-7-05',
    name: 'Comércio de pneumáticos e câmaras',
    archetype: 'GOODS_TRADE',
  },
  {
    cnaeDisplay: '25.39-0-01',
    name: 'Usinagem, tornearia e solda',
    archetype: 'INDUSTRIAL_SERVICE',
  },
  {
    cnaeDisplay: '49.30-2-02',
    name: 'Transporte de carga intermunicipal, interestadual e internacional',
    archetype: 'TRANSPORT',
  },
  {
    cnaeDisplay: '49.30-2-01',
    name: 'Transporte de carga municipal',
    archetype: 'TRANSPORT',
  },
  {
    cnaeDisplay: '45.41-2-03',
    name: 'Varejo de motocicletas e motonetas',
    archetype: 'GOODS_TRADE',
  },
  {
    cnaeDisplay: '81.30-3-00',
    name: 'Paisagismo',
    archetype: 'FACILITY_SERVICE',
  },
  {
    cnaeDisplay: '46.69-9-99',
    name: 'Atacado de máquinas e equipamentos',
    archetype: 'GOODS_TRADE',
  },
  {
    cnaeDisplay: '46.79-6-99',
    name: 'Atacado de materiais de construção',
    archetype: 'GOODS_TRADE',
  },
  {
    cnaeDisplay: '45.41-2-01',
    name: 'Atacado de motocicletas e motonetas',
    archetype: 'GOODS_TRADE',
  },
  {
    cnaeDisplay: '45.42-1-01',
    name: 'Representação comercial de motocicletas e peças',
    archetype: 'COMMERCIAL_REPRESENTATION',
  },
  {
    cnaeDisplay: '43.99-1-99',
    name: 'Serviços especializados para construção',
    archetype: 'CIVIL_WORK',
  },
  {
    cnaeDisplay: '47.44-0-99',
    name: 'Varejo de materiais de construção',
    archetype: 'GOODS_TRADE',
  },
  {
    cnaeDisplay: '46.79-6-04',
    name: 'Atacado especializado de materiais de construção',
    archetype: 'GOODS_TRADE',
  },
  {
    cnaeDisplay: '42.11-1-01',
    name: 'Construção de rodovias e ferrovias',
    archetype: 'CIVIL_WORK',
  },
  {
    cnaeDisplay: '43.11-8-01',
    name: 'Demolição',
    archetype: 'CIVIL_WORK',
  },
  {
    cnaeDisplay: '43.13-4-00',
    name: 'Terraplenagem',
    archetype: 'CIVIL_WORK',
  },
  {
    cnaeDisplay: '43.22-3-01',
    name: 'Instalações hidráulicas, sanitárias e de gás',
    archetype: 'INSTALLATION',
  },
  {
    cnaeDisplay: '43.30-4-04',
    name: 'Pintura',
    archetype: 'FACILITY_SERVICE',
  },
  {
    cnaeDisplay: '45.11-1-01',
    name: 'Varejo de veículos novos',
    archetype: 'GOODS_TRADE',
  },
  {
    cnaeDisplay: '45.11-1-02',
    name: 'Varejo de veículos usados',
    archetype: 'GOODS_TRADE',
  },
  {
    cnaeDisplay: '45.12-9-02',
    name: 'Consignação de veículos',
    archetype: 'GOODS_TRADE',
  },
  {
    cnaeDisplay: '28.69-1-00',
    name: 'Fabricação de máquinas e equipamentos industriais',
    archetype: 'INDUSTRIAL_SERVICE',
  },
  {
    cnaeDisplay: '49.29-9-02',
    name: 'Fretamento de passageiros',
    archetype: 'TRANSPORT',
  },
  {
    cnaeDisplay: '42.13-8-00',
    name: 'Urbanização',
    archetype: 'CIVIL_WORK',
  },
  {
    cnaeDisplay: '77.32-2-01',
    name: 'Aluguel de máquinas para construção',
    archetype: 'RENTAL',
  },
  {
    cnaeDisplay: '43.91-6-00',
    name: 'Fundações',
    archetype: 'CIVIL_WORK',
  },
  {
    cnaeDisplay: '42.11-1-02',
    name: 'Sinalização rodoviária e aeroportuária',
    archetype: 'CIVIL_WORK',
  },
  {
    cnaeDisplay: '38.11-4-00',
    name: 'Coleta de resíduos não perigosos',
    archetype: 'WASTE_SERVICE',
  },
  {
    cnaeDisplay: '45.11-1-06',
    name: 'Atacado de ônibus e micro-ônibus',
    archetype: 'GOODS_TRADE',
  },
  {
    cnaeDisplay: '45.41-2-02',
    name: 'Atacado de peças para motocicletas',
    archetype: 'GOODS_TRADE',
  },
  {
    cnaeDisplay: '45.30-7-06',
    name: 'Representação de peças automotivas',
    archetype: 'COMMERCIAL_REPRESENTATION',
  },
  {
    cnaeDisplay: '49.23-0-02',
    name: 'Transporte de passageiros com motorista',
    archetype: 'TRANSPORT',
  },
  {
    cnaeDisplay: '45.12-9-01',
    name: 'Representação comercial de veículos',
    archetype: 'COMMERCIAL_REPRESENTATION',
  },
  {
    cnaeDisplay: '43.11-8-02',
    name: 'Preparação de canteiro e limpeza',
    archetype: 'CIVIL_WORK',
  },
  {
    cnaeDisplay: '78.10-8-00',
    name: 'Seleção e agenciamento de mão de obra',
    archetype: 'LABOR_SERVICE',
  },
  {
    cnaeDisplay: '42.12-0-00',
    name: 'Obras de arte especiais',
    archetype: 'CIVIL_WORK',
  },
  {
    cnaeDisplay: '42.22-7-01',
    name: 'Redes de água e esgoto',
    archetype: 'INSTALLATION',
  },
  {
    cnaeDisplay: '43.99-1-04',
    name: 'Operação e fornecimento de equipamentos de transporte e elevação',
    archetype: 'INDUSTRIAL_SERVICE',
  },
  {
    cnaeDisplay: '43.19-3-00',
    name: 'Preparação de terreno',
    archetype: 'CIVIL_WORK',
  },
  {
    cnaeDisplay: '43.99-1-05',
    name: 'Perfuração e construção de poços',
    archetype: 'CIVIL_WORK',
  },
  {
    cnaeDisplay: '45.11-1-04',
    name: 'Atacado de caminhões',
    archetype: 'GOODS_TRADE',
  },
  {
    cnaeDisplay: '50.30-1-01',
    name: 'Navegação de apoio marítimo',
    archetype: 'MARITIME_SUPPORT',
  },
] as const satisfies readonly CisnePortfolioEntry[];
