import withPWAInit from '@ducanh2912/next-pwa';

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

function normalizeAllowedOrigin(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  return raw.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma', 'pg'],
  turbopack: {}, 

  experimental: {
    // 2. ЖЕСТКОЕ ОГРАНИЧЕНИЕ (для исправления Call retries were exceeded)
    workerThreads: false,
    cpus: 1,
    
    serverActions: {
      allowedOrigins: [
        "10.165.239.173",
        "10.187.95.173",
        "localhost:3000",
        // Vercel provides the public hostname without protocol.
        // If it's not allowed, Server Actions will respond 403 Forbidden in production.
        normalizeAllowedOrigin(process.env.VERCEL_URL),
      ].filter(Boolean),
    },
  },
  
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default withPWA(nextConfig);