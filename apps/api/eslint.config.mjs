import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createConfig } from '@cisne/eslint-config/base';

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default createConfig(tsconfigRootDir, 'node');
