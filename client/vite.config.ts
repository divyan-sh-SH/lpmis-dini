import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['homedash.svg'],
      manifest: {
        name: 'HomeDash',
        short_name: 'HomeDash',
        description: 'Daily expense tracking and carts wishlist',
        theme_color: '#ffffff',
        background_color: '#f3f4f6',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/homedash.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  server: {
    allowedHosts: ['*'],
  },
});
