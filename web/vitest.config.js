import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Lightweight Vitest config. We piggy-back on Vite so the same JSX and
// import resolution rules apply. jsdom is the default for `*.test.js`.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/__tests__/**/*.test.{js,jsx}'],
    globals: false,
  },
})
