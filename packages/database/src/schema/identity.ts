import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Persistência técnica de autenticação (Prompt 18).
 * Sem roles empresariais, clientes, OS ou demais domínios.
 */
export const identitySchema = pgSchema('identity');

export const identityStatusEnum = identitySchema.enum('identity_status', [
  'active',
  'disabled',
  'locked',
]);

export const sessionStatusEnum = identitySchema.enum('session_status', [
  'active',
  'revoked',
  'expired',
]);

export const identities = identitySchema.table(
  'identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    status: identityStatusEnum('status').notNull().default('active'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    disabledAt: timestamp('disabled_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    check(
      'identities_disabled_at_consistency_chk',
      sql`(${table.status} = 'active' AND ${table.disabledAt} IS NULL) OR (${table.status} <> 'active' AND ${table.disabledAt} IS NOT NULL)`,
    ),
    check('identities_version_positive_chk', sql`${table.version} >= 1`),
  ],
);

export const credentials = identitySchema.table(
  'credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identityId: uuid('identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    loginIdentifierNormalized: text('login_identifier_normalized').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    unique('credentials_login_identifier_normalized_uq').on(table.loginIdentifierNormalized),
    unique('credentials_identity_id_uq').on(table.identityId),
    check(
      'credentials_password_hash_not_empty_chk',
      sql`length(trim(${table.passwordHash})) >= 60`,
    ),
    check(
      'credentials_revoked_at_after_created_chk',
      sql`${table.revokedAt} IS NULL OR ${table.revokedAt} >= ${table.createdAt}`,
    ),
    index('credentials_identity_id_idx').on(table.identityId),
  ],
);

export const sessions = identitySchema.table(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identityId: uuid('identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    status: sessionStatusEnum('status').notNull().default('active'),
    version: integer('version').notNull().default(1),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    check('sessions_version_positive_chk', sql`${table.version} >= 1`),
    check('sessions_expires_after_created_chk', sql`${table.expiresAt} > ${table.createdAt}`),
    check(
      'sessions_revoked_consistency_chk',
      sql`(${table.status} = 'revoked' AND ${table.revokedAt} IS NOT NULL) OR (${table.status} <> 'revoked')`,
    ),
    index('sessions_identity_id_idx').on(table.identityId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);

export const refreshTokenFamilies = identitySchema.table(
  'refresh_token_families',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    identityId: uuid('identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('refresh_token_families_session_id_uq').on(table.sessionId),
    index('refresh_token_families_identity_id_idx').on(table.identityId),
  ],
);

export const refreshTokens = identitySchema.table(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => refreshTokenFamilies.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    replacedByTokenId: uuid('replaced_by_token_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('refresh_tokens_token_hash_uq').on(table.tokenHash),
    check('refresh_tokens_token_hash_not_empty_chk', sql`length(trim(${table.tokenHash})) >= 64`),
    check('refresh_tokens_expires_after_created_chk', sql`${table.expiresAt} > ${table.createdAt}`),
    check(
      'refresh_tokens_revoked_at_after_created_chk',
      sql`${table.revokedAt} IS NULL OR ${table.revokedAt} >= ${table.createdAt}`,
    ),
    index('refresh_tokens_family_id_idx').on(table.familyId),
    index('refresh_tokens_expires_at_idx').on(table.expiresAt),
  ],
);
