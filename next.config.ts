/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Requerido para Electron (sin servidor Node en tiempo de ejecución)
  },
};

export default nextConfig;