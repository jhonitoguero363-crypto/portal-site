import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  // Disable @nuxt/fonts — Google Fonts metadata is unreachable in this network
  ui: {
    fonts: false
  },

  runtimeConfig: {
    dbHost: process.env.NUXT_DB_HOST || '127.0.0.1',
    dbPort: process.env.NUXT_DB_PORT || '3306',
    dbUser: process.env.NUXT_DB_USER || 'root',
    dbPassword: process.env.NUXT_DB_PASSWORD || '',
    dbName: process.env.NUXT_DB_NAME || 'portal_site',
    // Tencent COS (private bucket) — used to sign icon URLs on the server
    cos: {
      secretId: process.env.NUXT_COS_SECRET_ID || '',
      secretKey: process.env.NUXT_COS_SECRET_KEY || '',
      bucket: process.env.NUXT_COS_BUCKET || '',
      region: process.env.NUXT_COS_REGION || '',
      // If objects are under a prefix folder; leave empty when Key == path without leading /
      prefix: process.env.NUXT_COS_PREFIX || '',
      expires: process.env.NUXT_COS_EXPIRES || '3600',
      // Optional custom/CDN domain without protocol
      domain: process.env.NUXT_COS_DOMAIN || ''
    }
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: ''
  },

  // Avoid Vite cold-start failure: Failed to resolve import "#app-manifest"
  experimental: {
    appManifest: false
  },

  vite: {
    resolve: {
      alias: {
        '#app-manifest': fileURLToPath(new URL('./app/stubs/app-manifest.ts', import.meta.url))
      }
    },
    optimizeDeps: {
      exclude: ['#app-manifest']
    }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})

