import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        services: resolve(__dirname, 'services.html'),
        pricing: resolve(__dirname, 'pricing.html'),
        work: resolve(__dirname, 'work.html'),
        contact: resolve(__dirname, 'contact.html'),
        start: resolve(__dirname, 'start.html')
      },
    }
  },
  css: {
    devSourcemap: true
  },
  plugins: [
    {
      name: 'copy-js-files',
      closeBundle() {
        var files = ['main.js', 'liquid-metal.js'];
        var out = resolve(__dirname, 'dist/src/js');
        mkdirSync(out, { recursive: true });
        files.forEach(function (f) {
          copyFileSync(resolve(__dirname, 'src/js', f), resolve(out, f));
        });
      }
    }
  ]
});
