import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/tests/**/*.test.js', '**/tests/**/*-test.js'],
    verbose: true,
    globals: true
  }
});