import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative Pfade: funktioniert auf GitHub Pages unter /<repo>/ und lokal, ohne den Repo-Namen zu kennen.
  base: './',
  test: {
    include: ['src/**/*.test.ts'],
  },
});
