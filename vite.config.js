import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// base: './' keeps any emitted paths relative. viteSingleFile then inlines the
// JS and CSS into a single index.html so the built app works from an arbitrarily
// deep sub-directory AND when opened directly via file:// (no module fetches,
// which browsers block over file://).
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
})
