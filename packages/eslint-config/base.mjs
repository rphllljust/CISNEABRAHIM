import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * @param {string} tsconfigRootDir Absolute path to package root (apps/api, apps/web, etc.)
 * @param {'node' | 'browser'} env
 */
export function createConfig(tsconfigRootDir, env = 'node') {
  return tseslint.config(
    {
      ignores: ['dist/**', 'build/**', 'coverage/**', 'node_modules/**'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintConfigPrettier,
    {
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        globals: env === 'browser' ? { ...globals.browser } : { ...globals.node },
        parserOptions: {
          projectService: {
            allowDefaultProject: ['*.mjs', '*.js'],
          },
          tsconfigRootDir,
        },
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
      },
    },
  );
}
