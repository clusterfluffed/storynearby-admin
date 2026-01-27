/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['supabase.co'],
  },
}

module.exports = nextConfig
