import fs from 'node:fs';
import path from 'node:path';

if (!process.env.CLOUDFLARE_API_TOKEN) {
  try {
    const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || process.env.HOME || '', '.config');
    const wranglerConfig = path.join(appData, 'xdg.config', '.wrangler', 'config', 'default.toml');
    if (fs.existsSync(wranglerConfig)) {
      const toml = fs.readFileSync(wranglerConfig, 'utf8');
      const tokenMatch = toml.match(/oauth_token\s*=\s*"([^"]+)"/);
      const refreshMatch = toml.match(/refresh_token\s*=\s*"([^"]+)"/);
      if (tokenMatch?.[1]) {
        process.env.CF_D1_REMOTE_TOKEN = tokenMatch[1];
      }
      if (refreshMatch?.[1]) {
        process.env.CF_D1_REFRESH_TOKEN = refreshMatch[1];
      }
    }
  } catch {
    // Ignore if wrangler config is unavailable
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '0' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/admin',
        destination: '/',
      },
      {
        source: '/admin/:path*',
        destination: '/:path*',
      },
    ];
  },
};

export default nextConfig;
