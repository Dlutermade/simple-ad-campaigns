import tsconfigPaths from 'vite-tsconfig-paths';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import { loadEnvFile } from 'process';

loadEnvFile('.env.e2e');

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
    tsconfigPaths(),
  ],
});
