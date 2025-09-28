/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true,
    distDir: 'out',
    basePath: '/digital-garden',
    assetPrefix: '/digital-garden',
    images: {
      unoptimized: true,
    },
  };
  
  module.exports = nextConfig;
  