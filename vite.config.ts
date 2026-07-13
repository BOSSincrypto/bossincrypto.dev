/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Custom domain (bossincrypto.dev) served at root, not a project subpath
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 3100,
    strictPort: true,
    open: false,
  },
  preview: {
    port: 3100,
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Separate React + ReactDOM + Framer Motion into a vendor chunk
          // so the main app chunk stays small and cacheable
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/framer-motion') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'vendor';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
