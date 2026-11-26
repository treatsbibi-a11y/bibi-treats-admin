import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '0',
};

function withSecurityHeaders(res: NextResponse, req: NextRequest): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  const isHttps =
    req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';
  if (isHttps) {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return res;
}

function isProtectedApiRequest(pathname: string, method: string): boolean {
  const m = method.toUpperCase();

  // Public auth & health & static asset routes
  if (
    pathname === '/api/admin/login' ||
    pathname === '/api/admin/logout' ||
    pathname === '/api/settings' ||
    pathname === '/api/cloudflare/status' ||
    pathname === '/api/orders/track'
  ) {
    return false;
  }

  // All other /api/admin/* endpoints require admin auth
  if (pathname.startsWith('/api/admin/')) {
    return true;
  }

  // Orders: GET, PATCH, PUT, DELETE (including /api/orders and /api/orders/[id])
  if (pathname === '/api/orders' || pathname.startsWith('/api/orders/')) {
    return m === 'GET' || m === 'PATCH' || m === 'PUT' || m === 'DELETE' || m === 'POST';
  }

  // Products: mutating endpoints (POST, PUT, PATCH, DELETE) & /images endpoints
  if (pathname === '/api/products' || pathname.startsWith('/api/products/')) {
    return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
  }

  // Upload endpoint
  if (pathname === '/api/upload') {
    return true;
  }

  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/') && isProtectedApiRequest(pathname, req.method)) {
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : undefined;
    const token = req.cookies.get('bibi_admin_token')?.value || bearerToken;

    if (!token) {
      return withSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        req
      );
    }

    const session = await verifyAdminToken(token);
    if (!session) {
      return withSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        req
      );
    }
  }

  return withSecurityHeaders(NextResponse.next(), req);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
