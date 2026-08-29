export type SeedOutcome = 'created' | 'already_exists' | 'skipped' | 'rejected';

export type SafeSeedResult = {
  outcome: SeedOutcome;
  login: string;
  identityId?: string;
  message: string;
};

export type ProductionBootstrapInput = {
  login: string;
  password: string;
  confirmToken: string;
};

export type ProductionBootstrapResult = SafeSeedResult;
