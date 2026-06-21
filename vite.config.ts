import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // 部署到 GitHub Pages 的子路径：https://kitee0325.github.io/modern-chronicle-cn/
  base: '/modern-chronicle-cn/',
  plugins: [react()],
})
