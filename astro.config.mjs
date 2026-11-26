import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://bensnotes.fyi',
  output: 'static',
  build: { format: 'preserve', inlineStylesheets: 'never' },
  devToolbar: { enabled: false },
});
