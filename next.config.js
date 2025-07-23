/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration options
  experimental: {
    serverComponentsExternalPackages: ['mongoose']
  },
  
  // COMPLETELY disable hot reload and fast refresh
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: false,
        ignored: ['**/*'],
      };
      
      if (!isServer) {
        config.resolve.alias = {
          ...config.resolve.alias,
          '@next/react-refresh-utils/runtime': false,
          '@next/react-dev-overlay/lib/client': false,
        };
      }
    }
    return config;
  },
  
  // Disable React strict mode and fast refresh
  reactStrictMode: false,
  
  // ESLint configuration - ignore warnings during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable static optimization for pages that use dynamic features
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  },

  // Environment variables
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GITLAB_CLIENT_ID: process.env.GITLAB_CLIENT_ID,
    GITLAB_CLIENT_SECRET: process.env.GITLAB_CLIENT_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  },

  // Output configuration for deployment (commented out for local dev)
  // output: 'standalone',
}

module.exports = nextConfig