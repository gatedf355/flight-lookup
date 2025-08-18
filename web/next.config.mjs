import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config){ config.resolve.alias['@']=path.resolve(__dirname); return config },
  async rewrites(){
    if(process.env.NODE_ENV==='development'){
      return [{ source:'/api/:path*', destination:'http://localhost:4000/api/:path*' }]
    }
    const backend = process.env.BACKEND_URL
    return backend ? [{ source:'/api/:path*', destination:`${backend}/api/:path*` }] : []
  },
}
export default nextConfig
