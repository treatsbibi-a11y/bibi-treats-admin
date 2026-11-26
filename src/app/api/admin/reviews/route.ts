export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { resolveD1Binding } from '@/lib/d1-remote';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function parseImages(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

// GET /api/admin/reviews - list all reviews (VISIBLE + HIDDEN) with stats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const ratingParam = searchParams.get('rating');
    const statusParam = searchParams.get('status');

    const d1Binding = resolveD1Binding();

    let allRows: any[] = [];

    if (d1Binding) {
      try {
        await d1Binding.prepare(`ALTER TABLE Review ADD COLUMN productId TEXT`).bind().run();
      } catch {
        // Column already exists
      }
      try {
        await d1Binding.prepare(`ALTER TABLE Review ADD COLUMN productName TEXT`).bind().run();
      } catch {
        // Column already exists
      }

      const { results } = await d1Binding
        .prepare(
          `SELECT id, customerName, rating, comment, images, productId, productName, status, createdAt, updatedAt
           FROM Review
           ORDER BY datetime(createdAt) DESC`
        )
        .bind()
        .all();

      allRows = (results || []).map((row: any) => ({
        id: row.id,
        customerName: row.customerName,
        rating: Number(row.rating),
        comment: row.comment,
        images: parseImages(row.images),
        productId: row.productId ?? null,
        productName: row.productName ?? null,
        status: row.status === 'HIDDEN' ? 'HIDDEN' : 'VISIBLE',
        createdAt: new Date(row.createdAt).toISOString(),
        updatedAt: new Date(row.updatedAt).toISOString(),
      }));
    } else {
      const rows = await prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
      });
      allRows = rows.map((row) => ({
        id: row.id,
        customerName: row.customerName,
        rating: row.rating,
        comment: row.comment,
        images: parseImages(row.images),
        productId: row.productId ?? null,
        productName: row.productName ?? null,
        status: row.status === 'HIDDEN' ? 'HIDDEN' : 'VISIBLE',
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    }

    const visible = allRows.filter((r) => r.status === 'VISIBLE');
    const hiddenCount = allRows.length - visible.length;
    const avg =
      visible.length > 0
        ? Math.round((visible.reduce((sum, r) => sum + r.rating, 0) / visible.length) * 100) / 100
        : 0;

    let filtered = [...allRows];
    if (ratingParam && ratingParam !== 'all') {
      const targetRating = parseInt(ratingParam, 10);
      if (!isNaN(targetRating)) {
        filtered = filtered.filter((r) => r.rating === targetRating);
      }
    }
    if (statusParam && statusParam !== 'ALL') {
      filtered = filtered.filter((r) => r.status === statusParam);
    }
    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.customerName.toLowerCase().includes(search) ||
          r.comment.toLowerCase().includes(search) ||
          (r.productName && r.productName.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      reviews: filtered,
      stats: {
        totalCount: allRows.length,
        visibleCount: visible.length,
        hiddenCount,
        averageRating: avg,
      },
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลรีวิวได้' },
      { status: 500 }
    );
  }
}
