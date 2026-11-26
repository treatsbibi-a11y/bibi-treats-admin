export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { resolveD1Binding } from '@/lib/d1-remote';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// PATCH /api/admin/reviews/[id] - toggle VISIBLE / HIDDEN
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json();
    const status = body.status === 'HIDDEN' ? 'HIDDEN' : body.status === 'VISIBLE' ? 'VISIBLE' : null;

    if (!status) {
      return NextResponse.json(
        { error: 'สถานะรีวิวไม่ถูกต้อง (ต้องเป็น VISIBLE หรือ HIDDEN)' },
        { status: 400 }
      );
    }

    const d1Binding = resolveD1Binding();

    const now = new Date().toISOString();

    if (d1Binding) {
      const existing = await d1Binding
        .prepare(`SELECT id FROM Review WHERE id = ? LIMIT 1`)
        .bind(id)
        .first();

      if (!existing) {
        return NextResponse.json({ error: 'ไม่พบรีวิวที่ต้องการแก้ไข' }, { status: 404 });
      }

      await d1Binding
        .prepare(`UPDATE Review SET status = ?, updatedAt = ? WHERE id = ?`)
        .bind(status, now, id)
        .run();

      return NextResponse.json({ id, status, updatedAt: now });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating review status:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะรีวิว' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews/[id] - permanently delete review
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;

    const d1Binding = resolveD1Binding();

    if (d1Binding) {
      await d1Binding.prepare(`DELETE FROM Review WHERE id = ?`).bind(id).run();
      return NextResponse.json({ success: true, id });
    }

    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบรีวิว' },
      { status: 500 }
    );
  }
}
