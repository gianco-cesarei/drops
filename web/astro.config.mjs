import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import { loadEnv } from 'vite'

const productionBuild = process.argv.includes('build')
const fileEnv = loadEnv(productionBuild ? 'production' : 'development', process.cwd(), '')
const publicApiUrl = process.env.PUBLIC_API_URL ?? fileEnv.PUBLIC_API_URL

if (productionBuild && !publicApiUrl?.trim()) {
  throw new Error('PUBLIC_API_URL is required for production builds.')
}

export default defineConfig({
  integrations: [react()],
})
