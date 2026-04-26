import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `./` produces relative asset paths, so the built bundle works whether you
// deploy at `username.github.io/` or at `username.github.io/<repo>/`.
export default defineConfig({
  plugins: [react()],
  base: './',
})
