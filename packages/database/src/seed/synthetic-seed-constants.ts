/** Namespace for deterministic synthetic business seed (development / homologation only). */
export const SYNTHETIC_SEED_NAMESPACE = 'cisne-synthetic-dev-v1';

export const SYNTHETIC_SEED_DISPLAY_PREFIX = 'TESTE —';

export const SYNTHETIC_SEED_UNIT_ID = 'unit-synthetic-homolog';

/** pg advisory lock — distinct from integration-test lock (0x43534e45). */
export const SYNTHETIC_SEED_ADVISORY_LOCK_KEY = 0x534eed01;

export const SYNTHETIC_SEED_CONFIRM_ENV = 'DEVELOPMENT_SYNTHETIC_SEED_CONFIRM';

export const SYNTHETIC_SEED_CONFIRM_VALUE = 'I_UNDERSTAND';

export const HML_SYNTHETIC_SEED_CONFIRM_ENV = 'HML_SYNTHETIC_SEED_CONFIRM';

export const HML_SYNTHETIC_SEED_CONFIRM_VALUE = 'I_UNDERSTAND';

export const SEED_REFERENCE_DATE_ENV = 'SEED_REFERENCE_DATE';

/** Default reference instant — America/Manaus noon (Porto Velho operational TZ). */
export const DEFAULT_SEED_REFERENCE_ISO = '2026-08-01T12:00:00-04:00';
