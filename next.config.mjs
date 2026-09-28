import withPWAInit from '@ducanh2912/next-pwa';
import { getAllowedImageRemotePatterns } from './src/lib/allowedImageHosts.mjs';
import { getSecurityHeadersForNextConfig } from './src/lib/securityHeaders.mjs';

const withPWA = withPWAInit({
  dest: 'public',
  // Отключаем PWA при сборке, если она падает, либо оставляем только для продакшена
  disable: process.env.NODE_ENV === 'development',
  // Service Worker не должен кешировать/ломать NextAuth (OAuth POST → редирект на Google)
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    navigateFallbackDenylist: [/^\/api\//, /^\/_next\/static/],
    runtimeCaching: [
      {
        urlPattern: /\/api\/auth\//,
        handler: 'NetworkOnly',
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma', 'pg'],
  turbopack: {}, 

  experimental: {
    serverActions: {
      allowedOrigins: ["10.165.239.173", "10.187.95.173", "localhost:3000"],
    },
  },
  
  images: {
    remotePatterns: getAllowedImageRemotePatterns(),
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: getSecurityHeadersForNextConfig(),
      },
      // In-site PDF viewer embeds /guides/*.pdf in an iframe.
      // Global headers set XFO DENY + frame-ancestors 'none'; override both here.
      {
        source: '/guides/:file*.pdf',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Content-Security-Policy',
            value: getSecurityHeadersForNextConfig()
              .find((h) => h.key === 'Content-Security-Policy')
              .value.replace("frame-ancestors 'none'", "frame-ancestors 'self'"),
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);