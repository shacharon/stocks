/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@stocks/shared', '@stocks/database'],
  env: {
    WORKER_API_URL: process.env.WORKER_API_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;

