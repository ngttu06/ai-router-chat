import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow better-sqlite3 native module
  serverExternalPackages: ['better-sqlite3'],
  
  // Disable strict mode for motion/framer-motion compatibility
  reactStrictMode: false,

  // Configure Turbopack to handle server-only packages
  turbopack: {
    resolveAlias: {},
  },
};

export default nextConfig;
