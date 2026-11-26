export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { fetchR2Object } from '@/lib/d1-remote';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filename = params.path?.join('/') || '';
    if (!filename || filename.includes('..') || filename.includes('\\') || filename.includes('\0')) {
      return new NextResponse('File not found', { status: 404 });
    }

    const cleanKey = filename.startsWith('uploads/') ? filename : `uploads/${filename}`;
    const obj = await fetchR2Object(cleanKey);
    if (!obj) {
      return new NextResponse('File not found', { status: 404 });
    }

    return new Response(obj.bytes as any, {
      status: 200,
      headers: {
        'Content-Type': obj.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('File not found', { status: 404 });
  }
}
