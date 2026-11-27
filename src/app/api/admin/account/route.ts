export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, comparePassword, hashPassword, signAdminToken } from '@/lib/auth';
import { resolveD1Binding } from '@/lib/d1-remote';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'bibi_admin_token';

// GET /api/admin/account - get current admin profile
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const d1 = resolveD1Binding();
    let admin: any = null;

    if (d1) {
      admin = await d1.prepare('SELECT id, username, role, createdAt FROM Admin WHERE id = ? OR username = ? LIMIT 1')
        .bind(session.id, session.username)
        .first();
    } else {
      admin = await prisma.admin.findFirst({
        where: {
          OR: [{ id: session.id }, { username: session.username }],
        },
        select: { id: true, username: true, role: true, createdAt: true },
      });
    }

    if (!admin) {
      return NextResponse.json({ error: 'ไม่พบบัญชีผู้ดูแลระบบ' }, { status: 404 });
    }

    return NextResponse.json({
      id: admin.id,
      username: admin.username,
      role: admin.role,
      createdAt: admin.createdAt,
    });
  } catch (error: any) {
    console.error('Error fetching admin account:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลบัญชี' }, { status: 500 });
  }
}

// PUT /api/admin/account - change username and/or password
export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newUsername, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json({ error: 'กรุณาระบุรหัสผ่านปัจจุบันเพื่อยืนยันตัวตน' }, { status: 400 });
    }

    const d1 = resolveD1Binding();
    let admin: any = null;

    if (d1) {
      admin = await d1.prepare('SELECT * FROM Admin WHERE id = ? OR username = ? LIMIT 1')
        .bind(session.id, session.username)
        .first();
    } else {
      admin = await prisma.admin.findFirst({
        where: {
          OR: [{ id: session.id }, { username: session.username }],
        },
      });
    }

    if (!admin) {
      return NextResponse.json({ error: 'ไม่พบบัญชีผู้ดูแลระบบ' }, { status: 404 });
    }

    const isMatch = await comparePassword(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 });
    }

    const targetUsername = newUsername && typeof newUsername === 'string' && newUsername.trim()
      ? newUsername.trim()
      : admin.username;

    // Check if new username is already taken by another admin
    if (targetUsername !== admin.username) {
      let duplicate: any = null;
      if (d1) {
        duplicate = await d1.prepare('SELECT id FROM Admin WHERE username = ? AND id != ? LIMIT 1')
          .bind(targetUsername, admin.id)
          .first();
      } else {
        duplicate = await prisma.admin.findFirst({
          where: {
            username: targetUsername,
            NOT: { id: admin.id },
          },
        });
      }

      if (duplicate) {
        return NextResponse.json({ error: `ชื่อผู้ใช้ "${targetUsername}" มีอยู่ในระบบแล้ว` }, { status: 400 });
      }
    }

    let targetPasswordHash = admin.passwordHash;
    if (newPassword && typeof newPassword === 'string' && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
      }
      targetPasswordHash = await hashPassword(newPassword.trim());
    }

    // Update in database
    if (d1) {
      await d1.prepare('UPDATE Admin SET username = ?, passwordHash = ? WHERE id = ?')
        .bind(targetUsername, targetPasswordHash, admin.id)
        .run();
    } else {
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          username: targetUsername,
          passwordHash: targetPasswordHash,
        },
      });
    }

    // Generate fresh JWT token
    const newToken = await signAdminToken({
      id: admin.id,
      username: targetUsername,
      role: admin.role,
    });

    const cookieStore = cookies();
    cookieStore.set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      message: 'อัปเดตข้อมูลบัญชีและความปลอดภัยสำเร็จ',
      admin: {
        id: admin.id,
        username: targetUsername,
        role: admin.role,
      },
      token: newToken,
    });
  } catch (error: any) {
    console.error('Error updating admin account:', error);
    return NextResponse.json({ error: error?.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลบัญชี' }, { status: 500 });
  }
}
