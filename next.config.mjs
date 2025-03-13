/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
      // Add fallbacks for Node.js modules (optional, but useful for WebSocket compatibility)
      config.resolve.fallback = { fs: false, net: false, tls: false };
      return config;
    },
  };
  
  export default nextConfig;