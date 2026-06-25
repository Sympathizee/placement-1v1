import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/proposal/',
  build: {
    outDir: '../public/proposal',
    emptyOutDir: true,
  }
})
