import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['alasql'],
  },
  build: {
    commonjsOptions: {
      include: [/alasql/, /node_modules/],
    },
  },
})
