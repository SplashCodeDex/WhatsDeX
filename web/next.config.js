/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  transpilePackages: ['@whatsdex/shared'],
  reactStrictMode: true,
  swcMinify: true,

  // Image optimization
  images: {
    domains: ['localhost', 'whatsdex.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'WhatsDeX Dashboard',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add custom webpack configurations here

    // Fix React duplicate modules issue - Force single instance
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
      'framer-motion': path.resolve(__dirname, 'node_modules/framer-motion'),
    };

    // Ensure shared folder uses web's React
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      'node_modules'
    ];

    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
    }

    // Add support for SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // Build optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Output configuration
  output: 'standalone',
};

module.exports = nextConfig;