export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signAdminToken, verifyAdminToken } from '@/lib/auth';
import { resolveD1Binding } from '@/lib/d1-remote';

export const dynamic = 'force-dynamic';

// Lightweight per-isolate sliding-window rate limiter for failed logins
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 15;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry) return false;
  if (now > entry.resetAt) {
    failedAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

// GET /api/admin/login - check authentication status
export async function GET(req: NextRequest) {
  try {
    const token =
      req.cookies.get('bibi_admin_token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = await verifyAdminToken(token);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      admin: session,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

// POST /api/admin/login - verify username/password, generate JWT, set httpOnly cookie bibi_admin_token
export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'มีการพยายามเข้าสู่ระบบผิดพลาดหลายครั้ง กรุณารอสักครู่แล้วลองใหม่' },
        { status: 429, headers: { 'Retry-After': '300' } }
      );
    }

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' },
        { status: 400 }
      );
    }

    let admin: any = null;
    const d1Binding = resolveD1Binding();
    if (d1Binding) {
      admin = await d1Binding.prepare('SELECT * FROM Admin WHERE username = ?')
        .bind(String(username).trim())
        .first();
    } else {
      admin = await prisma.admin.findUnique({
        where: {
          username: String(username).trim(),
        },
      });
    }

    if (!admin) {
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(String(password), admin.passwordHash);
    if (!isMatch) {
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    failedAttempts.delete(clientIp);

    // Generate JWT token
    const token = await signAdminToken({
      id: admin.id,
      username: admin.username,
      role: admin.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
      token,
    });

    // Set HTTP-only cookie (secure only over HTTPS so localhost npm start works over HTTP)
    const isHttps =
      req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';
    response.cookies.set('bibi_admin_token', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
