import path from 'node:path'
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname)
    return config
  },
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [{ source: '/api/:path*', destination: 'http://localhost:4000/api/:path*' }]
    }
    return []
  },
}
export default nextConfig
