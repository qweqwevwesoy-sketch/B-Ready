/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['192.168.50.250', '192.168.0.118'],
  // Disable auto refresh in development to prevent periodic page reloads
  devIndicators: {
    buildActivity: false,
  },
  // Reduce HMR frequency and disable WebSocket HMR for global access
  ...(process.env.NEXT_PUBLIC_DISABLE_HMR === 'true' && {
    devIndicators: {
      buildActivity: false,
    },
    webpack: (config, { dev }) => {
      if (dev) {
        // Disable HMR in development when running globally
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        }
        // Remove HMR plugin
        config.plugins = config.plugins.filter(plugin => {
          return plugin.constructor.name !== 'HotModuleReplacementPlugin'
        })
      }
      return config
    },
  }),
  // Reduce HMR frequency
  experimental: {
    // This helps reduce unnecessary rebuilds
    optimizePackageImports: ['firebase/app', 'firebase/auth', 'socket.io-client'],
  },
  // PWA Configuration
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Service-Worker-Allowed',
          value: '/',
        },
        // Cache busting for global access
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
        {
          key: 'Pragma',
          value: 'no-cache',
        },
        {
          key: 'Expires',
          value: '0',
        },
      ],
    },
  ],
  // SSR Configuration to handle WebSocket connections gracefully
  serverRuntimeConfig: {
    // Server-side configuration
    webSocketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  },
  publicRuntimeConfig: {
    // Client-side configuration
    webSocketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  },
  // Handle dynamic imports for WebSocket-dependent components
  async rewrites() {
    return [
      {
        source: '/api/socket',
        destination: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
      },
    ];
  },
}

module.exports = nextConfig
 
