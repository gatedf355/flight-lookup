import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config){ config.resolve.alias['@']=path.resolve(__dirname); return config },
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [{ source: '/api/:path*', destination: 'http://localhost:4000/api/:path*' }]
    }
    const raw = process.env.BACKEND_URL || ''
    const base = raw.startsWith('http') ? raw : (raw ? `https://${raw}` : '')
    return base ? [{ source: '/api/:path*', destination: `${base}/api/:path*` }] : []
  },
}
export default nextConfig
