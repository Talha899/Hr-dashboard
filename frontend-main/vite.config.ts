import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/dashboard/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 3005,
    host: '0.0.0.0',
    cors: true,
    origin: 'http://brixalabs.com',
  },
})
