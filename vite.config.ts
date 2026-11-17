/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';

/** Preloads the two above-the-fold font files (Inter + Literata, latin) to speed up LCP and avoid layout shifts. */
function preloadFonts(): Plugin {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml(html, ctx) {
      const files = Object.keys(ctx.bundle ?? {}).filter((f) =>
        /(inter|literata)-latin-wght-normal-.*\.woff2$/.test(f),
      );
      return {
        html,
        tags: files.map((f) => ({
          tag: 'link',
          attrs: { rel: 'preload', href: `/${f}`, as: 'font', type: 'font/woff2', crossorigin: '' },
          injectTo: 'head' as const,
        })),
      };
    },
  };
}

// `vite preview` serves the production CSP from netlify.toml so CSP issues show up locally.
const csp =
  /Content-Security-Policy = "([^"]+)"/.exec(readFileSync('netlify.toml', 'utf8'))?.[1] ?? '';

export default defineConfig({
  preview: {
    headers: { 'Content-Security-Policy': csp.replace('; upgrade-insecure-requests', '') },
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    react(),
    tailwindcss(),
    preloadFonts(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer', // external file: compatible with a strict CSP
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Ma retraite Franco-Suisse',
        short_name: 'Ma retraite',
        description: 'Votre retraite suisse, claire en 2 minutes.',
        lang: 'fr-CH',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FCFBF8',
        theme_color: '#FCFBF8',
        categories: ['finance', 'productivity'],
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Only the latin font subsets are precached; other subsets load on demand.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,txt,xml}', '**/*-latin-*.woff2'],
        globIgnores: ['**/og-image.png', '**/icons/splash/**'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: { target: 'es2022', sourcemap: false },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**/*.ts', 'src/data/**/*.ts', 'src/lib/format.ts'],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
      exclude: ['**/*.test.ts', '**/__tests__/**'],
    },
  },
});
