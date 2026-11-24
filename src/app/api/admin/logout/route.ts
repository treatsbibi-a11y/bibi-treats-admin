export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handleLogout();
}

export async function GET(req: NextRequest) {
  return handleLogout();
}

function handleLogout() {
  const response = NextResponse.json({
    success: true,
    message: 'ออกจากระบบสำเร็จเรียบร้อยแล้ว',
  });

  // Clear the cookie
  response.cookies.delete('bibi_admin_token');
  response.cookies.set('bibi_admin_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
