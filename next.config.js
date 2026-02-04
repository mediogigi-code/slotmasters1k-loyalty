/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  
  // ELIMINAMOS 'experimental' porque la opción isrMemoryCacheSize 
  // ya no se usa así en versiones modernas de Next.js y da error en Vercel.

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          // OJO: Si usas subdominios en Kick, es mejor permitir el comodín o verificarlo.
          { key: 'Access-Control-Allow-Origin', value: 'https://kick.com' }, 
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
      {
        source: '/dashboard',
        headers: [
          // Esto está PERFECTO para que tus balances se vean siempre actualizados
          { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
