import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: './', // This ensures assets are loaded correctly in production
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  publicDir: 'public',
}) 