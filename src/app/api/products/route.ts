export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getD1Products } from '@/lib/d1';
import { resolveD1Binding } from '@/lib/d1-remote';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const search = searchParams.get('search') || undefined;

    const d1Binding = resolveD1Binding();

    const products = await getD1Products({
      category,
      search,
      status,
      d1Binding,
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาดในการโหลดรายการสินค้า' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อสินค้า' }, { status: 400 });
    }

    const description = String(body.description || '').trim();
    const category = String(body.category || 'Bakery').trim() || 'Bakery';
    const price = Number(body.price);
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: 'ราคาต้องเป็นตัวเลขที่ถูกต้อง' }, { status: 400 });
    }
    const stock = parseInt(String(body.stock ?? 0), 10);
    if (isNaN(stock) || stock < 0) {
      return NextResponse.json({ error: 'จำนวนสต็อกต้องไม่ติดลบ' }, { status: 400 });
    }
    const initialStockRaw = parseInt(String(body.initialStock ?? stock), 10);
    const initialStock = !isNaN(initialStockRaw) && initialStockRaw >= 0 ? initialStockRaw : stock;
    const status = body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    let hasPrimary = false;
    const rawImages = Array.isArray(body.images) ? body.images : [];
    const normalizedImages = rawImages
      .map((img: any, index: number) => {
        if (typeof img === 'string') {
          const isPrimary = !hasPrimary;
          hasPrimary = true;
          return { imageUrl: img.trim(), isPrimary, displayOrder: index + 1 };
        }
        if (img && typeof img === 'object' && img.imageUrl) {
          const isPrimary = Boolean(img.isPrimary) || (!hasPrimary && index === 0);
          if (isPrimary) hasPrimary = true;
          return {
            imageUrl: String(img.imageUrl).trim(),
            isPrimary,
            displayOrder: Number(img.displayOrder ?? index + 1),
          };
        }
        return null;
      })
      .filter((img: any): img is { imageUrl: string; isPrimary: boolean; displayOrder: number } =>
        Boolean(img && img.imageUrl)
      );

    if (normalizedImages.length > 0 && !normalizedImages.some((i: any) => i.isPrimary)) {
      normalizedImages[0].isPrimary = true;
    }

    const d1Binding = resolveD1Binding();
    if (d1Binding) {
      const productId = crypto.randomUUID();
      const now = new Date().toISOString();

      await d1Binding
        .prepare(
          `INSERT INTO Product (id, name, description, price, stock, initialStock, sold, category, status, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`
        )
        .bind(productId, name, description, price, stock, initialStock, category, status, now, now)
        .run();

      const createdImages: any[] = [];
      for (const img of normalizedImages) {
        const imgId = crypto.randomUUID();
        await d1Binding
          .prepare(
            `INSERT INTO ProductImage (id, productId, imageUrl, isPrimary, displayOrder)
             VALUES (?, ?, ?, ?, ?)`
          )
          .bind(imgId, productId, img.imageUrl, img.isPrimary ? 1 : 0, img.displayOrder)
          .run();
        createdImages.push({
          id: imgId,
          productId,
          imageUrl: img.imageUrl,
          isPrimary: img.isPrimary,
          displayOrder: img.displayOrder,
        });
      }

      return NextResponse.json(
        {
          id: productId,
          name,
          description,
          price,
          stock,
          initialStock,
          sold: 0,
          category,
          status,
          createdAt: now,
          updatedAt: now,
          images: createdImages,
        },
        { status: 201 }
      );
    }

    const created = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        initialStock,
        category,
        status,
        images: { create: normalizedImages },
      },
      include: { images: { orderBy: { displayOrder: 'asc' } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาดในการสร้างสินค้า' },
      { status: 500 }
    );
  }
}
