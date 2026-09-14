import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
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
