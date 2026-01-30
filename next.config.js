/** @type {import('next').NextConfig} */
const nextConfig = {
  // Eliminamos output: 'export' para que Railway pueda iniciar el servidor
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Opcional: puedes dejar trailingSlash si te gusta que las URLs terminen en /
  trailingSlash: true,
}

module.exports = nextConfig
