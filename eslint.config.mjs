import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'apps/web/.next/**',
      'apps/plugin/main.js',
      'sample-vault/**',
      '**/.obsidian/**',
      'coverage/**',
      '**/*.d.ts',
      'powershell.cmd'
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off', // handled strictly by tsc
      '@typescript-eslint/no-explicit-any': 'off', // allows any in mock/fallback responses
    },
  }
);
