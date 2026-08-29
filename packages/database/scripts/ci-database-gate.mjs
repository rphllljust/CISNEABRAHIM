import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import pg from 'pg';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(packageRoot, '../..');
const envPath = resolve(repoRoot, '.env');
const envExamplePath = resolve(repoRoot, '.env.example');

if (existsSync(envPath)) {
  config({ path: envPath });
} else {
  config({ path: envExamplePath });
}
const MIGRATIONS_DIR = resolve(packageRoot, 'migrations');

const MIGRATION_FILES = [
  '0000_early_thaddeus_ross.sql',
  '0001_striped_the_liberteens.sql',
  '0002_authorization_baseline.sql',
  '0003_contextual_scope_enums.sql',
  '0004_contextual_scope_tables.sql',
  '0005_security_audit_events.sql',
  '0006_clients_baseline.sql',
  '0007_service_catalog_baseline.sql',
  '0008_service_definitions_lineage_version.sql',
];

const INCREMENTAL_BASELINE_FILES = MIGRATION_FILES.slice(0, -1);
const INCREMENTAL_DELTA_FILE = MIGRATION_FILES.at(-1);

const EXPECTED_SCHEMAS = ['infrastructure', 'identity', 'authorization', 'audit', 'pty', 'cat'];

const EXPECTED_TABLES = [
  'infrastructure.schema_baseline',
  'identity.identities',
  'authorization.grants',
  'audit.security_audit_events',
  'pty.clients',
  'cat.service_definitions',
  'cat.service_definition_versions',
  'cat.service_categories',
  'cat.service_legal_classifications',
  'cat.service_allowed_units',
  'cat.service_pricing_models',
  'cat.service_resource_requirements',
  'cat.service_evidence_requirements',
];

function adminConnectionString() {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL is required for ci-database-gate.');
  }
  return url;
}

function quoteIdent(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function withAdminClient(run) {
  const client = new pg.Client({ connectionString: adminConnectionString() });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

async function databaseExists(client, databaseName) {
  const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
  return result.rowCount > 0;
}

async function recreateDatabase(client, databaseName) {
  await client.query(
    `SELECT pg_terminate_backend(pid)
     FROM pg_stat_activity
     WHERE datname = $1
       AND pid <> pg_backend_pid()`,
    [databaseName],
  );

  if (await databaseExists(client, databaseName)) {
    await client.query(`DROP DATABASE ${quoteIdent(databaseName)}`);
  }

  await client.query(`CREATE DATABASE ${quoteIdent(databaseName)}`);
}

function databaseUrlForName(databaseName) {
  const parsed = new URL(adminConnectionString());
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
}

async function applySqlFile(client, relativePath) {
  const filePath = resolve(MIGRATIONS_DIR, relativePath);
  const sql = readFileSync(filePath, 'utf8');
  const statements = sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await client.query(statement);
  }
}

async function applyMigrations(connectionString, files) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    for (const file of files) {
      await applySqlFile(client, file);
    }
  } finally {
    await client.end();
  }
}

async function assertExpectedSchema(connectionString) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const schemas = await client.query(
      `SELECT schema_name
       FROM information_schema.schemata
       WHERE schema_name = ANY($1::text[])
       ORDER BY schema_name`,
      [EXPECTED_SCHEMAS],
    );
    const foundSchemas = schemas.rows.map((row) => row.schema_name);
    if (foundSchemas.length !== EXPECTED_SCHEMAS.length) {
      throw new Error(
        `Expected schemas ${EXPECTED_SCHEMAS.join(', ')}; found ${foundSchemas.join(', ')}`,
      );
    }

    for (const qualifiedTable of EXPECTED_TABLES) {
      const result = await client.query('SELECT to_regclass($1) AS regclass', [qualifiedTable]);
      if (!result.rows[0]?.regclass) {
        throw new Error(`Expected table missing: ${qualifiedTable}`);
      }
    }

    const baseline = await client.query(
      `SELECT baseline_version
       FROM infrastructure.schema_baseline
       ORDER BY id
       LIMIT 1`,
    );
    if (!baseline.rows[0]?.baseline_version) {
      throw new Error('Technical schema baseline seed missing in infrastructure.schema_baseline');
    }
  } finally {
    await client.end();
  }
}

async function assertConstraints(connectionString) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const actorId = randomUUID();
    const definitionId = randomUUID();
    const passwordHash = '$2b$12$ci.gate.actor.hash.placeholder.abcdefghijklmnopqrstuvwxyz012345';

    await client.query(`INSERT INTO identity.identities (id, status) VALUES ($1, 'active')`, [
      actorId,
    ]);
    await client.query(
      `INSERT INTO identity.credentials (
         id, identity_id, login_identifier_normalized, password_hash
       ) VALUES ($1, $2, $3, $4)`,
      [randomUUID(), actorId, `ci-gate-${randomUUID()}@test.local`, passwordHash],
    );

    await client.query(
      `INSERT INTO cat.service_definitions (
         id, code, created_by_identity_id, updated_by_identity_id
       ) VALUES ($1, 'CI-GATE-DEF', $2, $2)`,
      [definitionId, actorId],
    );

    await client
      .query(
        `INSERT INTO cat.service_definitions (
           id, code, created_by_identity_id, updated_by_identity_id
         ) VALUES ($1, 'CI-GATE-DEF', $2, $2)`,
        [randomUUID(), actorId],
      )
      .then(() => {
        throw new Error('Expected duplicate service_definitions.code to violate unique constraint');
      })
      .catch((error) => {
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
          return;
        }
        throw error;
      });
  } finally {
    await client.end();
  }
}

async function assertPreDeltaState(connectionString, deltaFile) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    if (deltaFile === '0007_service_catalog_baseline.sql') {
      const result = await client.query('SELECT to_regclass($1) AS regclass', [
        'cat.service_definitions',
      ]);
      if (result.rows[0]?.regclass) {
        throw new Error(
          'Incremental baseline incorrectly contains cat.service_definitions before delta',
        );
      }
      return;
    }

    if (deltaFile === '0008_service_definitions_lineage_version.sql') {
      const catalog = await client.query('SELECT to_regclass($1) AS regclass', [
        'cat.service_definitions',
      ]);
      if (!catalog.rows[0]?.regclass) {
        throw new Error('Expected cat.service_definitions before 0008 delta');
      }
      const column = await client.query(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'cat'
           AND table_name = 'service_definitions'
           AND column_name = 'version'`,
      );
      if ((column.rowCount ?? 0) > 0) {
        throw new Error(
          'Incremental baseline incorrectly contains service_definitions.version before 0008',
        );
      }
      return;
    }

    throw new Error(`Unsupported incremental delta migration: ${deltaFile}`);
  } finally {
    await client.end();
  }
}

async function main() {
  const freshDb = process.env['CI_GATE_FRESH_DB'] ?? 'cisne_gate_fresh';
  const incrementalDb = process.env['CI_GATE_INCREMENTAL_DB'] ?? 'cisne_gate_incremental';

  console.log('CI database gate: fresh database migration');
  await withAdminClient(async (admin) => {
    await recreateDatabase(admin, freshDb);
    await recreateDatabase(admin, incrementalDb);
  });

  const freshUrl = databaseUrlForName(freshDb);
  await applyMigrations(freshUrl, MIGRATION_FILES);
  await assertExpectedSchema(freshUrl);
  await assertConstraints(freshUrl);
  console.log('  PASS — fresh database migrated and schema validated');

  console.log('CI database gate: incremental migration (N-1 → N)');
  const incrementalUrl = databaseUrlForName(incrementalDb);
  await applyMigrations(incrementalUrl, INCREMENTAL_BASELINE_FILES);
  await assertPreDeltaState(incrementalUrl, INCREMENTAL_DELTA_FILE);
  await applyMigrations(incrementalUrl, [INCREMENTAL_DELTA_FILE]);
  await assertExpectedSchema(incrementalUrl);
  await assertConstraints(incrementalUrl);
  console.log('  PASS — incremental upgrade validated');

  console.log('CI database gate: PASS');
}

main().catch((error) => {
  console.error('CI database gate: FAIL');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
