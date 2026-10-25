import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Inline plugin: substitutes `%SITE_URL%` placeholders in index.html at
 * build time. We deliberately use a placeholder that does NOT have a
 * `VITE_` prefix so Vite's native HTML env replacement does not try to
 * substitute it first (which would resolve to empty string when
 * VITE_SITE_URL is unset). The full URL is derived once here from the
 * VITE_SITE_URL env var (or the local default) and applied uniformly.
 */
const siteUrlHtmlPlugin = (siteUrl) => ({
  name: 'rune-voice-site-url-html-env',
  transformIndexHtml(html) {
    return html.split('%SITE_URL%').join(siteUrl)
  },
})

export default defineConfig(({ mode }) => {
  // loadEnv reads .env / .env.local / .env.<mode> / .env.<mode>.local
  // from the project root (process.cwd() when running from web/).
  const env = loadEnv(mode, process.cwd(), '')

  const raw = env.VITE_SITE_URL
  // Strip any trailing slashes so we don't produce malformed URLs like
  // `http://localhost:5173//`.
  const siteUrl =
    (raw && raw.replace(/\/+$/, '')) ||
    (mode === 'production'
      ? 'https://lol.zyyeah.asia'
      : 'http://localhost:5173')

  return {
    plugins: [react(), tailwindcss(), siteUrlHtmlPlugin(siteUrl)],
    server: {
      port: 5173,
      host: true,
      proxy: /^https?:\/\//.test(env.VITE_API_BASE || '')
        ? {
            '/archive-data': {
              target: env.VITE_API_BASE,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/archive-data/, ''),
            },
          }
        : undefined,
    },
  }
})
