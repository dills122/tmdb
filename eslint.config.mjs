import eslint from '@eslint/js';
import {
  defineConfig,
} from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      '.agents/**',
      '.codex/**',
      '.planning/**',
      'coverage/**',
      'dist/**',
      'node_modules/**',
    ],
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    files: [
      'eslint.config.mjs',
    ],
    extends: [
      eslint.configs.recommended,
    ],
  },
  {
    files: [
      'test/**/*.js',
    ],
    extends: [
      eslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        require: 'readonly',
      },
      sourceType: 'commonjs',
    },
  },
  {
    files: [
      'src/**/*.ts',
    ],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
