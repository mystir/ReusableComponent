/* eslint-disable linebreak-style */
/* eslint-disable max-len */
/* eslint-disable eol-last */
/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */
/* eslint-disable new-cap */

import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig({
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
            name: 'PWA Comment System App',
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

