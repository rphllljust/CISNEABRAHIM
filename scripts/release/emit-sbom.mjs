#!/usr/bin/env node
/**
 * CISNE — SBOM (Software Bill of Materials) inventory.
 *
 * Derives a dependency inventory from the frozen pnpm-lock.yaml (no network):
 * every locked package (name@version) plus container image references from the
 * compose stacks. Classification distinguishes direct (declared in a workspace
 * manifest) from transitive dependencies.
 *
 * Usage: node scripts/release/emit-sbom.mjs [--out <path>]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

process.env['NODE_NO_WARNINGS'] = '1';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const lockText = readFileSync(join(ROOT, 'pnpm-lock.yaml'), 'utf8');

// Minimal, structure-targeted parse of the regular pnpm-lock.yaml subset.
const packageKeys = new Map(); // key -> {version}
const declaredNames = new Set(); // names declared in any workspace importer

let section = null;
let inImporterDeps = null;
let currentPkg = null;
for (const rawLine of lockText.split('\n')) {
  const line = rawLine.replace(/\s+$/, '');
  if (!line.startsWith(' ')) {
    const rootMatch = /^(importers|packages|snapshots|settings|overrides|lockfileVersion):/.exec(line);
    if (rootMatch) {
      section = rootMatch[1];
      if (section === 'importers' || section === 'packages' || section === 'snapshots') {
        continue;
      }
    }
  }

  if (section === 'packages') {
    if (line.startsWith('  ') && !line.startsWith('    ')) {
      const m = line.match(/^  ([^\s].*?):\s*$/);
      if (m && m[1].includes('@')) {
        currentPkg = m[1];
        packageKeys.set(currentPkg, { version: null });
        continue;
      }
    }
    if (currentPkg && line.startsWith('    version:')) {
      packageKeys.get(currentPkg).version = line.replace(/^\s+version:\s*/, '').trim();
    }
  } else if (section === 'importers') {
    const dep = line.match(/^    (dependencies|devDependencies):\s*$/);
    if (dep) {
      inImporterDeps = dep[1];
      continue;
    }
    if (inImporterDeps) {
      const nameMatch = line.match(/^      "?([^"@][^":]*)"?:\s*$/);
      if (nameMatch) {
        declaredNames.add(nameMatch[1]);
      } else if (line.startsWith('    ') && !line.startsWith('      ') && line.trim() !== '') {
        inImporterDeps = null;
      }
    }
  }
}

function parseName(key) {
  const cleaned = key.split('(')[0];
  const at = cleaned.lastIndexOf('@');
  return at > 0 ? cleaned.slice(0, at) : cleaned;
}
function parseVersion(key) {
  const cleaned = key.split('(')[0];
  const at = cleaned.lastIndexOf('@');
  return at > 0 ? cleaned.slice(at + 1) : 'unknown';
}

const rows = [];
for (const [key, info] of packageKeys) {
  const name = parseName(key);
  rows.push({
    name,
    version: info.version ?? parseVersion(key),
    packageKey: key,
    dependencyType: declaredNames.has(name) ? 'direct' : 'transitive',
  });
}
rows.sort((a, b) => (a.name < b.name ? -1 : 1));

// Container images referenced by compose stacks.
const compose = ['docker/compose.yaml', 'docker/hml/compose.yaml', 'docker/prod/compose.yaml'];
const images = new Set();
for (const file of compose) {
  try {
    const text = readFileSync(join(ROOT, file), 'utf8');
    for (const match of text.matchAll(/image:\s*([^\s#]+)/g)) images.add(match[1].trim());
  } catch {
    /* optional */
  }
}

const sbom = {
  spdxVersion: 'SPDX-2.3',
  dataLicense: 'CC0-1.0',
  name: 'cisne-rondonia',
  documentNamespace: `https://cisne.example/sbom/${Date.now()}`,
  created: new Date().toISOString(),
  packages: rows,
  containers: [...images].sort(),
  nodeRuntime: process.versions.node,
};

const out =
  process.argv.includes('--out')
    ? process.argv[process.argv.indexOf('--out') + 1]
    : join(ROOT, 'artifacts', 'release', 'sbom.json');

writeFileSync(out, `${JSON.stringify(sbom, null, 2)}\n`, 'utf8');
console.log(`[sbom] packages=${rows.length} containers=${sbom.containers.length} -> ${out}`);
