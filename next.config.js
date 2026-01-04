/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['192.168.50.250'],
  eslint: {
    dirs: ['app', 'components', 'lib'],
  },
}

module.exports = nextConfig
