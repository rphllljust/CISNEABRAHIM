import {
  hashPassword,
  insertGrant,
  insertIdentity,
} from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AUTH_TEST_PASSWORD, applyAuthTestEnv } from '../auth/test/auth-test-env';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { IssuerRegistryModule } from './issuer-registry.module';
import { IssuerRegistryService } from './services/issuer-registry.service';
import { IssuerHttpException } from './errors/issuer-http.exception';

const CNPJ_A = '11222333000181';
const CNPJ_B = '11989171000199';

const ISSUER_GRANTS = [
  AUTHZ_ACTIONS.IssuerLegalEntityCreate,
  AUTHZ_ACTIONS.IssuerLegalEntityRead,
  AUTHZ_ACTIONS.IssuerLegalEntityList,
  AUTHZ_ACTIONS.IssuerLegalEntityUpdate,
  AUTHZ_ACTIONS.IssuerLegalEntityDeactivate,
  AUTHZ_ACTIONS.IssuerLegalEntityActivate,
  AUTHZ_ACTIONS.IssuerEstablishmentCreate,
  AUTHZ_ACTIONS.IssuerEstablishmentRead,
  AUTHZ_ACTIONS.IssuerEstablishmentList,
  AUTHZ_ACTIONS.IssuerEstablishmentUpdate,
  AUTHZ_ACTIONS.IssuerEstablishmentDeactivate,
  AUTHZ_ACTIONS.IssuerEstablishmentActivate,
  AUTHZ_ACTIONS.IssuerTaxRegistrationCreate,
  AUTHZ_ACTIONS.IssuerTaxRegistrationRead,
  AUTHZ_ACTIONS.IssuerTaxRegistrationList,
  AUTHZ_ACTIONS.IssuerTaxRegistrationUpdate,
  AUTHZ_ACTIONS.IssuerTaxRegistrationDeactivate,
  AUTHZ_ACTIONS.IssuerTaxRegistrationActivate,
  AUTHZ_ACTIONS.IssuerCertificateCreate,
  AUTHZ_ACTIONS.IssuerCertificateList,
  AUTHZ_ACTIONS.IssuerCertificateUpdate,
];

async function grantAll(pool: Pool, identityId: string): Promise<void> {
  for (const action of ISSUER_GRANTS) {
    const resourceType = action.startsWith('issuer:legal-entity')
      ? AUTHZ_RESOURCE_TYPES.IssuerLegalEntity
      : action.startsWith('issuer:establishment')
        ? AUTHZ_RESOURCE_TYPES.IssuerEstablishment
        : action.startsWith('issuer:tax-registration')
          ? AUTHZ_RESOURCE_TYPES.IssuerTaxRegistration
          : AUTHZ_RESOURCE_TYPES.IssuerCertificate;
    await insertGrant(pool, {
      identityId,
      action,
      resourceType,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
    });
  }
}

describe('Legal Establishment master PostgreSQL integration', () => {
  let pool: Pool;
  let registry: IssuerRegistryService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for issuer registry integration tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, IssuerRegistryModule],
    }).compile();
    registry = module.get(IssuerRegistryService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await pool.query(
      `DELETE FROM pty.establishment_tax_registration_history_events;
       DELETE FROM pty.establishment_history_events;
       DELETE FROM pty.legal_entity_history_events;
       DELETE FROM pty.establishment_certificates;
       DELETE FROM pty.establishment_tax_registrations;
       DELETE FROM pty.establishments;
       DELETE FROM pty.legal_entities;`,
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(granted = true): Promise<{ identityId: string; sessionId: string }> {
    const login = normalizeLoginIdentifier(`issuer-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    if (granted) {
      await grantAll(pool, identityId);
    }
    return { identityId, sessionId: 'sid' };
  }

  async function seedLegalEntityAndEstablishment(
    actor: { identityId: string; sessionId: string },
    code = 'MATRIZ',
  ) {
    const legal = await registry.createLegalEntity(actor, {
      legalName: 'Empresa Emissora Piloto LTDA',
      tradeName: 'Piloto',
    });
    const establishment = await registry.createEstablishment(actor, {
      legalEntityId: legal.id,
      code,
      isDefaultIssuer: true,
      city: 'Porto Velho',
      state: 'RO',
      postalCode: '76801000',
      country: 'BR',
    });
    const cnpj = await registry.createTaxRegistration(actor, {
      establishmentId: establishment.id,
      taxKind: 'CNPJ',
      number: CNPJ_A,
      regime: 'SIMPLES_NACIONAL',
    });
    return { legal, establishment, cnpj };
  }

  it('creates legal entity, establishment with fiscal address and CNPJ/IE/IM', async () => {
    const actor = await seedActor();
    const { legal, establishment, cnpj } = await seedLegalEntityAndEstablishment(actor);
    const ie = await registry.createTaxRegistration(actor, {
      establishmentId: establishment.id,
      taxKind: 'IE',
      number: 'RO-123-4567',
      state: 'RO',
    });
    const im = await registry.createTaxRegistration(actor, {
      establishmentId: establishment.id,
      taxKind: 'IM',
      number: '1234567',
    });

    expect(legal.status).toBe('ACTIVE');
    expect(establishment.isDefaultIssuer).toBe(true);
    expect(establishment.address.city).toBe('Porto Velho');
    expect(cnpj.number).toBe(CNPJ_A);
    expect(ie.number).toBe('RO1234567');
    expect(im.number).toBe('1234567');
    const detail = await registry.getEstablishment(actor, establishment.id);
    expect(detail.taxRegistrations).toHaveLength(3);
  });

  it('rejects duplicate CNPJ across establishments (duplicidade)', async () => {
    const actor = await seedActor();
    const { legal } = await seedLegalEntityAndEstablishment(actor);
    const other = await registry.createEstablishment(actor, {
      legalEntityId: legal.id,
      code: 'FILIAL-01',
    });
    await expect(
      registry.createTaxRegistration(actor, {
        establishmentId: other.id,
        taxKind: 'CNPJ',
        number: CNPJ_A,
      }),
    ).rejects.toThrow(IssuerHttpException);
    await expect(
      registry.createTaxRegistration(actor, {
        establishmentId: other.id,
        taxKind: 'CNPJ',
        number: CNPJ_B,
      }),
    ).resolves.toMatchObject({ taxKind: 'CNPJ', number: CNPJ_B });
  });

  it('enforces status transitions (inativação) with version', async () => {
    const actor = await seedActor();
    const { legal, establishment } = await seedLegalEntityAndEstablishment(actor);

    const deactivated = await registry.setEstablishmentStatus(actor, establishment.id, {
      version: establishment.version,
      reason: 'Baixa da filial',
    }, 'INACTIVE');
    expect(deactivated.status).toBe('INACTIVE');
    expect(deactivated.deactivatedAt).not.toBeNull();

    const history = await registry.listEstablishmentHistory(actor, establishment.id);
    expect(history.map((event) => event.eventKind)).toContain('DEACTIVATED');

    const reactivated = await registry.setEstablishmentStatus(actor, establishment.id, {
      version: deactivated.version,
    }, 'ACTIVE');
    expect(reactivated.status).toBe('ACTIVE');

    await expect(
      registry.setLegalEntityStatus(actor, legal.id, { version: 999 }, 'INACTIVE'),
    ).rejects.toThrow(IssuerHttpException);
  });

  it('rejects stale versions on update (version conflict)', async () => {
    const actor = await seedActor();
    const { legal } = await seedLegalEntityAndEstablishment(actor);
    const conflict = await registry
      .updateLegalEntity(actor, legal.id, {
        version: legal.version + 10,
        legalName: 'Nome Errado',
      })
      .then(() => null)
      .catch((error: unknown) => error);
    expect(conflict).toBeInstanceOf(IssuerHttpException);
    expect((conflict as IssuerHttpException).code).toBe('ISSUER_VERSION_CONFLICT');

    const updated = await registry.updateLegalEntity(actor, legal.id, {
      version: legal.version,
      legalName: 'Nome Correto Ltda',
    });
    expect(updated.legalName).toBe('Nome Correto Ltda');
    expect(updated.version).toBe(legal.version + 1);
  });

  it('denies operations without grants (autorização)', async () => {
    const actor = await seedActor(false);
    const legal = await registry.createLegalEntity(actor, { legalName: 'X' }).catch((error: unknown) => error);
    expect(legal).toBeInstanceOf(IssuerHttpException);
    const err = legal as IssuerHttpException;
    expect(err.code).toBe('ISSUER_DENIED');
    expect(err.getStatus()).toBe(403);
  });

  it('records append-only history for legal entity lifecycle (histórico)', async () => {
    const actor = await seedActor();
    const { legal } = await seedLegalEntityAndEstablishment(actor);
    await registry.updateLegalEntity(actor, legal.id, {
      version: legal.version,
      legalName: 'Empresa Emissora Piloto LTDA (alterada)',
    });
    await registry.setLegalEntityStatus(actor, legal.id, { version: legal.version + 1 }, 'INACTIVE');

    const history = await registry.listLegalEntityHistory(actor, legal.id);
    const kinds = history.map((event) => event.eventKind);
    expect(kinds).toEqual(expect.arrayContaining(['CREATED', 'UPDATED', 'DEACTIVATED']));
    for (const event of history) {
      expect(event.actorIdentityId).toBe(actor.identityId);
    }
  });

  it('single default issuer per legal entity', async () => {
    const actor = await seedActor();
    const { legal } = await seedLegalEntityAndEstablishment(actor);
    const second = await registry.createEstablishment(actor, {
      legalEntityId: legal.id,
      code: 'FILIAL-02',
      isDefaultIssuer: true,
    });
    expect(second.isDefaultIssuer).toBe(true);
    const list = await registry.listEstablishments(actor, legal.id);
    const defaults = list.filter((entry) => entry.isDefaultIssuer);
    expect(defaults).toHaveLength(1);
    expect(defaults[0]?.id).toBe(second.id);
  });
});

// CNPJs sintéticos de teste (formato válido, sem dado real da empresa).
