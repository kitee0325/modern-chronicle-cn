import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/modern-chronicle-cn/',
  plugins: [react()],
})
