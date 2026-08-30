import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createConfig } from '@cisne/eslint-config/base';

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));
const config = createConfig(tsconfigRootDir, 'node');

for (const block of config) {
  if (block.languageOptions?.parserOptions?.projectService) {
    block.languageOptions.parserOptions = {
      project: ['./tsconfig.eslint.json'],
      tsconfigRootDir,
    };
  }
}

export default config;
