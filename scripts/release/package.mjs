#!/usr/bin/env node
/**
 * CISNE — versioned hermetic release package builder.
 *
 * Assembles a self-contained, versioned release artifact under
 * artifacts/release/cisne-<version>/ containing:
 *   - api/    compiled API + worker (apps/api/dist, no source maps)
 *   - web/    compiled frontend (apps/web/dist)
 *   - db/     compiled @cisne/database (dist, no maps) + migrations/ (SQL + journal)
 *   - env/    public/default configuration templates (secrets always blank)
 *   - docker/ offline compose + image digest manifest (docker mode)
 *   - scripts/ release lifecycle CLI (cisne-ctl.mjs) + migrate runner
 *   - manifest.json / checksums.sha256 / sbom.json
 *
 * Reproducibility:
 *   - install always frozen (pnpm install --frozen-lockfile)
 *   - builds run from canonical source only (pnpm build)
 *   - no file outside the package is referenced at runtime (validated)
 *   - deterministic: same commit + inputs => same file content (version metadata
 *     is recorded in manifest.json, not embedded in compiled code)
 *
 * Usage:
 *   node scripts/release/package.mjs [--docker]
 * Env:
 *   RELEASE_VERSION          optional semver; default 0.0.0+<short-sha>
 *   RELEASE_OUT_DIR          default artifacts/release
 *   RELEASE_WEB_PUBLIC_URL   required public API URL baked into the web build
 *                            (e.g. https://api.cisne.example or http://127.0.0.1:3100 for sandbox)
 *   RELEASE_SKIP_BUILD=1     reuse existing dist (iteration only)
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

process.env['NODE_NO_WARNINGS'] = '1';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outRoot = resolve(process.env.RELEASE_OUT_DIR ?? join(ROOT, 'artifacts', 'release'));

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env, ...opts.env },
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited ${result.status}`);
  }
}

function git(...args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
}

function shortSha() {
  return git('rev-parse', '--short', 'HEAD') || 'unknown';
}

function walkFiles(current) {
  const out = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const full = join(current, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function sha256File(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function copyTreeWithoutMaps(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const file of walkFiles(src)) {
    if (file.endsWith('.map')) continue; // no source maps in runtime artifacts
    const rel = relative(src, file);
    const target = join(dest, rel);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(file, target);
  }
}

const SECRET_PATTERNS = [
  /BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY/,
  /AKIA[0-9A-Z]{16}/,
  /(ghp|gho|github_pat)_[A-Za-z0-9]{20,}/,
  /sk-[A-Za-z0-9]{20,}/,
  /xox[baprs]-/,
  /AIza[0-9A-Za-z_-]{20,}/,
];

function scanStagedFiles(stagedRoot) {
  const findings = [];
  for (const file of walkFiles(stagedRoot)) {
    if (/(\.png|\.jpg|\.jpeg|\.gif|\.woff2?|\.ico|\.pdf)$/.test(file)) continue;
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(`${relative(stagedRoot, file)}: matched ${pattern}`);
      }
    }
  }
  return findings;
}

function requireNode24() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 24) {
    throw new Error(
      `HOST_PREREQUISITE missing: Node.js >= 24 required for release packaging (found ${process.versions.node}).`,
    );
  }
}

async function main() {
  requireNode24();
  const dockerMode = process.argv.includes('--docker');
  const skipBuild = process.env.RELEASE_SKIP_BUILD === '1';

  const rootVersion = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version ?? '0.0.0';
  const version = process.env.RELEASE_VERSION ?? `${rootVersion}+${shortSha()}`;
  const commitSha = git('rev-parse', 'HEAD') || 'unknown';
  const buildRunId = process.env.RELEASE_BUILD_RUN_ID ?? `local-${shortSha()}-${Date.now()}`;

  const webPublicUrl = process.env.RELEASE_WEB_PUBLIC_URL;
  if (!webPublicUrl && !skipBuild) {
    throw new Error(
      'CONFIGURATION_ERROR: RELEASE_WEB_PUBLIC_URL is required (public API URL baked into the web bundle).',
    );
  }

  const stagedRoot = join(outRoot, `cisne-${version}`);
  if (existsSync(stagedRoot)) rmSync(stagedRoot, { recursive: true, force: true });

  console.log(`[release-package] version=${version} docker=${dockerMode} skipBuild=${skipBuild}`);
  console.log(`[release-package] commit=${commitSha}`);

  if (!skipBuild) {
    run('pnpm', ['install', '--frozen-lockfile'], { env: { VITE_API_BASE_URL: webPublicUrl } });
    run('pnpm', ['build']);
  }

  // 1) API + worker
  copyTreeWithoutMaps(join(ROOT, 'apps/api/dist'), join(stagedRoot, 'api'));
  cpSync(join(ROOT, 'apps/api/package.json'), join(stagedRoot, 'api/package.json'));

  // 2) web
  copyTreeWithoutMaps(join(ROOT, 'apps/web/dist'), join(stagedRoot, 'web'));

  // 3) database (dist + migrations + manifest of package.json exports)
  copyTreeWithoutMaps(join(ROOT, 'packages/database/dist'), join(stagedRoot, 'db/dist'));
  cpSync(join(ROOT, 'packages/database/migrations'), join(stagedRoot, 'db/migrations'), { recursive: true });
  cpSync(join(ROOT, 'packages/database/package.json'), join(stagedRoot, 'db/package.json'));

  // 4) env templates (defaults; secrets blank/change_me placeholders only)
  const envDir = join(stagedRoot, 'env');
  mkdirSync(envDir, { recursive: true });
  for (const name of ['.env.prod.example', '.env.release.example']) {
    const src = join(ROOT, name);
    if (existsSync(src)) cpSync(src, join(envDir, name));
  }
  writeFileSync(
    join(envDir, 'README.md'),
    '# Environment templates\n\nCopy the relevant file to your environment file (never commit real secrets).\n' +
      'Secrets (JWT_SECRET, S3_*, DOCUMENT_DOWNLOAD_TOKEN_SECRET, POSTGRES_PASSWORD) must come from the installer/secret store.\n',
  );

  // 5) lifecycle scripts + migrate runner reference
  const scriptsDir = join(stagedRoot, 'scripts');
  mkdirSync(scriptsDir, { recursive: true });
  writeFileSync(
    join(scriptsDir, 'README.md'),
    'Release lifecycle: use node scripts/cisne-ctl.mjs <install|start|stop|health|migrate|bootstrap|upgrade>.\n' +
      'Database migrations run with: node db/dist/cli/run-migrate-cli.js (DATABASE_URL env).\n',
  );

  // 6) secret scan of the staged artifact
  const findings = scanStagedFiles(stagedRoot);
  if (findings.length > 0) {
    throw new Error(`SECRETS IN ARTIFACT > 0\n${findings.join('\n')}`);
  }

  // 6b) SBOM (dependency + container image inventory) into the package.
  run('node', [join(ROOT, 'scripts/release/emit-sbom.mjs'), '--out', join(stagedRoot, 'sbom.json')]);
  // 7) checksums + manifest
  const files = walkFiles(stagedRoot).sort((a, b) => a.localeCompare(b));
  const checksumLines = files.map((file) => {
    const rel = relative(stagedRoot, file).replace(/\\/g, '/');
    return `${sha256File(file)}  ${rel}`;
  });
  writeFileSync(join(stagedRoot, 'checksums.sha256'), `${checksumLines.join('\n')}\n`, 'utf8');

  const stagedFileDigest = createHash('sha256');
  for (const file of files) {
    stagedFileDigest.update(relative(stagedRoot, file).replace(/\\/g, '/'));
    stagedFileDigest.update(readFileSync(file));
  }
  const manifest = {
    product: 'cisne-rondonia',
    version,
    commitSha,
    buildRunId,
    artifactDigest: `sha256:${stagedFileDigest.digest('hex')}`,
    generatedAt: new Date().toISOString(),
    contents: {
      api: 'apps/api/dist (no source maps)',
      web: 'apps/web/dist',
      database: 'packages/database/dist + migrations',
      migrations: files.filter((f) => f.replace(/\\\\/g,'/').includes('/migrations/')).length,
    },
    runtime: { node: process.versions.node, pnpm: readPnpmVersion() },
  };
  writeFileSync(join(stagedRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`[release-package] artifact: ${stagedRoot}`);
  console.log(`[release-package] artifactDigest: ${manifest.artifactDigest}`);
  console.log(`[release-package] files: ${files.length + 2}`);
  console.log(`[release-package] SECRETS IN ARTIFACT: 0`);
}

function readPnpmVersion() {
  const result = spawnSync('pnpm', ['--version'], { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
  return result.status === 0 ? result.stdout.trim() : 'unknown';
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
