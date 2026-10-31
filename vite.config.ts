/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the site from /weatherscope/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/weatherscope/',
  plugins: [react()],
  test: { environment: 'node' },
})
