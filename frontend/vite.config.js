import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig(({ mode }) => {
  // Load env so the API base URL is available at build time for HTML injection.
  // loadEnv(mode, cwd, '') loads ALL vars (not only VITE_-prefixed ones).
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  return {
    root: '.',
    publicDir: 'public',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          index:    resolve(__dirname, 'index.html'),
          services: resolve(__dirname, 'services.html'),
          pricing:  resolve(__dirname, 'pricing.html'),
          work:     resolve(__dirname, 'work.html'),
          contact:  resolve(__dirname, 'contact.html'),
          start:    resolve(__dirname, 'start.html'),
        },
      },
    },
    css: {
      devSourcemap: true,
    },
    plugins: [
      /**
       * Inject window.__API_BASE__ into every HTML page before main.js runs.
       * main.js is a plain (non-module) script so it cannot use import.meta.env;
       * reading this global is the standard solution for multi-page Vite apps.
       */
      {
        name: 'inject-api-base',
        transformIndexHtml(html) {
          const tag = `<script>window.__API_BASE__ = ${JSON.stringify(apiBase)};</script>`;
          return html.replace('</head>', `  ${tag}\n</head>`);
        },
      },
      {
        name: 'copy-js-files',
        closeBundle() {
          var files = ['main.js', 'liquid-metal.js'];
          var out = resolve(__dirname, 'dist/src/js');
          mkdirSync(out, { recursive: true });
          files.forEach(function (f) {
            copyFileSync(resolve(__dirname, 'src/js', f), resolve(out, f));
          });
        },
      },
    ],
  };
});
