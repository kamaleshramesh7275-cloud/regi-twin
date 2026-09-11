import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

// Custom plugin: serve .apk files with the correct Android MIME type
function apkMimePlugin() {
  return {
    name: 'apk-mime-type',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && req.url.endsWith('.apk')) {
          const apkPath = path.join(import.meta.dirname, 'public', path.basename(req.url))
          if (fs.existsSync(apkPath)) {
            const stat = fs.statSync(apkPath)
            res.setHeader('Content-Type', 'application/vnd.android.package-archive')
            res.setHeader('Content-Disposition', `attachment; filename="${path.basename(req.url)}"`)
            res.setHeader('Content-Length', stat.size)
            res.setHeader('Cache-Control', 'no-cache')
            fs.createReadStream(apkPath).pipe(res)
            return
          }
        }
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [
    apkMimePlugin(),
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'maskable-icon-512x512.png'],
      manifest: {
        id: '/?source=pwa',
        name: 'PhysioTwin — Biomechanical Digital Twin & Clinical Intelligence',
        short_name: 'PhysioTwin',
        description: 'Elite 3D biomechanical motion analysis, acute-to-chronic training strain forecasting, and clinical laboratory intelligence.',
        theme_color: '#070A10',
        background_color: '#070A10',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'fullscreen'],
        orientation: 'portrait-primary',
        start_url: '/?source=pwa',
        scope: '/',
        categories: ['health', 'fitness', 'medical'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        shortcuts: [
          {
            name: 'Digital Twin',
            short_name: 'Twin',
            description: 'Inspect 3D holographic digital twin posture and mobility',
            url: '/twin',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Workout Tracker',
            short_name: 'Workouts',
            description: 'Log and analyze training strain and volume',
            url: '/workout',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Clinic Portal',
            short_name: 'Clinic',
            description: 'OCR lab reports and predictive biomarker trends',
            url: '/clinic',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,json}'],
        maximumFileSizeToCacheInBytes: 30000000, // Support 3D models and ONNX/WASM
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:glb|gltf|onnx|wasm|bin)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: '3d-models-and-ai-weights',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/exercises|\/foods\/search|\/analytics\/dashboard|\/clinic\/metrics\/trends/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-read-cache',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
    cors: true,
    proxy: {
      '/analytics': 'http://localhost:8000',
      '/sessions': 'http://localhost:8000',
      '/users': 'http://localhost:8000',
      '/exercises': 'http://localhost:8000',
      '/foods': 'http://localhost:8000',
      '/workouts': 'http://localhost:8000',
      '/meals': 'http://localhost:8000',
      '/nutrition': 'http://localhost:8000',
      '/clinic': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
      '/vitals': 'http://localhost:8000',
      '/wearables': 'http://localhost:8000',
      '/wearable': 'http://localhost:8000',
      '/medications': 'http://localhost:8000',
      '/meds': 'http://localhost:8000',
      '/readiness': 'http://localhost:8000',
      '/wiki': 'http://localhost:8000',
      '/achievements': 'http://localhost:8000',
      '/community': 'http://localhost:8000',
      '/leaderboard': 'http://localhost:8000',
      '/programs': 'http://localhost:8000',
      '/pain': 'http://localhost:8000',
      '/health-connect': 'http://localhost:8000',
      '/reports': 'http://localhost:8000',
      '/captures': 'http://localhost:8000',
      '/api': 'http://localhost:8000',
    }
  }
})
