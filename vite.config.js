/* eslint-disable linebreak-style */
/* eslint-disable max-len */
/* eslint-disable eol-last */
/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */
/* eslint-disable new-cap */

import {resolve} from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        movie_app: resolve(__dirname, 'movie_app/index.html'),
        commenting_system: resolve(__dirname, 'commenting_system/index.html'),
      },
    },
  },
  plugins: [
    VitePWA(
        {
          strategies: 'injectManifest',
          devOptions: {
            enabled: true,
            type: 'module',
          },
          injectManifest: {
            globPatterns: ['**/*.html'],
          },
          manifest: {
            name: 'PWA App',
            short_name: 'PWA',
            background_color: '#c0ffee',
            theme_color: '#c0ffee',
            display: 'standalone',
            start_url: '/',
            icons: [
              {
                src: './icon.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable any',
              },
            ],
          },
        },
    ),
  ],
});

