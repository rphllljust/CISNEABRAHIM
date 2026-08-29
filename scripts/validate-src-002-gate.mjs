import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC_002_PATH = resolve('docs/inputs/SRC-002-business-baseline-confirmation.md');

function parseGateBlock(content) {
  const match = content.match(/```gate\r?\n([\s\S]*?)```/);
  if (!match) {
    return null;
  }

  const block = {};
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf(':');
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    block[key] = value;
  }
  return block;
}

function main() {
  const content = readFileSync(SRC_002_PATH, 'utf8');
  const gate = parseGateBlock(content);

  if (!gate) {
    console.error('SRC-002 gate block missing. Expected ```gate ... ``` in', SRC_002_PATH);
    process.exit(1);
  }

  const blockers = Number.parseInt(gate.mandatory_blockers_count ?? 'NaN', 10);
  const signaturePending =
    gate.signed_by === 'PENDING_HUMAN_CONFIRMATION' || gate.signed_by === '';

  if (gate.status === 'BLOCKED_BY_SIGNATURE_ONLY') {
    if (
      gate.clients_module_ready === 'true' &&
      blockers === 1 &&
      signaturePending &&
      gate.signature_blocker_only === 'true'
    ) {
      console.error('SRC-002 business gate: BLOCKED_BY_SIGNATURE_ONLY');
      console.error('  - Business decisions resolved; human signature pending');
      process.exit(1);
    }
    console.error('SRC-002 business gate: FAIL');
    console.error('  - gate.status is BLOCKED_BY_SIGNATURE_ONLY but preconditions are inconsistent');
    process.exit(1);
  }

  if (gate.status === 'LIBERADO' && gate.clients_module_ready === 'true' && !signaturePending) {
    if (!Number.isFinite(blockers) || blockers > 0) {
      console.error('SRC-002 business gate: FAIL');
      console.error(`  - gate.mandatory_blockers_count is ${gate.mandatory_blockers_count} (required: 0)`);
      process.exit(1);
    }
    console.log('SRC-002 business gate: PASS');
    return;
  }

  const failures = [];
  if (gate.status !== 'LIBERADO') {
    failures.push(`gate.status is "${gate.status ?? 'MISSING'}" (required: LIBERADO)`);
  }
  if (gate.clients_module_ready !== 'true') {
    failures.push(
      `gate.clients_module_ready is "${gate.clients_module_ready ?? 'MISSING'}" (required: true)`,
    );
  }
  if (signaturePending) {
    failures.push('gate.signed_by is pending human confirmation');
  }
  if (!Number.isFinite(blockers) || blockers > 0) {
    failures.push(`gate.mandatory_blockers_count is ${gate.mandatory_blockers_count} (required: 0)`);
  }

  console.error('SRC-002 business gate: FAIL');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

main();
