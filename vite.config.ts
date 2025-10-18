import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Disable CORS to harden the dev server against cross-origin requests,
    // mitigating the vulnerability reported by the SCA scan.
    cors: false,
  },
})